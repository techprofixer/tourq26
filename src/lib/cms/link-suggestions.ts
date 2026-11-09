import { prisma, withDbTimeout } from "@/lib/db";

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "you", "are", "was", "were",
  "have", "has", "had", "will", "would", "could", "should", "about", "into", "their", "them",
  "then", "than", "when", "what", "which", "who", "how", "why", "can", "our", "out", "not",
  "but", "all", "any", "one", "two", "more", "most", "some", "such", "each", "other", "because",
  "also", "just", "only", "over", "under", "between", "across", "through", "during", "while",
  "before", "after", "again", "here", "there", "these", "those", "being", "been", "doing", "does", "did",
]);

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

export type LinkSuggestion = {
  title: string;
  path: string;
  anchor: string;
  score: number;
  matchedTerms: string[];
};

type Candidate = { title: string; path: string; anchor: string; tokens: Set<string> };

/**
 * Rule-based internal link suggestions: scores published pages, blog posts, and case
 * studies by keyword-token overlap against the current page's focus/secondary keywords
 * and opening body copy. No embeddings/AI call — cheap enough to run on every keystroke.
 */
export async function findInternalLinkSuggestions(input: {
  focusKeyword?: string;
  secondaryKeywords?: string[];
  bodyText?: string;
  excludePath?: string;
  limit?: number;
}): Promise<LinkSuggestion[]> {
  const queryTokens = new Set([
    ...tokenize(input.focusKeyword ?? ""),
    ...(input.secondaryKeywords ?? []).flatMap(tokenize),
    ...tokenize((input.bodyText ?? "").split(/\s+/).slice(0, 150).join(" ")),
  ]);
  if (queryTokens.size === 0) return [];

  const [pages, blogPosts, caseStudies, techNewsPosts] = await Promise.all([
    withDbTimeout(
      prisma.page.findMany({
        where: { status: "PUBLISHED" },
        select: { title: true, path: true, excerpt: true, seo: { select: { focusKeyword: true } } },
        take: 300,
      }),
    ).catch(() => []),
    withDbTimeout(
      prisma.blogPost.findMany({
        where: { status: "published" },
        select: { slug: true, title: true, description: true, focusKeyword: true },
        take: 300,
      }),
    ).catch(() => []),
    withDbTimeout(
      prisma.caseStudyPost.findMany({
        select: { slug: true, title: true, description: true, services: true },
        take: 300,
      }),
    ).catch(() => []),
    withDbTimeout(
      prisma.techNewsPost.findMany({
        where: { status: "published" },
        select: { slug: true, title: true, description: true, focusKeyword: true },
        take: 300,
      }),
    ).catch(() => []),
  ]);

  const candidates: Candidate[] = [
    ...pages.map((p) => ({
      title: p.title,
      path: p.path,
      anchor: (p.seo?.focusKeyword || p.title).trim(),
      tokens: new Set([...tokenize(p.title), ...tokenize(p.excerpt ?? ""), ...tokenize(p.seo?.focusKeyword ?? "")]),
    })),
    ...blogPosts.map((b) => ({
      title: b.title,
      path: `/blog/${b.slug}`,
      anchor: (b.focusKeyword || b.title).trim(),
      tokens: new Set([...tokenize(b.title), ...tokenize(b.description ?? ""), ...tokenize(b.focusKeyword ?? "")]),
    })),
    ...caseStudies.map((c) => ({
      title: c.title,
      path: `/case-studies/${c.slug}`,
      anchor: c.title.trim(),
      tokens: new Set([...tokenize(c.title), ...tokenize(c.description ?? ""), ...c.services.flatMap(tokenize)]),
    })),
    ...techNewsPosts.map((n) => ({
      title: n.title,
      path: `/tech-news/${n.slug}`,
      anchor: (n.focusKeyword || n.title).trim(),
      tokens: new Set([...tokenize(n.title), ...tokenize(n.description ?? ""), ...tokenize(n.focusKeyword ?? "")]),
    })),
  ];

  return candidates
    .filter((c) => c.path !== input.excludePath)
    .map((c) => {
      const matchedTerms = Array.from(new Set([...c.tokens].filter((t) => queryTokens.has(t))));
      return {
        title: c.title,
        path: c.path,
        anchor: c.anchor,
        score: matchedTerms.length,
        matchedTerms: matchedTerms.slice(0, 4),
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit ?? 5);
}
