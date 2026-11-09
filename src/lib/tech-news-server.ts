import { countWords, readTimeFromWordCount, slugify } from "@/lib/blog-server";
import {
  TECH_NEWS_CATEGORIES,
  type TechNewsCategory,
  type TechNewsPost,
  type TechNewsStatus,
} from "@/lib/tech-news-content";

export { slugify };

const STATUSES = new Set<TechNewsStatus>(["draft", "published"]);
const CATEGORIES = new Set<TechNewsCategory>(TECH_NEWS_CATEGORIES);

/** Sanitises the incoming JSON body to a strict `TechNewsPost` shape (server side). */
export function normaliseTechNewsInput(
  raw: Record<string, unknown>,
  prev?: TechNewsPost,
): Omit<TechNewsPost, "slug"> & { slug: string | undefined } {
  const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
  const optStr = (v: unknown): string | undefined => {
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t.length > 0 ? t : undefined;
  };
  const statusRaw = typeof raw.status === "string" ? raw.status : prev?.status;
  const status: TechNewsStatus = STATUSES.has(statusRaw as TechNewsStatus)
    ? (statusRaw as TechNewsStatus)
    : "published";
  const categoryRaw = typeof raw.category === "string" ? raw.category : prev?.category;
  const category: TechNewsCategory = CATEGORIES.has(categoryRaw as TechNewsCategory)
    ? (categoryRaw as TechNewsCategory)
    : "AI & ML";

  const body = str(raw.body, prev?.body ?? "");
  const wordCount = countWords(body);
  const readTime =
    optStr(raw.readTime) ?? (wordCount > 0 ? readTimeFromWordCount(wordCount) : prev?.readTime ?? "5 min read");

  return {
    slug:
      typeof raw.slug === "string" && raw.slug.trim() ? slugify(raw.slug) : prev?.slug,
    title: str(raw.title, prev?.title ?? "Untitled"),
    seoTitle: optStr(raw.seoTitle) ?? prev?.seoTitle,
    dek: str(raw.dek, prev?.dek ?? ""),
    category,
    description: str(raw.description, prev?.description ?? ""),
    excerpt: optStr(raw.excerpt) ?? prev?.excerpt,
    date: str(raw.date, prev?.date ?? new Date().toISOString().slice(0, 10)),
    dateUpdated: new Date().toISOString(),
    readTime,
    body,
    authorName: optStr(raw.authorName) ?? prev?.authorName,
    status,
    coverImage: optStr(raw.coverImage) ?? prev?.coverImage,
    focusKeyword: optStr(raw.focusKeyword) ?? prev?.focusKeyword,
    wordCount,
  };
}
