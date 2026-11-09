import TurndownService from "turndown";
import type { PageType } from "@prisma/client";
import { publishedBlogPosts, readBlogPosts, readSiteContent } from "@/lib/content";
import { readCaseStudies } from "@/lib/case-studies-content";
import { publishedTechNewsPosts, readTechNewsPosts } from "@/lib/tech-news-content";
import { getPageBlocks } from "@/lib/cms/pages";
import { isIndexablePage } from "@/lib/cms/paths";
import { getResolvedFeatureFlags } from "@/lib/feature-flags";
import type { CmsBlock } from "@/lib/cms/blocks";
import { clampAtWord, stripHtmlToText } from "@/lib/seo-generate";

/**
 * /llms.txt (https://llmstxt.org) — a curated Markdown index of the site for LLMs and agents —
 * and /llms-full.txt, the same content expanded inline so an agent can ingest the whole site in a
 * single fetch. Only published, indexable, self-canonical content is included.
 */

type CmsPageRow = {
  title: string;
  path: string;
  type: PageType;
  status: string;
  excerpt: string | null;
  updatedAt: Date;
  blocks: unknown;
  seo: { robotsIndex: boolean; canonical: string | null; metaDescription: string | null } | null;
};

/** Section order + headings for CMS page types. Unlisted types fall under "More pages". */
const CMS_SECTIONS: { type: PageType; label: string }[] = [
  { type: "SERVICE", label: "Services" },
  { type: "SOLUTION", label: "Solutions" },
  { type: "INDUSTRY", label: "Industries" },
  { type: "TECHNOLOGY", label: "Technologies" },
  { type: "LOCATION", label: "Locations" },
  { type: "GUIDE", label: "Guides" },
  { type: "COMPARISON", label: "Comparisons" },
  { type: "GLOSSARY", label: "Glossary" },
];

async function loadCmsPages(siteUrl: string, withBlocks: boolean): Promise<CmsPageRow[]> {
  try {
    const { prisma, withDbTimeout } = await import("@/lib/db");
    const pages = await withDbTimeout(
      prisma.page.findMany({
        where: { status: "PUBLISHED" },
        select: {
          title: true,
          path: true,
          type: true,
          status: true,
          excerpt: true,
          updatedAt: true,
          blocks: withBlocks,
          seo: { select: { robotsIndex: true, canonical: true, metaDescription: true } },
        },
        orderBy: [{ type: "asc" }, { title: "asc" }],
        take: 1000,
      }),
    );
    return (pages as CmsPageRow[]).filter((p) => isIndexablePage(p, siteUrl));
  } catch {
    return [];
  }
}

/** `- [Title](url): note` — the llms.txt link-list format. */
function linkLine(title: string, url: string, note?: string | null): string {
  const n = note ? stripHtmlToText(note) : "";
  return `- [${title}](${url})${n ? `: ${clampAtWord(n, 180)}` : ""}`;
}

function section(heading: string, lines: string[]): string {
  return lines.length ? `## ${heading}\n\n${lines.join("\n")}\n\n` : "";
}

function cmsSections(pages: CmsPageRow[], base: string): string {
  const known = new Set(CMS_SECTIONS.map((s) => s.type));
  const describe = (p: CmsPageRow) => linkLine(p.title, `${base}${p.path}`, p.seo?.metaDescription || p.excerpt);
  return (
    CMS_SECTIONS.map(({ type, label }) =>
      section(label, pages.filter((p) => p.type === type).map(describe)),
    ).join("") + section("More pages", pages.filter((p) => !known.has(p.type)).map(describe))
  );
}

export async function buildLlmsTxtBody(): Promise<string> {
  const site = await readSiteContent();
  const base = site.siteUrl.replace(/\/$/, "");
  const [cmsPages, allBlog, caseStudies, techNews, flags] = await Promise.all([
    loadCmsPages(base, false),
    readBlogPosts().then(publishedBlogPosts),
    readCaseStudies(),
    readTechNewsPosts().then(publishedTechNewsPosts),
    getResolvedFeatureFlags(),
  ]);
  // Flag-gated sections redirect away when off, so they must not be advertised.
  const blog = flags.marketing_blog ? allBlog : [];
  const companyLinks = [
    `- [Home](${base}/): Positioning, services, testimonials`,
    `- [About](${base}/about): Studio story and how we work`,
    ...(flags.marketing_contact_form
      ? [`- [Contact](${base}/contact): Project inquiries — the primary way to start an engagement`]
      : []),
    `- [Services](${base}/services): Service areas overview`,
    `- [Solutions](${base}/solutions): Solution landing pages`,
    `- [Industries](${base}/industries): Industry verticals`,
    `- [Technologies](${base}/technologies): Technology capabilities`,
    ...(flags.torqos_landing ? [`- [torqOS](${base}/torqos): The torqOS business operating system`] : []),
    ...(flags.business_systems_audit
      ? [`- [Business systems](${base}/business-systems): Business automation and custom software for growing businesses, with a free systems audit`]
      : []),
  ];

  const extra = site.llmsTxtExtra.trim();

  return `# ${site.siteName}

> ${site.defaultDescription}

${site.siteName} is a software engineering studio (mobile apps, web, AI integration, consulting). This file is a curated index for language models and agents; canonical content lives on the linked pages. For the full text of every page in one file, fetch [llms-full.txt](${base}/llms-full.txt).

${extra ? `${extra}\n\n` : ""}## Company

${companyLinks.join("\n")}

${cmsSections(cmsPages, base)}${section(
    "Case studies",
    caseStudies.map((c) => linkLine(c.title, `${base}/case-studies/${c.slug}`, c.description)),
  )}${section(
    "Blog",
    blog.slice(0, 100).map((p) => linkLine(p.title, `${base}/blog/${p.slug}`, p.description)),
  )}## Optional

${[
    ...techNews
      .slice(0, 30)
      .map((p) => linkLine(p.title, `${base}/tech-news/${p.slug}`, p.description)),
    `- [Free resources](${base}/freebies): Downloadable checklists and templates`,
    `- [Sitemap](${base}/sitemap.xml): Every public URL`,
    `- [Privacy policy](${base}/privacy)`,
    `- [Terms of use](${base}/terms)`,
  ].join("\n")}
`;
}

// ── llms-full.txt ────────────────────────────────────────────────────────────

let turndown: TurndownService | null = null;
function htmlToMarkdown(html: string): string {
  turndown ??= new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });
  return turndown.turndown(html || "").replace(/\n{3,}/g, "\n\n").trim();
}

/** Renders CMS blocks as Markdown, skipping purely navigational blocks (CTAs, catalogue grids). */
export function blocksToMarkdown(blocks: CmsBlock[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "hero":
        if (b.subheading) out.push(b.subheading);
        break;
      case "summary":
        out.push(`### ${b.heading || "Key takeaways"}\n\n${b.items.map((i) => `- ${i}`).join("\n")}`);
        break;
      case "contentSection":
        out.push(`${b.heading ? `### ${b.heading}\n\n` : ""}${htmlToMarkdown(b.bodyHtml)}`);
        break;
      case "featureGrid":
        out.push(
          `${b.heading ? `### ${b.heading}\n\n` : ""}${b.items
            .map((i) => `- **${i.title}** — ${i.description}`)
            .join("\n")}`,
        );
        break;
      case "faq":
        out.push(
          `### ${b.heading || "FAQ"}\n\n${b.items
            .map((i) => `**${i.question}**\n\n${htmlToMarkdown(i.answer)}`)
            .join("\n\n")}`,
        );
        break;
      default:
        break;
    }
  }
  return out.filter(Boolean).join("\n\n");
}

/** Hard cap so a runaway corpus can't produce a multi-MB response. */
const FULL_TXT_MAX_CHARS = 1_500_000;

export async function buildLlmsFullTxtBody(): Promise<string> {
  const site = await readSiteContent();
  const base = site.siteUrl.replace(/\/$/, "");
  const [cmsPages, allBlog, caseStudies, flags] = await Promise.all([
    loadCmsPages(base, true),
    readBlogPosts().then(publishedBlogPosts),
    readCaseStudies(),
    getResolvedFeatureFlags(),
  ]);
  const blog = flags.marketing_blog ? allBlog : [];

  const docs: string[] = [];
  const doc = (title: string, url: string, updated: string | undefined, body: string) =>
    `## ${title}\n\nURL: ${url}${updated ? `\nUpdated: ${updated.slice(0, 10)}` : ""}\n\n${body.trim()}`;

  for (const p of cmsPages) {
    docs.push(
      doc(p.title, `${base}${p.path}`, p.updatedAt.toISOString(), blocksToMarkdown(getPageBlocks(p))),
    );
  }
  for (const c of caseStudies) {
    docs.push(doc(c.title, `${base}/case-studies/${c.slug}`, c.date, htmlToMarkdown(c.body)));
  }
  for (const p of blog) {
    docs.push(doc(p.title, `${base}/blog/${p.slug}`, p.dateUpdated ?? p.date, htmlToMarkdown(p.body)));
  }

  let body = `# ${site.siteName}\n\n> ${site.defaultDescription}\n\nFull text of ${site.siteName}'s public pages for language models. Index: ${base}/llms.txt\n\n`;
  for (const d of docs) {
    if (body.length + d.length > FULL_TXT_MAX_CHARS) break;
    body += `${d}\n\n---\n\n`;
  }
  return body;
}
