import { prisma, withDbTimeout } from "@/lib/db";

export type TechNewsStatus = "draft" | "published";

export const TECH_NEWS_CATEGORIES = [
  "AI & ML",
  "Cloud",
  "Security",
  "Hardware",
  "DevTools",
  "Startups",
] as const;

export type TechNewsCategory = (typeof TECH_NEWS_CATEGORIES)[number];

export type TechNewsPost = {
  slug: string;
  title: string;
  /** Shorter `<title>` / social title when `title` is long for on-page H1 */
  seoTitle?: string;
  /** Short subtitle shown between the title and excerpt. */
  dek: string;
  category: TechNewsCategory;
  /** Meta description (also used as default excerpt + social snippet) */
  description: string;
  /** Optional short excerpt for cards when description is too SEO-flavoured */
  excerpt?: string;
  date: string;
  /** Auto-stamped on every save (ISO). Powers `dateModified` JSON-LD. */
  dateUpdated?: string;
  readTime: string;
  body: string;
  authorName?: string;
  /** Draft posts are hidden from public listing, JSON-LD, and sitemap. */
  status?: TechNewsStatus;
  coverImage?: string;
  /** Primary keyword used for content-score signals (not rendered). */
  focusKeyword?: string;
  /** Auto-computed word count of the sanitized body. */
  wordCount?: number;
};

/** Posts visible to the public — filters drafts and sorts newest first. */
export function publishedTechNewsPosts(posts: TechNewsPost[]): TechNewsPost[] {
  return [...posts]
    .filter((p) => (p.status ?? "published") === "published")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function toTechNewsPost(row: {
  slug: string;
  title: string;
  seoTitle: string | null;
  dek: string;
  category: string;
  description: string;
  excerpt: string | null;
  date: string;
  dateUpdated: string | null;
  readTime: string;
  body: string;
  authorName: string | null;
  status: string;
  coverImage: string | null;
  focusKeyword: string | null;
  wordCount: number | null;
}): TechNewsPost {
  return {
    slug: row.slug,
    title: row.title,
    seoTitle: row.seoTitle ?? undefined,
    dek: row.dek,
    category: (row.category as TechNewsCategory) ?? "AI & ML",
    description: row.description,
    excerpt: row.excerpt ?? undefined,
    date: row.date,
    dateUpdated: row.dateUpdated ?? undefined,
    readTime: row.readTime,
    body: row.body,
    authorName: row.authorName ?? undefined,
    status: (row.status as TechNewsStatus) ?? "published",
    coverImage: row.coverImage ?? undefined,
    focusKeyword: row.focusKeyword ?? undefined,
    wordCount: row.wordCount ?? undefined,
  };
}

export async function readTechNewsPosts(): Promise<TechNewsPost[]> {
  try {
    const rows = await withDbTimeout(prisma.techNewsPost.findMany());
    return rows.map(toTechNewsPost);
  } catch {
    return [];
  }
}

export async function getTechNewsPostBySlug(slug: string): Promise<TechNewsPost | undefined> {
  try {
    const row = await withDbTimeout(prisma.techNewsPost.findUnique({ where: { slug } }));
    return row ? toTechNewsPost(row) : undefined;
  } catch {
    return undefined;
  }
}

export async function writeTechNewsPosts(posts: TechNewsPost[]): Promise<void> {
  const slugs = posts.map((p) => p.slug);
  await prisma.$transaction([
    prisma.techNewsPost.deleteMany({ where: { slug: { notIn: slugs } } }),
    ...posts.map((p) =>
      prisma.techNewsPost.upsert({
        where: { slug: p.slug },
        create: {
          slug: p.slug,
          title: p.title,
          seoTitle: p.seoTitle,
          dek: p.dek,
          category: p.category,
          description: p.description,
          excerpt: p.excerpt,
          date: p.date,
          dateUpdated: p.dateUpdated,
          readTime: p.readTime,
          body: p.body,
          authorName: p.authorName,
          status: p.status ?? "published",
          coverImage: p.coverImage,
          focusKeyword: p.focusKeyword,
          wordCount: p.wordCount,
        },
        update: {
          title: p.title,
          seoTitle: p.seoTitle,
          dek: p.dek,
          category: p.category,
          description: p.description,
          excerpt: p.excerpt,
          date: p.date,
          dateUpdated: p.dateUpdated,
          readTime: p.readTime,
          body: p.body,
          authorName: p.authorName,
          status: p.status ?? "published",
          coverImage: p.coverImage,
          focusKeyword: p.focusKeyword,
          wordCount: p.wordCount,
        },
      }),
    ),
  ]);
}
