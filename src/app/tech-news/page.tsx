import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { publishedTechNewsPosts, readTechNewsPosts } from "@/lib/tech-news-content";
import { getSiteUrl } from "@/lib/site-url";
import { readSiteContent } from "@/lib/content";
import { breadcrumbListJsonLd, techNewsCollectionJsonLd, webPageJsonLd } from "@/lib/seo";

const PAGE_PATH = "/tech-news";
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [baseUrl, site] = await Promise.all([getSiteUrl(), readSiteContent()]);
  const title = "Tech News";
  const description =
    "Curated technology news on AI, cloud, security, hardware, developer tools, and startups—briefings for builders and product leaders. Updated regularly.";
  const canonical = `${baseUrl}${PAGE_PATH}`;
  const ogTitle = `Tech News | ${site.siteName}`;
  return {
    title,
    description,
    keywords: [
      "technology news",
      "AI news",
      "software engineering",
      "cloud computing",
      "cybersecurity",
      "developer tools",
      "startup news",
      site.siteName,
    ],
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      type: "website",
      siteName: site.siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
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

export default async function TechNewsPage() {
  const [siteUrl, site, allPosts] = await Promise.all([
    getSiteUrl(),
    readSiteContent(),
    readTechNewsPosts(),
  ]);
  const items = publishedTechNewsPosts(allPosts);
  const pageName = `Tech News | ${site.siteName}`;
  const pageDescription =
    "Technology news and analysis for developers, founders, and engineering leaders—AI, cloud, security, and more.";

  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Tech News", path: PAGE_PATH },
  ]);

  const webPageLd = webPageJsonLd({
    siteUrl,
    path: PAGE_PATH,
    name: pageName,
    description: pageDescription,
  });

  const collectionLd = techNewsCollectionJsonLd({
    siteUrl,
    siteName: site.siteName,
    pageName,
    pageDescription,
    articles: items.map((item) => ({
      headline: item.title,
      description: item.excerpt || item.description,
      datePublished: `${item.date}T00:00:00.000Z`,
      articleSection: item.category,
      url: `${siteUrl}/tech-news/${item.slug}`,
    })),
  });

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <JsonLd data={breadcrumbLd} />
        <JsonLd data={webPageLd} />
        <MarketingHeader />
        <main>
          <section className="hero-band">
            <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pt-32 pb-20 sm:px-6 sm:pt-36 sm:pb-24 lg:px-8 lg:pt-40 lg:pb-[80px]">
              <p className="mono-eyebrow text-white/55">TECHNOLOGY BRIEFING</p>
              <h1 className="display-xxl mt-5 text-white">Tech news.</h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
                No stories published yet — check back soon.
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const [featured, ...rest] = items;

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={webPageLd} />
      <JsonLd data={collectionLd} />
      <MarketingHeader />
      <main>
        {/* Hero band — dark */}
        <section className="hero-band">
          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 pt-32 pb-20 sm:px-6 sm:pt-36 sm:pb-24 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pt-40 lg:pb-[80px]">
            <div className="lg:col-span-8">
              <p className="mono-eyebrow text-white/55">TECHNOLOGY BRIEFING</p>
              <h1 className="display-xxl mt-5 text-white">Tech news.</h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
                Signal over noise: what matters for builders, product teams, and leaders
                shipping software. Full articles open on dedicated URLs for sharing
                and SEO.
              </p>
            </div>
            <div className="flex flex-col items-start justify-end gap-3 lg:col-span-4 lg:items-end">
              <p className="mono-label text-white/55">
                UPDATED REGULARLY · OPEN ACCESS
              </p>
            </div>
          </div>
        </section>

        {/* Featured */}
        <section
          aria-labelledby="featured-heading"
          className="band-light border-t border-hairline"
        >
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <p className="mono-eyebrow text-muted-foreground">FEATURED</p>
            <h2 id="featured-heading" className="sr-only">
              Featured story
            </h2>
            <Link
              href={`/tech-news/${featured.slug}`}
              className="card-flat card-hover group mt-4 grid gap-0 overflow-hidden p-0 lg:grid-cols-5"
            >
              <div className="relative min-h-[220px] border-b border-hairline lg:col-span-2 lg:border-b-0 lg:border-r">
                <div className="brand-ribbon absolute inset-0 rounded-none">
                  <div className="ribbon-inner" aria-hidden />
                </div>
              </div>
              <div className="flex flex-col p-8 lg:col-span-3 lg:p-10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="mono-eyebrow inline-flex bg-foreground/95 px-2 py-1.5 text-background">
                    {featured.category.toUpperCase()}
                  </span>
                  <time dateTime={featured.date} className="mono-label text-muted-foreground">
                    {formatDate(featured.date).toUpperCase()}
                  </time>
                  <span className="mono-label text-muted-foreground/60" aria-hidden>
                    ·
                  </span>
                  <span className="mono-label text-muted-foreground">
                    {featured.readTime.toUpperCase()}
                  </span>
                </div>
                <h3 className="display-lg mt-5 text-foreground">{featured.title}</h3>
                <p className="mt-3 text-[16px] leading-[1.5] text-foreground/85">
                  {featured.dek}
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                  {featured.excerpt || featured.description}
                </p>
                <span className="mono-button mt-6 inline-flex items-center gap-1 text-foreground transition-transform group-hover:translate-x-0.5">
                  READ FULL ARTICLE →
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* Latest */}
        <section
          aria-labelledby="latest-heading"
          className="band-light border-t border-hairline"
        >
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mono-eyebrow text-muted-foreground">LATEST</p>
                <h2 id="latest-heading" className="display-md mt-4 text-foreground">
                  Briefings, in order.
                </h2>
                <p className="mt-2 text-[14px] text-muted-foreground">
                  Each headline links to a full article page with canonical URL and
                  structured data.
                </p>
              </div>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/tech-news/${item.slug}`}
                    className="card-flat card-hover group flex h-full flex-col"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono-eyebrow text-foreground">
                        {item.category.toUpperCase()}
                      </span>
                      <span className="mono-label text-muted-foreground/60" aria-hidden>
                        ·
                      </span>
                      <time
                        dateTime={item.date}
                        className="mono-label text-muted-foreground"
                      >
                        {formatDate(item.date).toUpperCase()}
                      </time>
                    </div>
                    <h3 className="display-md mt-5 text-foreground">{item.title}</h3>
                    <p className="mt-3 text-[15px] leading-[1.45] text-foreground/85">
                      {item.dek}
                    </p>
                    <p className="mt-3 flex-1 text-[14px] leading-relaxed text-muted-foreground">
                      {item.excerpt || item.description}
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t border-hairline pt-4">
                      <span className="mono-label text-muted-foreground">
                        {item.readTime.toUpperCase()}
                      </span>
                      <span className="mono-button text-foreground transition-transform group-hover:translate-x-0.5">
                        READ →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
