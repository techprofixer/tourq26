import { publishedBlogPosts, readBlogPosts } from "@/lib/content";
import { publishedTechNewsPosts, readTechNewsPosts } from "@/lib/tech-news-content";
import { getSiteUrl } from "@/lib/site-url";
import { readSiteContent } from "@/lib/content";
import { getResolvedFeatureFlags } from "@/lib/feature-flags";

export const revalidate = 3600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** RSS 2.0 of the newest blog + tech-news posts — for feed readers, aggregators and AI crawlers. */
export async function GET() {
  const [baseUrl, site, blog, news, flags] = await Promise.all([
    getSiteUrl(),
    readSiteContent(),
    readBlogPosts(),
    readTechNewsPosts(),
    getResolvedFeatureFlags(),
  ]);

  const items = [
    ...(flags.marketing_blog
      ? publishedBlogPosts(blog).map((p) => ({
          path: `/blog/${p.slug}`,
          title: p.title,
          description: p.description,
          date: p.dateUpdated ?? p.date,
          category: "Blog",
        }))
      : []),
    ...publishedTechNewsPosts(news).map((p) => ({
      path: `/tech-news/${p.slug}`,
      title: p.title,
      description: p.excerpt || p.description,
      date: p.dateUpdated ?? p.date,
      category: p.category,
    })),
  ]
    .map((i) => ({ ...i, ts: new Date(i.date).getTime() }))
    .filter((i) => !Number.isNaN(i.ts))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 30);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(site.siteName)}</title>
<link>${esc(baseUrl)}</link>
<description>${esc(site.defaultDescription)}</description>
<language>en-IN</language>
<atom:link href="${esc(baseUrl)}/feed.xml" rel="self" type="application/rss+xml"/>
${items
  .map(
    (i) => `<item>
<title>${esc(i.title)}</title>
<link>${esc(baseUrl + i.path)}</link>
<guid isPermaLink="true">${esc(baseUrl + i.path)}</guid>
<pubDate>${new Date(i.ts).toUTCString()}</pubDate>
<category>${esc(i.category)}</category>
<description>${esc(i.description ?? "")}</description>
</item>`,
  )
  .join("\n")}
</channel>
</rss>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
