import type { BlogPost, BlogStatus } from "@/lib/content";
import { slugify } from "@/lib/slug";
import { extractTextFromCmsBlocks, stripHtmlToText } from "@/lib/seo-generate";
import { parseBlocks, type CmsBlock } from "@/lib/cms/blocks";

const STATUSES = new Set<BlogStatus>(["draft", "published"]);

/** Strip HTML to plain text and count words — content blocks, when given, count too. */
export function countWords(html: string | undefined, blocks: CmsBlock[] = []): number {
  const plain = [stripHtmlToText(html ?? ""), extractTextFromCmsBlocks(blocks)].filter(Boolean).join(" ");
  return plain ? plain.split(" ").length : 0;
}

/** Words → "N min read" using a 220 wpm baseline. */
export function readTimeFromWordCount(words: number): string {
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

/** Sanitises the incoming JSON body to a strict `BlogPost` shape (server side). */
export function normaliseBlogInput(
  raw: Record<string, unknown>,
  prev?: BlogPost,
): Omit<BlogPost, "slug"> & { slug: string | undefined } {
  const str = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : fallback;
  const optStr = (v: unknown): string | undefined => {
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t.length > 0 ? t : undefined;
  };
  const tags = Array.isArray(raw.tags)
    ? Array.from(
        new Set(
          (raw.tags as unknown[])
            .filter((t): t is string => typeof t === "string")
            .map((t) => t.trim())
            .filter(Boolean),
        ),
      ).slice(0, 12)
    : prev?.tags;
  const statusRaw = typeof raw.status === "string" ? raw.status : prev?.status;
  const status: BlogStatus = STATUSES.has(statusRaw as BlogStatus)
    ? (statusRaw as BlogStatus)
    : "published";

  /** Unlike `optStr`, an explicit empty string clears the field instead of keeping the old value. */
  const clearableStr = (v: unknown, fallback: string | undefined): string | undefined =>
    typeof v === "string" ? v.trim() || undefined : fallback;

  const body = str(raw.body, prev?.body ?? "");
  const blocks = Array.isArray(raw.blocks) ? parseBlocks(raw.blocks) : prev?.blocks;
  const wordCount = countWords(body, blocks);
  const readTime =
    optStr(raw.readTime) ?? (wordCount > 0 ? readTimeFromWordCount(wordCount) : prev?.readTime ?? "5 min read");

  return {
    slug:
      typeof raw.slug === "string" && raw.slug.trim()
        ? slugify(raw.slug)
        : prev?.slug,
    title: str(raw.title, prev?.title ?? "Untitled"),
    seoTitle: optStr(raw.seoTitle) ?? prev?.seoTitle,
    description: str(raw.description, prev?.description ?? ""),
    excerpt: optStr(raw.excerpt) ?? prev?.excerpt,
    date: str(raw.date, prev?.date ?? new Date().toISOString().slice(0, 10)),
    dateUpdated: new Date().toISOString(),
    readTime,
    body,
    authorName: optStr(raw.authorName) ?? prev?.authorName,
    status,
    coverImage: clearableStr(raw.coverImage, prev?.coverImage),
    coverAlt: clearableStr(raw.coverAlt, prev?.coverAlt),
    coverTitle: clearableStr(raw.coverTitle, prev?.coverTitle),
    blocks,
    tags,
    focusKeyword: optStr(raw.focusKeyword) ?? prev?.focusKeyword,
    wordCount,
  };
}
