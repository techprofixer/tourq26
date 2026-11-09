import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { getServicePage, servicePages } from "@/data/services-content";
import { publishedBlogPosts, readBlogPosts, readSiteContent } from "@/lib/content";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd, faqPageJsonLd, serviceJsonLd, webPageJsonLd } from "@/lib/seo";
import { SupportingProseSection } from "@/components/marketing/SupportingProseSection";
import { ServiceSectionNav } from "@/components/marketing/ServiceSectionNav";
import { RelatedContentSection } from "@/components/marketing/RelatedContentSection";
import { getPublishedPageByPath, getPageBlocks, slugify } from "@/lib/cms/pages";
import { buildPageJsonLd, buildPageMetadata } from "@/lib/cms/metadata";
import { getRelatedContentGroups } from "@/lib/related-links";

// Safety net: on-demand revalidation covers CMS/site-setting edits, but this bounds
// staleness to an hour even if a revalidatePath call is ever missed.
export const revalidate = 3600;

export async function generateStaticParams() {
  return servicePages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await readSiteContent();
  const baseUrl = site.siteUrl.replace(/\/$/, "");

  try {
    const cms = await getPublishedPageByPath(`/services/${slug}`);
    if (cms) return buildPageMetadata(cms, baseUrl);
  } catch {
    /* DB unavailable — fall back */
  }

  const page = getServicePage(slug);
  if (!page) return { title: "Service not found", robots: { index: false, follow: false } };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `${baseUrl}/services/${page.slug}` },
    openGraph: {
      title: `${page.title} | Torq Studio`,
      description: page.description,
      url: `${baseUrl}/services/${page.slug}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const cms = await getPublishedPageByPath(`/services/${slug}`);
    if (cms) {
      const [siteUrl, site] = await Promise.all([getSiteUrl(), readSiteContent()]);
      const schemas = buildPageJsonLd(cms, siteUrl, site.siteName);
      const blocks = getPageBlocks(cms);
      const relatedGroups = await getRelatedContentGroups({ path: cms.path });
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
  } catch {
    /* fall through to static */
  }

  const page = getServicePage(slug);
  if (!page) notFound();

  const [siteUrl, site, allPosts, relatedGroups] = await Promise.all([
    getSiteUrl(),
    readSiteContent(),
    readBlogPosts(),
    getRelatedContentGroups({ path: `/services/${page.slug}` }),
  ]);
  const visiblePosts = publishedBlogPosts(allPosts);

  const relatedPosts = (page.relatedBlogSlugs ?? [])
    .map((s) => visiblePosts.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => p != null);

  const sections = page.sections.map((section) => ({
    ...section,
    id: slugify(section.heading),
  }));

  const faqLd = faqPageJsonLd(page.faqs);
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: page.title, path: `/services/${page.slug}` },
  ]);
  const webLd = webPageJsonLd({
    siteUrl,
    path: `/services/${page.slug}`,
    name: `${page.title} | Torq Studio`,
    description: page.description,
  });
  const serviceLd = serviceJsonLd({
    siteUrl,
    path: `/services/${page.slug}`,
    name: page.title,
    description: page.description,
    siteName: site.siteName,
  });

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={webLd} />
      <JsonLd data={serviceLd} />
      <MarketingHeader />
      <main>
        <section className="hero-band">
          <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pt-32 pb-16 sm:px-6 sm:pt-36 sm:pb-20 lg:px-8 lg:pt-40 lg:pb-[80px]">
            <nav aria-label="Breadcrumb" className="mono-button flex flex-wrap items-center gap-2 text-white/55">
              <Link href="/" className="transition-colors hover:text-white">
                HOME
              </Link>
              <span aria-hidden="true" className="text-white/30">
                /
              </span>
              <Link href="/services" className="transition-colors hover:text-white">
                SERVICES
              </Link>
              <span aria-hidden="true" className="text-white/30">
                /
              </span>
              <span className="text-white/85">{page.title.toUpperCase()}</span>
            </nav>
            <p className="mono-eyebrow mt-8 text-white/55">
              SERVICE · {page.slug.replace(/-/g, " ").toUpperCase()}
            </p>
            <h1 className="display-xxl mt-5 max-w-[20ch] text-white">{page.h1}</h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
              {page.intro}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/contact" className="btn-base btn-white">
                Book a free consultation
              </Link>
              <Link href="/case-studies" className="btn-base btn-ghost-on-dark">
                See case studies
              </Link>
            </div>
          </div>
        </section>

        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <article className="grid gap-12 lg:grid-cols-12">
              <aside className="lg:col-span-4">
                <ServiceSectionNav sections={sections} />
              </aside>

              <div className="lg:col-span-8 lg:max-w-[680px]">
                {sections.map((section, i) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className={
                      i === 0
                        ? "scroll-mt-28"
                        : "mt-12 scroll-mt-28 border-t border-hairline pt-12"
                    }
                  >
                    <h2 className="display-lg text-foreground">{section.heading}</h2>
                    <div
                      className="blog-article mt-5 max-w-none"
                      dangerouslySetInnerHTML={{ __html: section.body }}
                    />
                  </section>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className="mono-eyebrow text-muted-foreground">FAQ</p>
                <h2 className="display-xl mt-4 text-foreground">
                  Questions buyers ask before kickoff.
                </h2>
              </div>
              <ul className="space-y-8 lg:col-span-8 lg:max-w-[680px]">
                {page.faqs.map((f) => (
                  <li key={f.question} className="border-t border-hairline pt-6 first:border-t-0 first:pt-0">
                    <h3 className="display-sm text-foreground">{f.question}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                      {f.answer}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {relatedPosts.length > 0 && (
          <section className="band-light border-t border-hairline">
            <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
              <p className="mono-eyebrow text-muted-foreground">RELATED READING</p>
              <h2 className="display-md mt-4 text-foreground">
                Long-form essays on the same problem space.
              </h2>
              <ul
                className={`mt-8 grid gap-4 ${
                  relatedPosts.length >= 3
                    ? "sm:grid-cols-2 lg:grid-cols-3"
                    : relatedPosts.length === 2
                      ? "max-w-3xl sm:grid-cols-2"
                      : "max-w-sm"
                }`}
              >

                {relatedPosts.map((post) =>
                  post ? (
                    <li key={post.slug}>
                      <Link href={`/blog/${post.slug}`} className="card-flat card-hover group flex h-full flex-col">
                        <p className="mono-eyebrow text-muted-foreground">ARTICLE</p>
                        <h3 className="display-sm mt-4 text-foreground">{post.title}</h3>
                        <p className="mt-3 flex-1 text-[14px] leading-relaxed text-muted-foreground">
                          {post.description}
                        </p>
                        <span className="mono-button mt-5 inline-flex items-center gap-1 border-t border-hairline pt-4 text-foreground transition-transform group-hover:translate-x-0.5">
                          READ →
                        </span>
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          </section>
        )}

        <SupportingProseSection
          id="service-next-step"
          eyebrow="NEXT STEPS"
          heading={`Where ${page.title.toLowerCase()} engagements start.`}
          paragraphs={[
            `The sections above summarise how Torq Studio approaches ${page.title.toLowerCase()} engagements: scope, delivery habits, and common questions from clients. Every organisation has different compliance, team capacity, and timeline pressure — we use discovery to align on those before locking a long-term commitment.`,
            "Browse related reading from the blog when you want deeper essays on estimation, outsourcing security, or launch strategy. When you are ready to talk specifics, the consultation link below is the fastest path to a senior engineer who can respond with honest fit and sequencing.",
          ]}
        />

        <section className="hero-band border-t border-[var(--brand-hairline-on-dark)]">
          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-[80px]">
            <div className="lg:col-span-7">
              <p className="mono-eyebrow text-white/55">START THE CONVERSATION</p>
              <h2 className="display-xl mt-4 text-white">
                Ready to scope a {page.title.toLowerCase()} engagement?
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end">
              <Link href="/contact" className="btn-base btn-white">
                Book a free consultation
              </Link>
              <Link href="/case-studies" className="btn-base btn-ghost-on-dark">
                See case studies →
              </Link>
            </div>
          </div>
        </section>

        <RelatedContentSection groups={relatedGroups} />
      </main>
      <Footer />
    </div>
  );
}
