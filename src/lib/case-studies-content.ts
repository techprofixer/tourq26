import { prisma, withDbTimeout } from "@/lib/db";

export type CaseStudy = {
  slug: string;
  title: string;
  /** Optional shorter title for `<title>` / OG when `title` is long for the article H1 */
  seoTitle?: string;
  client: string;
  industry: string;
  /** Industry taxonomy tags (canonical names) used for filtering the case studies index. */
  industries: string[];
  challenge: string;
  outcome: string;
  metric: string;
  metricLabel: string;
  icon?: string;
  /** Cover photo for cards and article header (Unsplash or /public path). */
  coverImage: string;
  coverAlt: string;
  description: string;
  date: string;
  readTime: string;
  services: string[];
  body: string;
};

function toCaseStudy(row: {
  slug: string;
  title: string;
  seoTitle: string | null;
  client: string;
  industry: string;
  industries: string[];
  challenge: string;
  outcome: string;
  metric: string;
  metricLabel: string;
  icon: string | null;
  coverImage: string;
  coverAlt: string;
  description: string;
  date: string;
  readTime: string;
  services: string[];
  body: string;
}): CaseStudy {
  return {
    slug: row.slug,
    title: row.title,
    seoTitle: row.seoTitle ?? undefined,
    client: row.client,
    industry: row.industry,
    industries: row.industries,
    challenge: row.challenge,
    outcome: row.outcome,
    metric: row.metric,
    metricLabel: row.metricLabel,
    icon: row.icon ?? undefined,
    coverImage: row.coverImage,
    coverAlt: row.coverAlt,
    description: row.description,
    date: row.date,
    readTime: row.readTime,
    services: row.services,
    body: row.body,
  };
}

export async function readCaseStudies(): Promise<CaseStudy[]> {
  try {
    const rows = await withDbTimeout(prisma.caseStudyPost.findMany({ orderBy: { sortOrder: "asc" } }));
    return rows.map(toCaseStudy);
  } catch {
    return [];
  }
}

export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | undefined> {
  try {
    const row = await withDbTimeout(prisma.caseStudyPost.findUnique({ where: { slug } }));
    return row ? toCaseStudy(row) : undefined;
  } catch {
    return undefined;
  }
}

export async function writeCaseStudies(items: CaseStudy[]): Promise<void> {
  const slugs = items.map((c) => c.slug);
  await prisma.$transaction([
    prisma.caseStudyPost.deleteMany({ where: { slug: { notIn: slugs } } }),
    ...items.map((c, i) =>
      prisma.caseStudyPost.upsert({
        where: { slug: c.slug },
        create: {
          slug: c.slug,
          title: c.title,
          seoTitle: c.seoTitle,
          client: c.client,
          industry: c.industry,
          industries: c.industries ?? [],
          challenge: c.challenge,
          outcome: c.outcome,
          metric: c.metric,
          metricLabel: c.metricLabel,
          icon: c.icon,
          coverImage: c.coverImage,
          coverAlt: c.coverAlt,
          description: c.description,
          date: c.date,
          readTime: c.readTime,
          services: c.services ?? [],
          body: c.body,
          sortOrder: i,
        },
        update: {
          title: c.title,
          seoTitle: c.seoTitle,
          client: c.client,
          industry: c.industry,
          industries: c.industries ?? [],
          challenge: c.challenge,
          outcome: c.outcome,
          metric: c.metric,
          metricLabel: c.metricLabel,
          icon: c.icon,
          coverImage: c.coverImage,
          coverAlt: c.coverAlt,
          description: c.description,
          date: c.date,
          readTime: c.readTime,
          services: c.services ?? [],
          body: c.body,
          sortOrder: i,
        },
      }),
    ),
  ]);
}
