import type { MetadataRoute } from "next";
import { publishedBlogPosts, readBlogPosts } from "@/lib/content";
import { readCaseStudies } from "@/lib/case-studies-content";
import { freebies } from "@/data/freebies";
import { servicePages } from "@/data/services-content";
import { publishedTechNewsPosts, readTechNewsPosts } from "@/lib/tech-news-content";
import { getSiteUrl } from "@/lib/site-url";

function priorityForCmsType(type: string): number {
  switch (type) {
    case "SERVICE":
    case "SOLUTION":
      return 0.85;
    case "INDUSTRY":
    case "TECHNOLOGY":
    case "LOCATION":
      return 0.8;
    case "CASE_STUDY":
      return 0.75;
    case "BLOG":
    case "GUIDE":
      return 0.7;
    case "PROGRAMMATIC":
      return 0.65;
    default:
      return 0.7;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (await getSiteUrl()).replace(/\/$/, "");
  const blogPosts = publishedBlogPosts(await readBlogPosts());
  const caseStudies = await readCaseStudies();
  const techNewsPosts = publishedTechNewsPosts(await readTechNewsPosts());

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/solutions`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/industries`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/technologies`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/case-studies`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/freebies`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/tech-news`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.82 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const freebieUrls: MetadataRoute.Sitemap = freebies.map((f) => ({
    url: `${baseUrl}/freebies/${f.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const blogUrls: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.dateUpdated ?? post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const caseStudyUrls: MetadataRoute.Sitemap = caseStudies.map((c) => ({
    url: `${baseUrl}/case-studies/${c.slug}`,
    lastModified: new Date(c.date),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const techNewsUrls: MetadataRoute.Sitemap = techNewsPosts.map((item) => ({
    url: `${baseUrl}/tech-news/${item.slug}`,
    lastModified: new Date(item.dateUpdated ?? item.date),
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }));

  /** CMS published pages (authoritative when present). */
  const cmsByPath = new Map<string, MetadataRoute.Sitemap[number]>();
  try {
    const { prisma, withDbTimeout } = await import("@/lib/db");
    const cmsPages = await withDbTimeout(
      prisma.page.findMany({
        where: { status: "PUBLISHED" },
        select: {
          path: true,
          updatedAt: true,
          type: true,
          seo: { select: { robotsIndex: true } },
        },
        take: 10000,
      }),
    );
    for (const p of cmsPages) {
      if (p.seo?.robotsIndex === false) continue;
      if (!p.path || p.path === "/") continue;
      cmsByPath.set(p.path, {
        url: `${baseUrl}${p.path}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: priorityForCmsType(p.type),
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
      lastModified: new Date(),
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
    merged.push(entry);
  }

  return merged;
}
