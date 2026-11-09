import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { RelatedContentSection } from "@/components/marketing/RelatedContentSection";
import { getTechNewsPostBySlug } from "@/lib/tech-news-content";
import { getRelatedContentGroups } from "@/lib/related-links";
import { sanitizeBlogHtml } from "@/lib/blog-sanitize";
import { getSiteUrl } from "@/lib/site-url";
import { readSiteContent } from "@/lib/content";
import { breadcrumbListJsonLd, techNewsArticleJsonLd } from "@/lib/seo";

// Safety net: on-demand revalidation covers CMS edits, but this bounds staleness
// to an hour even if a revalidatePath call is ever missed.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getTechNewsPostBySlug(slug);
  const site = await readSiteContent();
  if (!article || (article.status ?? "published") !== "published") {
    return { title: "Article not found", robots: { index: false, follow: false } };
  }
  const baseUrl = site.siteUrl.replace(/\/$/, "");
  const canonical = `${baseUrl}/tech-news/${article.slug}`;
  const ogImage = `/tech-news/${article.slug}/opengraph-image`;
  const title = article.seoTitle || article.title;
  const description = article.excerpt || article.description;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | ${site.siteName}`,
      description,
      url: canonical,
      type: "article",
      publishedTime: `${article.date}T00:00:00.000Z`,
      modifiedTime: article.dateUpdated,
      siteName: site.siteName,
      images: article.coverImage
        ? [{ url: article.coverImage, width: 1200, height: 630, alt: title }]
        : [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.siteName}`,
      description,
      images: [article.coverImage || ogImage],
      ...(site.twitterSite
        ? { site: `@${site.twitterSite}`, creator: `@${site.twitterSite}` }
        : {}),
    },
    robots: { index: true, follow: true },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function TechNewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getTechNewsPostBySlug(slug);
  if (!article || (article.status ?? "published") !== "published") notFound();

  const [site, siteUrl, relatedGroups] = await Promise.all([
    readSiteContent(),
    getSiteUrl(),
    getRelatedContentGroups({ path: `/tech-news/${slug}`, techNewsSlug: slug }),
  ]);
  const isoPublished = `${article.date}T00:00:00.000Z`;
  const safeBody = sanitizeBlogHtml(article.body || "");

  const newsLd = techNewsArticleJsonLd({
    siteUrl,
    slug: article.slug,
    headline: article.title,
    description: article.excerpt || article.description,
    datePublished: isoPublished,
    dateModified: article.dateUpdated,
    articleSection: article.category,
    siteName: site.siteName,
    articleBody: safeBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  });

  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Tech News", path: "/tech-news" },
    { name: article.title, path: `/tech-news/${article.slug}` },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={newsLd} />
      <JsonLd data={breadcrumbLd} />
      <MarketingHeader />
      <main>
        <article className="mx-auto max-w-3xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
          <Link
            href="/tech-news"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Tech news
          </Link>
          <header className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {article.category}
            </p>
            <time className="mt-2 block text-sm text-muted-foreground" dateTime={article.date}>
              {formatDate(article.date)} · {article.readTime}
            </time>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              {article.title}
            </h1>
            {article.dek ? (
              <p className="mt-4 text-lg font-medium text-primary/95 leading-relaxed">
                {article.dek}
              </p>
            ) : null}
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {article.excerpt || article.description}
            </p>
          </header>
          <div
            className="blog-article prose prose-invert mt-10 max-w-none"
            dangerouslySetInnerHTML={{ __html: safeBody }}
          />
          <div className="mt-14 border-t border-border/50 pt-8">
            <Link
              href="/tech-news"
              className="text-sm font-medium text-primary hover:underline"
            >
              More tech news →
            </Link>
          </div>
        </article>
        <RelatedContentSection groups={relatedGroups} />
      </main>
      <Footer />
    </div>
  );
}
