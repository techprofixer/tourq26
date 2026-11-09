import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { getSiteUrl } from "@/lib/site-url";
import { readSiteContent } from "@/lib/content";
import { breadcrumbListJsonLd, webPageJsonLd } from "@/lib/seo";
import { SupportingProseSection } from "@/components/marketing/SupportingProseSection";
import { getEntityCatalogCards } from "@/lib/entity-catalog";
import { getPublishedPageByPath, getPageBlocks } from "@/lib/cms/pages";
import { buildPageJsonLd, buildPageMetadata } from "@/lib/cms/metadata";

// Safety net: on-demand revalidation covers CMS/entity edits, but this bounds staleness
// to an hour even if a revalidatePath call is ever missed.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getSiteUrl();

  try {
    const cms = await getPublishedPageByPath("/services");
    if (cms) return buildPageMetadata(cms, baseUrl);
  } catch {
    /* DB unavailable — fall back */
  }

  return {
    title: "Services",
    description:
      "Mobile apps, websites and web APIs, AI, remote engineering, and technical consulting—how senior Torq Studio engineers deliver and advise.",
    alternates: { canonical: `${baseUrl}/services` },
    openGraph: {
      title: "Services | Torq Studio",
      description:
        "Industry-grade delivery across mobile, web, AI, and embedded engineering teams.",
      url: `${baseUrl}/services`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ServicesIndexPage() {
  try {
    const cms = await getPublishedPageByPath("/services");
    if (cms) {
      const [siteUrl, site] = await Promise.all([getSiteUrl(), readSiteContent()]);
      const schemas = buildPageJsonLd(cms, siteUrl, site.siteName);
      const blocks = getPageBlocks(cms);
      return (
        <div className="min-h-screen bg-background">
          {schemas.map((data, i) => (
            <JsonLd key={i} data={data} />
          ))}
          <MarketingHeader />
          <main>
            <BlockRenderer blocks={blocks} />
          </main>
          <Footer />
        </div>
      );
    }
  } catch {
    /* fall through to static */
  }

  const [siteUrl, catalog] = await Promise.all([getSiteUrl(), getEntityCatalogCards("SERVICE")]);
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
  ]);
  const webLd = webPageJsonLd({
    siteUrl,
    path: "/services",
    name: "Services | Torq Studio",
    description:
      "Mobile, web, AI, and remote IT — structured delivery, clear ownership, and measurable outcomes.",
  });

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={webLd} />
      <MarketingHeader />
      <main>
        {/* Hero band — dark */}
        <section className="hero-band">
          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 pt-32 pb-20 sm:px-6 sm:pt-36 sm:pb-24 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pt-40 lg:pb-[80px]">
            <div className="lg:col-span-8">
              <p className="mono-eyebrow text-white/55">WHAT WE BUILD &amp; ADVISE ON</p>
              <h1 className="display-xxl mt-5 text-white">
                Services that ship, not roadmaps in PDF.
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
                Senior software engineers offering delivery and consulting. Each page
                covers how we work, what good looks like, and FAQs founders and
                engineering leads actually ask.
              </p>
            </div>
            <div className="flex flex-col items-start justify-end gap-3 lg:col-span-4 lg:items-end">
              <Link href="/contact" className="btn-base btn-white">
                Contact sales
              </Link>
              <Link href="/case-studies" className="btn-base btn-ghost-on-dark">
                See case studies
              </Link>
            </div>
          </div>
        </section>

        <SupportingProseSection
          id="services-how-to-choose"
          eyebrow="CHOOSING AN ENGAGEMENT"
          heading="Match the model to the problem, not the budget."
          paragraphs={[
            "Each service page explains how Torq Studio delivers outcomes — not just a feature list. You will find typical engagement shapes (MVP, retainer, advisory), what good looks like for that discipline, and FAQs drawn from real client conversations.",
            "Mobile and web delivery pages cover store submission, performance, SEO-adjacent concerns for marketing sites, and API stability for partner integrations. AI and automation pages emphasise evaluation, logging, and human review rather than one-off demos. Remote IT and consulting pages describe how embedded squads and short advisory blocks differ from traditional staff aug.",
            "If you are unsure where to start, contact us with your constraints. We will recommend a sensible first step — often a short discovery or architecture review — before proposing a long build contract.",
          ]}
        />

        {/* Service cards — light band, hairline article cards */}
        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <p className="mono-eyebrow text-muted-foreground">SERVICE CATALOGUE</p>
              <p className="display-md max-w-md text-foreground">
                {catalog.length} disciplines — same senior engineers across all of them.
              </p>
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {catalog.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/services/${p.slug}`}
                    className="card-flat card-hover group flex h-full flex-col"
                  >
                    <div className="flex items-center justify-between">
                      <p className="mono-eyebrow text-muted-foreground">
                        {p.category ?? "SERVICE"}
                      </p>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-hairline bg-background">
                        <Image
                          src={p.icon ?? "/images/icons/web.svg"}
                          alt=""
                          width={20}
                          height={20}
                          className="opacity-80"
                          unoptimized
                        />
                      </span>
                    </div>
                    <h2 className="display-md mt-6 text-foreground">{p.title}</h2>
                    {p.description ? (
                      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                        {p.description}
                      </p>
                    ) : null}
                    <span className="mono-button mt-6 inline-flex items-center gap-1 border-t border-hairline pt-4 text-foreground transition-transform group-hover:translate-x-0.5">
                      READ SERVICE OVERVIEW →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <SupportingProseSection
          id="services-after-cards"
          eyebrow="FROM CONVERSATION TO PRODUCTION"
          heading="Every overview links into delivery patterns we actually use."
          paragraphs={[
            "Every service line on this page links to a deeper overview: typical timelines, tooling, testing expectations, and questions buyers forget to ask until late in procurement. We encourage you to read the FAQ blocks — they reflect real objections and edge cases from past engagements.",
            "Mobile and web pages describe how we handle design handoffs, accessibility, performance budgets, and release governance. AI pages stress evaluation datasets, monitoring, and rollback. Remote IT and consulting pages explain squad composition, communication rhythms, and how we measure velocity without gaming story points.",
            "When you are ready to compare Torq Studio with other options, combine these overviews with our case studies and blog. Then use the contact form with a short problem statement — we will reply with a suggested workshop, estimate range, or referral if another partner is a better match.",
          ]}
        />
      </main>
      <Footer />
    </div>
  );
}
