import type { MetadataRoute } from "next";
import { publishedBlogPosts, readBlogPosts } from "@/lib/content";
import { readCaseStudies } from "@/lib/case-studies-content";
import { freebies } from "@/data/freebies";
import { servicePages } from "@/data/services-content";
import { publishedTechNewsPosts, readTechNewsPosts } from "@/lib/tech-news-content";
import { getSiteUrl } from "@/lib/site-url";
import { isIndexablePage } from "@/lib/cms/paths";
import { getResolvedFeatureFlags } from "@/lib/feature-flags";

// Notes on what Google actually uses (https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap):
// - `lastModified` is used only when it's consistently accurate, so static pages omit it rather
//   than claiming "modified now" on every request (which teaches Google to ignore the field).
// - `changeFrequency` / `priority` are ignored by Google but still read by Bing and others.
// - `images` produces an image sitemap entry, which helps image search + AI visual results.

function absoluteImage(baseUrl: string, src?: string | null): string[] | undefined {
  const s = src?.trim();
  if (!s) return undefined;
  return [/^https?:\/\//i.test(s) ? s : `${baseUrl}${s.startsWith("/") ? "" : "/"}${s}`];
}

function priorityForCmsType(type: string): number {
  switch (type) {
    case "SERVICE":
    case "SOLUTION":
      return 0.85;
    case "INDUSTRY":
    case "TECHNOLOGY":
    case "LOCATION":
      return 0.8;
    case "GUIDE":
    case "COMPARISON":
      return 0.75;
    default:
      return 0.7;
  }
}

function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (await getSiteUrl()).replace(/\/$/, "");
  const [allBlogPosts, caseStudies, allTechNews, flags] = await Promise.all([
    readBlogPosts(),
    readCaseStudies(),
    readTechNewsPosts(),
    getResolvedFeatureFlags(),
  ]);
  // Feature-flagged sections redirect to /feature-unavailable when off — never list redirecting URLs.
  const blogPosts = flags.marketing_blog ? publishedBlogPosts(allBlogPosts) : [];
  const techNewsPosts = publishedTechNewsPosts(allTechNews);

  const newest = (dates: (Date | undefined)[]) =>
    dates.reduce<Date | undefined>((a, b) => (b && (!a || b > a) ? b : a), undefined);

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.9 },
    ...(flags.marketing_contact_form
      ? [{ url: `${baseUrl}/contact`, changeFrequency: "monthly" as const, priority: 0.9 }]
      : []),
    ...(flags.marketing_blog
      ? [
          {
            url: `${baseUrl}/blog`,
            lastModified: newest(blogPosts.map((p) => toDate(p.dateUpdated ?? p.date))),
            changeFrequency: "weekly" as const,
            priority: 0.8,
          },
        ]
      : []),
    ...(flags.torqos_landing
      ? [{ url: `${baseUrl}/torqos`, changeFrequency: "monthly" as const, priority: 0.85 }]
      : []),
    ...(flags.business_systems_audit
      ? [{ url: `${baseUrl}/business-systems`, changeFrequency: "monthly" as const, priority: 0.8 }]
      : []),
    { url: `${baseUrl}/services`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/solutions`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/industries`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/technologies`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/locations`, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${baseUrl}/case-studies`,
      lastModified: newest(caseStudies.map((c) => toDate(c.date))),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    { url: `${baseUrl}/freebies`, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${baseUrl}/tech-news`,
      lastModified: newest(techNewsPosts.map((p) => toDate(p.dateUpdated ?? p.date))),
      changeFrequency: "weekly",
      priority: 0.82,
    },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const freebieUrls: MetadataRoute.Sitemap = freebies.map((f) => ({
    url: `${baseUrl}/freebies/${f.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const blogUrls: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: toDate(post.dateUpdated ?? post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
    images: absoluteImage(baseUrl, post.coverImage),
  }));

  const caseStudyUrls: MetadataRoute.Sitemap = caseStudies.map((c) => ({
    url: `${baseUrl}/case-studies/${c.slug}`,
    lastModified: toDate(c.date),
    changeFrequency: "monthly" as const,
    priority: 0.75,
    images: absoluteImage(baseUrl, c.coverImage),
  }));

  const techNewsUrls: MetadataRoute.Sitemap = techNewsPosts.map((item) => ({
    url: `${baseUrl}/tech-news/${item.slug}`,
    lastModified: toDate(item.dateUpdated ?? item.date),
    changeFrequency: "weekly" as const,
    priority: 0.72,
    images: absoluteImage(baseUrl, item.coverImage),
  }));

  /** Published, indexable, self-canonical CMS pages (authoritative over the static fallbacks). */
  const cmsByPath = new Map<string, MetadataRoute.Sitemap[number]>();
  try {
    const { prisma, withDbTimeout } = await import("@/lib/db");
    const cmsPages = await withDbTimeout(
      prisma.page.findMany({
        where: { status: "PUBLISHED" },
        select: {
          path: true,
          status: true,
          updatedAt: true,
          type: true,
          seo: { select: { robotsIndex: true, canonical: true, ogImageUrl: true } },
        },
        take: 10000,
      }),
    );
    for (const p of cmsPages) {
      if (!isIndexablePage(p, baseUrl)) continue;
      cmsByPath.set(p.path, {
        url: `${baseUrl}${p.path}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: priorityForCmsType(p.type),
        images: absoluteImage(baseUrl, p.seo?.ogImageUrl),
      });
    }
  } catch {
    /* CMS DB optional during build */
  }

  /** Legacy static services only when not already in CMS. */
  const serviceUrls: MetadataRoute.Sitemap = servicePages
    .filter((p) => !cmsByPath.has(`/services/${p.slug}`))
    .map((p) => ({
      url: `${baseUrl}/services/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    }));

  const seen = new Set<string>();
  const merged: MetadataRoute.Sitemap = [];
  for (const entry of [
    ...staticPages,
    ...serviceUrls,
    ...Array.from(cmsByPath.values()),
    ...caseStudyUrls,
    ...freebieUrls,
    ...blogUrls,
    ...techNewsUrls,
  ]) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    // Drop undefined optional keys so the XML has no empty <lastmod>/<image:image> nodes.
    if (!entry.lastModified) delete entry.lastModified;
    if (!entry.images) delete entry.images;
    merged.push(entry);
  }

  return merged;
}
