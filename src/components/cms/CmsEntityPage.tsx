import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { RelatedContentSection } from "@/components/marketing/RelatedContentSection";
import { getPublishedPageByPath, getPageBlocks } from "@/lib/cms/pages";
import { buildPageBreadcrumbs, buildPageJsonLd, buildPageMetadata } from "@/lib/cms/metadata";
import { getSiteUrl } from "@/lib/site-url";
import { readSiteContent } from "@/lib/content";
import { getRelatedContentGroups } from "@/lib/related-links";
import CategoryContact from "@/components/CategoryContact";
import { categoryFromPath, topicForSlug } from "@/lib/contact-topics";

type CmsPage = NonNullable<Awaited<ReturnType<typeof getPublishedPageByPath>>>;

/** Published CMS page for `path`, or null when missing or the DB is unavailable. */
export async function findPublishedPage(path: string): Promise<CmsPage | null> {
  try {
    return await getPublishedPageByPath(path);
  } catch {
    return null;
  }
}

/** Metadata for a CMS page; `fallback` is used when no published page exists. */
export async function cmsPageMetadata(
  path: string,
  fallback: Metadata = { title: "Not found", robots: { index: false, follow: false } },
): Promise<Metadata> {
  const page = await findPublishedPage(path);
  if (!page) return fallback;
  const [siteUrl, site] = await Promise.all([getSiteUrl(), readSiteContent()]);
  return buildPageMetadata(page, siteUrl, site.siteName);
}

/** Renders a published CMS page with header, JSON-LD and footer. */
export async function CmsPageView({
  page,
  showRelated = true,
}: {
  page: CmsPage;
  showRelated?: boolean;
}) {
  const [siteUrl, site, relatedGroups] = await Promise.all([
    getSiteUrl(),
    readSiteContent(),
    showRelated ? getRelatedContentGroups({ path: page.path }) : Promise.resolve(null),
  ]);
  const schemas = buildPageJsonLd(page, siteUrl, site.siteName);
  const blocks = getPageBlocks(page);
  const category = categoryFromPath(page.path);

  return (
    <div className="min-h-screen bg-background">
      {schemas.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}
      <MarketingHeader />
      <main>
        <BlockRenderer blocks={blocks} breadcrumbs={buildPageBreadcrumbs(page)} />
        {relatedGroups ? <RelatedContentSection groups={relatedGroups} /> : null}
        {category ? (
          <CategoryContact
            category={category}
            pageTitle={page.path === `/${page.path.split("/")[1]}` ? undefined : page.title}
            path={page.path}
            topic={category === "services" ? topicForSlug(page.path.split("/").pop()) : undefined}
          />
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

/** CMS-only route: 404s when the page isn't published. */
export async function CmsEntityPage({ path }: { path: string }) {
  const page = await findPublishedPage(path);
  if (!page) notFound();
  return <CmsPageView page={page} />;
}
