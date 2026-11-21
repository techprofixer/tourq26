import { z } from "zod";
import type { CmsBlock } from "@/lib/cms/blocks";
import { countWords } from "@/lib/blog-server";
import { TITLE_MAX, DESC_MAX, clampAtWord, stripHtmlToText } from "@/lib/seo-generate";
import { analyzePageSeo, blocksToSeoInput, MIN_BODY_WORDS, type SeoCheck } from "@/lib/seo-analysis";
import { slugify } from "@/lib/slug";

/**
 * Whole-page generation: one model call returns every section of a marketing page, which is then
 * assembled into CMS blocks. Kept pure (no DB / network) so it can be unit-tested and shared by
 * the server task (src/lib/ai/tasks.ts) and the editor.
 */

const nonEmpty = z.string().trim().min(1);

export const fullPageSchema = z.object({
  seo: z.object({
    metaTitle: nonEmpty,
    metaDescription: nonEmpty,
    excerpt: nonEmpty,
    /** The primary keyword the page is written around — echoed back, or chosen by the model when
     *  the editor gave none. The editor adopts it if its own focus-keyword field is empty. */
    focusKeyword: z.string().optional(),
  }),
  hero: z.object({
    eyebrow: z.string().default(""),
    heading: nonEmpty,
    subheading: nonEmpty,
  }),
  takeaways: z.array(nonEmpty).min(2),
  sections: z
    .array(
      z.object({
        eyebrow: z.string().optional(),
        heading: nonEmpty,
        bodyHtml: nonEmpty,
      }),
    )
    .min(2),
  features: z
    .object({
      heading: z.string().default(""),
      items: z.array(z.object({ title: nonEmpty, description: nonEmpty })).default([]),
    })
    .default({ heading: "", items: [] }),
  faqs: z.array(z.object({ question: nonEmpty, answer: nonEmpty })).min(3),
  cta: z.object({
    heading: nonEmpty,
    body: z.string().default(""),
    primaryCtaLabel: z.string().default("Book a free consultation"),
  }),
});

export type FullPageDraft = z.infer<typeof fullPageSchema>;

/**
 * Guarantees an outbound link without spending a second model pass: when no section already links
 * out, appends a "Further reading" line citing the approved sources (editor-listed or curated —
 * never model-invented) to the last section.
 */
export function ensureSourceLink(
  draft: FullPageDraft,
  sources: { url: string; label: string }[],
): FullPageDraft {
  const approved = sources.slice(0, 2);
  if (approved.length === 0 || draft.sections.length === 0) return draft;
  if (draft.sections.some((s) => /<a\b[^>]*href\s*=\s*["']https?:\/\//i.test(s.bodyHtml))) return draft;
  const links = approved.map((x) => `<a href='${x.url}'>${x.label}</a>`).join(", ");
  const sections = [...draft.sections];
  const last = sections[sections.length - 1];
  sections[sections.length - 1] = { ...last, bodyHtml: `${last.bodyHtml}<p>Further reading: ${links}</p>` };
  return { ...draft, sections };
}

/** Generated pages are held to this many words (top-ranking pages average 1,000+). */
export const MIN_PAGE_WORDS = MIN_BODY_WORDS;

/** Paths the model may always link to, even if the DB lookup of published pages is empty. */
export const ALWAYS_LINKABLE = [
  "/contact",
  "/services",
  "/solutions",
  "/industries",
  "/technologies",
  "/locations",
  "/case-studies",
  "/blog",
];

const ANCHOR_RE = /<a\s+[^>]*?href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Models invent URLs. Keep an `<a>` only when its href is a real internal path (a published page,
 * or one of ALWAYS_LINKABLE) or an external URL the editor supplied as an authoritative source —
 * anything else is unwrapped to its visible text so the page never ships a dead or unvetted link.
 */
export function sanitizeLinks(
  html: string,
  allowedPaths: Iterable<string>,
  allowedExternal: Iterable<string> = [],
): string {
  const strip = (u: string) => u.trim().replace(/\/$/, "");
  const internal = new Set([...ALWAYS_LINKABLE, ...allowedPaths].map((p) => strip(p) || "/"));
  const external = new Set([...allowedExternal].map(strip));
  return html.replace(ANCHOR_RE, (_match, href: string, text: string) => {
    if (/^https?:\/\//i.test(href)) {
      const url = strip(href);
      return external.has(url) ? `<a href="${url}">${text}</a>` : text;
    }
    const clean = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
    return internal.has(clean) ? `<a href="${clean}">${text}</a>` : text;
  });
}

/** Normalises a model draft: clamps meta lengths, vets links, trims empties, caps list sizes. */
export function cleanDraft(
  draft: FullPageDraft,
  allowedPaths: Iterable<string> = [],
  allowedExternal: Iterable<string> = [],
): FullPageDraft {
  const paths = [...allowedPaths];
  const externals = [...allowedExternal];
  return {
    ...draft,
    seo: {
      metaTitle: clampAtWord(draft.seo.metaTitle, TITLE_MAX).replace(/…$/, "").trim(),
      metaDescription: clampAtWord(draft.seo.metaDescription, DESC_MAX),
      excerpt: clampAtWord(draft.seo.excerpt, DESC_MAX),
      focusKeyword: draft.seo.focusKeyword?.trim() || undefined,
    },
    takeaways: draft.takeaways.slice(0, 5),
    sections: draft.sections
      .slice(0, 8)
      .map((s) => ({ ...s, bodyHtml: sanitizeLinks(s.bodyHtml, paths, externals) })),
    features: { ...draft.features, items: draft.features.items.slice(0, 6) },
    faqs: draft.faqs.slice(0, 8).map((f) => ({ ...f, answer: sanitizeLinks(f.answer, paths, externals) })),
  };
}

let idCounter = 0;
function blockId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

/**
 * Assembles CMS blocks in the order that reads best to people and answer engines:
 * hero → key takeaways → sections (feature grid after the second) → FAQ → CTA.
 */
export function fullPageToBlocks(draft: FullPageDraft): CmsBlock[] {
  const blocks: CmsBlock[] = [
    {
      type: "hero",
      id: blockId("hero"),
      eyebrow: draft.hero.eyebrow || undefined,
      heading: draft.hero.heading,
      subheading: draft.hero.subheading,
      primaryCtaLabel: "Book a consultation",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "See case studies",
      secondaryCtaHref: "/case-studies",
    },
    { type: "summary", id: blockId("summary"), heading: "Key takeaways", items: draft.takeaways },
  ];

  const hasFeatures = draft.features.items.length > 0;
  draft.sections.forEach((s, i) => {
    blocks.push({
      type: "contentSection",
      id: blockId("section"),
      eyebrow: s.eyebrow?.trim() || undefined,
      heading: s.heading,
      bodyHtml: s.bodyHtml,
    });
    if (hasFeatures && i === Math.min(1, draft.sections.length - 1)) {
      blocks.push({
        type: "featureGrid",
        id: blockId("features"),
        heading: draft.features.heading || undefined,
        items: draft.features.items,
      });
    }
  });

  blocks.push(
    { type: "faq", id: blockId("faq"), heading: "Frequently asked questions", items: draft.faqs },
    {
      type: "cta",
      id: blockId("cta"),
      eyebrow: "START THE CONVERSATION",
      heading: draft.cta.heading,
      body: draft.cta.body || undefined,
      primaryCtaLabel: draft.cta.primaryCtaLabel,
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "See case studies →",
      secondaryCtaHref: "/case-studies",
      dark: true,
    },
  );
  return blocks;
}

export type DraftWarning = { code: string; message: string };

const FILLER_PHRASES = [
  "in today's fast-paced",
  "in today's digital",
  "ever-evolving",
  "game-changer",
  "game changing",
  "cutting-edge",
  "state-of-the-art",
  "revolutionary",
  "unlock the power",
  "take your business to the next level",
  "seamless experience",
  "world-class",
  "best-in-class",
];

/**
 * Content-quality guardrails the SEO analyzer can't see, surfaced to the editor as warnings
 * (never a hard failure — a human reviews before publishing): marketing filler and invented
 * figures. Keyword, length, link and structure scoring is `auditDraft`'s job, not this one's.
 */
export function lintDraft(draft: FullPageDraft): DraftWarning[] {
  const warnings: DraftWarning[] = [];
  const bodyText = [
    draft.hero.heading,
    draft.hero.subheading,
    ...draft.takeaways,
    ...draft.sections.map((s) => `${s.heading} ${stripHtmlToText(s.bodyHtml)}`),
    ...draft.faqs.map((f) => `${f.question} ${stripHtmlToText(f.answer)}`),
  ].join(" ");
  const lower = bodyText.toLowerCase();

  const filler = FILLER_PHRASES.filter((p) => lower.includes(p));
  if (filler.length > 0) {
    warnings.push({ code: "filler", message: `Filler phrases found: ${filler.join(", ")}. Rewrite these with specifics.` });
  }

  // Percentages and multipliers are the most common invented "facts".
  const numbers = bodyText.match(/\b\d{1,3}(?:\.\d+)?\s?(?:%|x\b|×)/g);
  if (numbers && numbers.length > 0) {
    warnings.push({
      code: "unsourced-stats",
      message: `Contains figures (${[...new Set(numbers)].slice(0, 4).join(", ")}). The AI can't verify them — confirm or remove before publishing.`,
    });
  }

  return warnings;
}

/* ───────────────────────── SEO audit (same scorer as the editor sidebar) ───────────────────────── */

export type SeoAuditContext = {
  title: string;
  slug?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  siteUrl?: string;
};

/** Checks a rewrite can actually fix. Anything else (slug, images, social image) needs a human. */
const AI_FIXABLE = new Set([
  "keywordInTitle",
  "metaTitleLength",
  "keywordInMetaDesc",
  "metaDescLength",
  "keywordInH1",
  "keywordEarly",
  "keywordDensity",
  "secondaryKeywords",
  "contentLength",
  "internalLinks",
  "heading",
  "aeoSummary",
  "aeoFaq",
  "aeoQuestionHeadings",
]);

/** Runs the editor's own `analyzePageSeo` over a draft, so generation and the sidebar agree. */
export function auditDraft(draft: FullPageDraft, ctx: SeoAuditContext): SeoCheck[] {
  const blocks = fullPageToBlocks(draft);
  return analyzePageSeo({
    title: ctx.title,
    slug: ctx.slug || slugify(ctx.title),
    metaTitle: draft.seo.metaTitle,
    metaDescription: draft.seo.metaDescription,
    focusKeyword: (ctx.focusKeyword || draft.seo.focusKeyword || "").trim(),
    secondaryKeywords: ctx.secondaryKeywords ?? [],
    siteUrl: ctx.siteUrl,
    hasSocialImage: false,
    ...blocksToSeoInput(blocks),
  });
}

export type SeoAuditSummary = {
  passed: number;
  total: number;
  /** Score of the first draft, before the optimisation pass (equals `passed` if none ran). */
  initialPassed: number;
  /** True when a second pass ran and its draft was kept. */
  optimized: boolean;
  /** Checks still not passing — mostly ones only a person can fix (slug, images, share image). */
  remaining: { id: string; label: string; detail: string; status: "warn" | "fail" }[];
};

export type RefineAudit = {
  /** Plain-language problems for the fix prompt; empty when nothing is worth another pass. */
  issues: string[];
  passed: number;
  total: number;
  remaining: SeoAuditSummary["remaining"];
};

/** Scores a draft and splits the shortfall into what a rewrite can fix vs. what a human must. */
export function refineAudit(draft: FullPageDraft, ctx: SeoAuditContext): RefineAudit {
  const checks = auditDraft(draft, ctx);
  const failing = checks.filter((c) => c.status !== "pass");
  // Outbound links are not here on purpose: `ensureSourceLink` adds them locally, no rewrite needed.
  const fixable = failing.filter((c) => AI_FIXABLE.has(c.id));
  const words = countWords(blocksToSeoInput(fullPageToBlocks(draft)).bodyText);
  const issues = fixable.map((c) => {
    if (c.id !== "keywordDensity" || words === 0) return `${c.label}: ${c.detail}`;
    // A bare percentage doesn't tell a model how much to cut — give it a count and a method.
    const target = Math.max(2, Math.floor(words * 0.015));
    return `${c.label}: ${c.detail} Cut the exact primary keyword phrase to about ${target} mentions in total (keep it in the H1, the meta fields and the first 100 words). Rewrite the other mentions with natural variants — 'this service', a pronoun, a shorter or reworded phrase — or just remove them.`;
  });
  return {
    issues,
    passed: checks.length - failing.length,
    total: checks.length,
    remaining: failing.map((c) => ({
      id: c.id,
      label: c.label,
      detail: c.detail,
      status: c.status === "fail" ? "fail" : "warn",
    })),
  };
}

/** Prompt for the single optimisation pass: the original brief, the current draft, the failures. */
export function buildFixBrief(draft: FullPageDraft, issues: string[], originalBrief: string): string {
  return [
    "You are revising a page draft that failed an automated SEO audit.",
    `Original brief:\n${originalBrief.slice(0, 3500)}`,
    `Current draft (JSON):\n${JSON.stringify(draft)}`,
    `Audit problems to fix:\n${issues.map((i) => `- ${i}`).join("\n")}`,
    "Return the COMPLETE corrected page in the same JSON shape. Change only what is needed to fix every problem above; keep everything that already passes. Never shorten sections to save space — when more length or keyword coverage is needed, add concrete detail. Keep all facts truthful to the brief.",
  ].join("\n\n");
}

/** Words in the assembled page — the same measure the editor's Content length check uses. */
export function draftWordCount(draft: FullPageDraft): number {
  return countWords(blocksToSeoInput(fullPageToBlocks(draft)).bodyText);
}

/** How many words a draft is short of the minimum (0 when long enough). */
export function missingWords(draft: FullPageDraft): number {
  const words = draftWordCount(draft);
  return words >= MIN_PAGE_WORDS ? 0 : MIN_PAGE_WORDS - words + 80; // small margin so trimming can't undo it
}

export const expansionSchema = z.object({ sections: fullPageSchema.shape.sections });

export const EXPANSION_CONTRACT = `Return ONE JSON object: { "sections": [ { "eyebrow": string (2-3 word label), "heading": string, "bodyHtml": string } ] }. Same HTML rules as before (<p>, <ul>, <ol>, <li>, <strong>, <em>, <a>, <h3>; single quotes in attributes).`;

/** Short prompt asking for ONLY the extra sections needed to reach the minimum — far cheaper than rewriting the page. */
export function buildExpandBrief(draft: FullPageDraft, missing: number, originalBrief: string): string {
  const count = Math.min(4, Math.max(2, Math.ceil(missing / 230)));
  return [
    "A page draft is too short. Write ONLY the additional sections it needs; do not repeat or rewrite what exists.",
    `Original brief:\n${originalBrief.slice(0, 2500)}`,
    `Primary keyword: ${draft.seo.focusKeyword || draft.hero.heading}`,
    `Existing section headings (cover different ground):\n${draft.sections.map((s) => `- ${s.heading}`).join("\n")}`,
    `Write ${count} new sections of about ${Math.ceil(missing / count)} words each (at least ${missing} words in total). Add concrete, experience-based detail: real scenarios, what to check first, common mistakes, decision criteria. Mention the primary keyword at most once in total; use variants elsewhere. Never invent statistics, clients or prices.`,
    EXPANSION_CONTRACT,
  ].join("\n\n");
}

/** Appends the new sections just before the end (cleanDraft caps and link-vets them afterwards). */
export function mergeExpansion(draft: FullPageDraft, extra: { sections: FullPageDraft["sections"] }): FullPageDraft {
  return { ...draft, sections: [...draft.sections, ...extra.sections] };
}

/** `FullPageDraft` plus the audit the server attached — what the editor receives. */
export type FullPageResult = FullPageDraft & { audit?: SeoAuditSummary };
