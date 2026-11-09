import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { RelatedContentSection } from "@/components/marketing/RelatedContentSection";
import { getPublishedPageByPath, getPageBlocks } from "@/lib/cms/pages";
import { buildPageJsonLd, buildPageMetadata } from "@/lib/cms/metadata";
import { getSiteUrl } from "@/lib/site-url";
import { readSiteContent } from "@/lib/content";
import { getRelatedContentGroups } from "@/lib/related-links";

export async function cmsPageMetadata(path: string): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  try {
    const page = await getPublishedPageByPath(path);
    if (page) return buildPageMetadata(page, siteUrl);
  } catch {
    /* DB down */
  }
  return { title: "Not found", robots: { index: false, follow: false } };
}

export async function CmsEntityPage({ path }: { path: string }) {
  let page = null;
  try {
    page = await getPublishedPageByPath(path);
  } catch {
    notFound();
  }
  if (!page) notFound();

  const [siteUrl, site] = await Promise.all([getSiteUrl(), readSiteContent()]);
  const schemas = buildPageJsonLd(page, siteUrl, site.siteName);
  const blocks = getPageBlocks(page);
  const relatedGroups = await getRelatedContentGroups({ path: page.path });

  return (
    <div className="min-h-screen bg-background">
      {schemas.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}
      <MarketingHeader />
      <main>
        <BlockRenderer blocks={blocks} />
        <RelatedContentSection groups={relatedGroups} />
      </main>
      <Footer />
    </div>
  );
}
