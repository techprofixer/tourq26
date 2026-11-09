import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { readSiteContent } from "@/lib/content";
import { buildRobotsRules } from "@/lib/crawlers";

/**
 * Crawl policy — see src/lib/crawlers.ts for the crawler lists.
 * Admin → Brand & SEO controls: `robotsNoIndex` blocks everything (staging), `blockAiTraining`
 * opts out of AI model training while keeping AI search/answer crawlers allowed.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = (await getSiteUrl()).replace(/\/$/, "");
  const site = await readSiteContent();

  return {
    rules: buildRobotsRules({
      noIndex: site.robotsNoIndex,
      blockAiTraining: site.blockAiTraining,
    }),
    ...(site.robotsNoIndex ? {} : { sitemap: `${baseUrl}/sitemap.xml` }),
  };
}
