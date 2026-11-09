import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { readCaseStudies, getCaseStudyBySlug } from "@/lib/case-studies-content";
import { readSiteContent } from "@/lib/content";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd, caseStudyArticleJsonLd } from "@/lib/seo";
import { sanitizeBlogHtml } from "@/lib/blog-sanitize";
import { SupportingProseSection } from "@/components/marketing/SupportingProseSection";
import { RelatedContentSection } from "@/components/marketing/RelatedContentSection";
import { getRelatedContentGroups } from "@/lib/related-links";

// Safety net: on-demand revalidation covers CMS/site-setting edits, but this bounds
// staleness to an hour even if a revalidatePath call is ever missed.
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const caseStudies = await readCaseStudies();
    return caseStudies.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = await getCaseStudyBySlug(slug);
  if (!study) return { title: "Case study not found", robots: { index: false, follow: false } };
  const site = await readSiteContent();
  const metaTitle = study.seoTitle?.trim() || study.title;
  const baseUrl = site.siteUrl.replace(/\/$/, "");
  const ogImage = `/case-studies/${study.slug}/opengraph-image`;
  return {
    title: metaTitle,
    description: study.description,
    alternates: { canonical: `${baseUrl}/case-studies/${study.slug}` },
    openGraph: {
      title: `${metaTitle} | Torq Studio`,
      description: study.description,
      url: `${baseUrl}/case-studies/${study.slug}`,
      type: "article",
      publishedTime: study.date,
      images: [{ url: ogImage, width: 1200, height: 630, alt: metaTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: study.description,
      images: [ogImage],
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

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = await getCaseStudyBySlug(slug);
  if (!study) notFound();

  const [site, siteUrl, relatedGroups] = await Promise.all([
    readSiteContent(),
    getSiteUrl(),
    getRelatedContentGroups({ path: `/case-studies/${study.slug}`, caseStudySlug: study.slug }),
  ]);
  const articleLd = caseStudyArticleJsonLd({
    siteUrl,
    slug: study.slug,
    headline: study.title,
    description: study.description,
    datePublished: study.date,
    siteName: site.siteName,
  });
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Case studies", path: "/case-studies" },
    { name: study.title, path: `/case-studies/${study.slug}` },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      <MarketingHeader />
      <main>
        {/* Hero band — dark */}
        <section className="hero-band">
          <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pt-32 pb-16 sm:px-6 sm:pt-36 sm:pb-20 lg:px-8 lg:pt-40 lg:pb-[80px]">
            <Link
              href="/case-studies"
              className="mono-button inline-flex items-center gap-1 text-white/65 transition-colors hover:text-white"
            >
              ← ALL CASE STUDIES
            </Link>
            <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-7">
                <p className="mono-eyebrow text-white/55">
                  {study.industry.toUpperCase()} · {study.client.toUpperCase()}
                </p>
                <h1 className="display-xxl mt-5 text-white">{study.title}</h1>
                <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
                  {study.description}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <time className="mono-label text-white/65" dateTime={study.date}>
                    {formatDate(study.date).toUpperCase()}
                  </time>
                  <span className="mono-label text-white/45" aria-hidden>·</span>
                  <span className="mono-label text-white/65">
                    {study.readTime.toUpperCase()}
                  </span>
                </div>
              </div>
              <aside className="card-flat-on-dark flex flex-col gap-4 self-start lg:col-span-5">
                <div>
                  <p className="mono-eyebrow text-white/55">CHALLENGE</p>
                  <p className="mt-2 text-[15px] leading-[1.55] text-white/80">
                    {study.challenge}
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="mono-eyebrow text-white/55">OUTCOME</p>
                  <p className="mt-2 text-[15px] leading-[1.55] text-white">
                    {study.outcome}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  {study.services.map((s) => (
                    <span
                      key={s}
                      className="mono-label rounded-[var(--radius-xs)] border border-white/15 px-2 py-1 text-white/75"
                    >
                      {s.toUpperCase()}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="stat-number text-[28px] leading-none text-white">
                    {study.metric}
                  </span>
                  <span className="mono-label text-white/55">
                    {study.metricLabel.toUpperCase()}
                  </span>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Cover image */}
        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <figure className="relative aspect-[2/1] w-full overflow-hidden rounded-[var(--radius-sm)] border border-hairline">
              <Image
                src={study.coverImage}
                alt={study.coverAlt}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </figure>
          </div>
        </section>

        {/* Body */}
        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <div className="grid gap-12 lg:grid-cols-12">
              <aside className="lg:col-span-4">
                <p className="mono-eyebrow text-muted-foreground">CASE STUDY</p>
                <h2 className="display-sm mt-3 text-foreground">{study.title}</h2>
                <p className="mt-4 text-[14px] text-muted-foreground">
                  Filed under {study.industry.toLowerCase()} · {study.readTime}.
                </p>
              </aside>
              <article
                className="blog-article max-w-none lg:col-span-8 lg:max-w-[680px]"
                dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(study.body) }}
              />
            </div>
          </div>
        </section>

        <SupportingProseSection
          id="case-study-related-help"
          eyebrow="PLANNING SOMETHING SIMILAR"
          heading="Reuse the pattern — not the timeline."
          paragraphs={[
            `This overview reflects delivery patterns we use with teams in ${study.industry.toLowerCase()} and adjacent sectors — balancing speed, risk, and maintainability. Names and figures are adjusted where needed, but the engineering and collaboration lessons are representative of how we work.`,
            "If you are comparing partners for mobile, web, AI, or API work, start with the relevant service page for scope models and FAQs, then use the contact form to share constraints. We will suggest a proportionate next step rather than a one-size-fits-all proposal.",
          ]}
        />

        <RelatedContentSection groups={relatedGroups} />

        {/* Closing CTA — dark band */}
        <section className="hero-band border-t border-[var(--brand-hairline-on-dark)]">
          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-[80px]">
            <div className="lg:col-span-7">
              <p className="mono-eyebrow text-white/55">DISCUSS A SIMILAR PROJECT</p>
              <h2 className="display-xl mt-4 text-white">
                Take this pattern further with our team.
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end">
              <Link href="/contact" className="btn-base btn-white">
                Talk to an engineer
              </Link>
              <Link href="/services" className="btn-base btn-ghost-on-dark">
                Explore services →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
