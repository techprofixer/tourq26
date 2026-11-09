import type { CmsBlock } from "@/lib/cms/blocks";

export const TITLE_MAX = 60;
export const DESC_MAX = 155;

/** Strip HTML tags to plain text (SSR-safe). */
export function stripHtmlToText(html: string): string {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Trim to max length on a word boundary when possible. */
export function clampAtWord(text: string, max: number): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > max * 0.55 ? slice.slice(0, lastSpace) : slice;
  return `${base.trim()}…`;
}

function firstSentenceOrChunk(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const match = t.match(/^(.+?[.!?])(\s|$)/);
  if (match && match[1].length >= 40 && match[1].length <= max) {
    return match[1].trim();
  }
  return clampAtWord(t, max);
}

function ensureKeyword(text: string, keyword: string | undefined, max: number): string {
  const kw = (keyword || "").trim();
  if (!kw) return clampAtWord(text, max);
  if (text.toLowerCase().includes(kw.toLowerCase())) return clampAtWord(text, max);
  const withKw = `${text} ${kw}`.trim();
  return clampAtWord(withKw, max);
}

/** Pull readable copy from CMS page blocks for SEO generation. */
export function extractTextFromCmsBlocks(blocks: CmsBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "hero":
        if (block.heading) parts.push(block.heading);
        if (block.subheading) parts.push(block.subheading);
        break;
      case "contentSection":
        if (block.heading) parts.push(block.heading);
        if (block.bodyHtml) parts.push(stripHtmlToText(block.bodyHtml));
        break;
      case "featureGrid":
        if (block.heading) parts.push(block.heading);
        for (const item of block.items) {
          parts.push(`${item.title}. ${item.description}`);
        }
        break;
      case "faq":
        if (block.heading) parts.push(block.heading);
        for (const item of block.items) {
          parts.push(`${item.question} ${item.answer}`);
        }
        break;
      case "cta":
        if (block.heading) parts.push(block.heading);
        if (block.body) parts.push(block.body);
        break;
      default:
        break;
    }
  }
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export type GeneratedSeo = {
  metaTitle: string;
  metaDescription: string;
};

/**
 * Heuristic SEO from page/post content — no API required.
 * Prefer excerpt for descriptions; fall back to body/hero copy.
 */
export function generateSeoFromContent(input: {
  title: string;
  excerpt?: string;
  bodyText?: string;
  focusKeyword?: string;
}): GeneratedSeo {
  const title = (input.title || "").trim();
  const focusKeyword = (input.focusKeyword || "").trim();
  const excerpt = (input.excerpt || "").trim();
  const bodyText = (input.bodyText || "").trim();

  let metaTitle = title || focusKeyword || "Untitled";
  if (focusKeyword && title && !title.toLowerCase().includes(focusKeyword.toLowerCase())) {
    const candidate = `${title} | ${focusKeyword}`;
    metaTitle = candidate.length <= TITLE_MAX ? candidate : title;
  }
  metaTitle = clampAtWord(metaTitle, TITLE_MAX).replace(/…$/, "").trim();

  const descSource =
    excerpt.length >= 40
      ? excerpt
      : bodyText || excerpt || (focusKeyword ? `${title}. Learn more about ${focusKeyword}.` : title);

  let metaDescription = firstSentenceOrChunk(descSource, DESC_MAX);
  metaDescription = ensureKeyword(metaDescription, focusKeyword, DESC_MAX);
  if (metaDescription.length < 50 && bodyText && bodyText !== descSource) {
    metaDescription = ensureKeyword(
      firstSentenceOrChunk(`${metaDescription} ${bodyText}`.trim(), DESC_MAX),
      focusKeyword,
      DESC_MAX,
    );
  }

  return { metaTitle, metaDescription };
}
