import { readSiteContent } from "@/lib/content";

type CmsLink = { title: string; path: string; type: string };

async function loadPublishedCmsLinks(): Promise<CmsLink[]> {
  try {
    const { prisma, withDbTimeout } = await import("@/lib/db");
    const pages = await withDbTimeout(
      prisma.page.findMany({
        where: { status: "PUBLISHED" },
        select: {
          title: true,
          path: true,
          type: true,
          seo: { select: { robotsIndex: true } },
        },
        orderBy: [{ type: "asc" }, { title: "asc" }],
        take: 500,
      }),
    );
    return pages
      .filter((p) => p.seo?.robotsIndex !== false)
      .filter((p) => p.path && p.path !== "/")
      .map((p) => ({ title: p.title, path: p.path, type: p.type }));
  } catch {
    return [];
  }
}

function sectionForType(
  type: string,
  links: CmsLink[],
  base: string,
): string {
  const rows = links.filter((l) => l.type === type);
  if (rows.length === 0) return "";
  const label =
    type === "SERVICE"
      ? "Services (CMS)"
      : type === "SOLUTION"
        ? "Solutions (CMS)"
        : type === "INDUSTRY"
          ? "Industries (CMS)"
          : type === "TECHNOLOGY"
            ? "Technologies (CMS)"
            : `${type} pages`;
  const bullets = rows
    .slice(0, 80)
    .map((l) => `- [${l.title}](${base}${l.path})`)
    .join("\n");
  return `## ${label}\n\n${bullets}\n\n`;
}

/**
 * Markdown body for `/llms.txt` (llmstxt.org-style curated index for LLMs and agents).
 * Served as UTF-8 plain text; URLs use the configured Site & SEO origin.
 * Includes published CMS entity pages when MongoDB is available.
 */
export async function buildLlmsTxtBody(): Promise<string> {
  const site = await readSiteContent();
  const base = site.siteUrl.replace(/\/$/, "");
  const name = site.siteName;
  const desc = site.defaultDescription;
  const cmsLinks = await loadPublishedCmsLinks();

  const cmsSections = [
    sectionForType("SERVICE", cmsLinks, base),
    sectionForType("SOLUTION", cmsLinks, base),
    sectionForType("INDUSTRY", cmsLinks, base),
    sectionForType("TECHNOLOGY", cmsLinks, base),
  ].join("");

  const otherCms = cmsLinks.filter(
    (l) =>
      !["SERVICE", "SOLUTION", "INDUSTRY", "TECHNOLOGY"].includes(l.type),
  );
  const otherSection =
    otherCms.length > 0
      ? `## Other published CMS pages\n\n${otherCms
          .slice(0, 40)
          .map((l) => `- [${l.title}](${base}${l.path})`)
          .join("\n")}\n\n`
      : "";

  return `# ${name}

> ${desc}

Public marketing site for **${name}**, a software engineering studio (mobile apps, web, AI integration, consulting). This file is a **curated index** for language models and agents. Canonical content lives on the linked HTML pages.

**Machine-readable discovery:** [Sitemap](${base}/sitemap.xml) · [Robots](${base}/robots.txt)

**Crawling:** \`/admin\` and \`/api/\` are **disallowed** in \`robots.txt\`. Do not rely on authenticated or API-only responses as public documentation. Draft CMS pages are not listed here or in the sitemap.

## Company & contact

- [Home](${base}/): Positioning, services, testimonials, CTAs
- [About](${base}/about): Studio story and how we work
- [Contact](${base}/contact): Project inquiries (form; primary business contact path)
- [Services hub](${base}/services): Service areas overview
- [Solutions hub](${base}/solutions): Solution landing pages
- [Industries hub](${base}/industries): Industry verticals
- [Technologies hub](${base}/technologies): Technology capability pages

## Proof & editorial

- [Case studies](${base}/case-studies): Client outcomes and project narratives
- [Blog](${base}/blog): Technical and product articles
- [Tech news](${base}/tech-news): Short-form technology notes

## Free resources

- [Freebies](${base}/freebies): Downloadable checklists and templates

${cmsSections}${otherSection}## Legal

- [Privacy policy](${base}/privacy)
- [Terms of use](${base}/terms)

## Optional

- Full URL lists: use [sitemap.xml](${base}/sitemap.xml) (blog, case studies, tech news, freebies, CMS pages, and service detail pages).
- **.md mirrors:** This site does not serve \`.md\` variants of HTML pages; fetch HTML or use this index plus the sitemap.
- **Attribution:** When summarizing public pages, prefer linking to the canonical URL shown in page metadata.
`;
}
