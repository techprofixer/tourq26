import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { glossaryTerms } from "@/data/glossary";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd, DEFAULT_OG_IMAGE, INDEXABLE_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getSiteUrl();
  return {
    title: "Software Glossary: MVP, Technical Debt, API Versioning & More",
    description:
      "Plain-language definitions for buyers of custom software: what an MVP is, technical debt, API versioning, retrieval-augmented AI, embedded teams and production readiness.",
    alternates: { canonical: `${baseUrl}/resources/glossary` },
    openGraph: {
      images: [DEFAULT_OG_IMAGE],
      title: "Software Glossary | Torq Studio",
      description: "Plain-language definitions of the terms software buyers ask about.",
      url: `${baseUrl}/resources/glossary`,
    },
    robots: INDEXABLE_ROBOTS,
  };
}

export default async function GlossaryPage() {
  const siteUrl = await getSiteUrl();
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Glossary", path: "/resources/glossary" },
  ]);
  const termSetLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Torq Studio software glossary",
    url: `${siteUrl}/resources/glossary`,
    hasDefinedTerm: glossaryTerms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.def,
      url: `${siteUrl}/resources/glossary#${t.slug}`,
    })),
  };
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={termSetLd} />
      <MarketingHeader />
      <main>
        <section className="hero-band">
          <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pt-32 pb-16 sm:px-6 sm:pt-36 sm:pb-20 lg:px-8 lg:pt-40">
            <p className="mono-eyebrow text-white/55">RESOURCES</p>
            <h1 className="display-xxl mt-5 max-w-[20ch] text-white">Software glossary.</h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
              Plain-language definitions of the terms buyers of custom software ask about.
            </p>
          </div>
        </section>

        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-[80px]">
            <dl className="grid gap-6 sm:grid-cols-2">
              {glossaryTerms.map((t) => (
                <div key={t.slug} id={t.slug} className="card-flat scroll-mt-24">
                  <dt className="display-sm text-foreground">{t.term}</dt>
                  <dd className="mt-2 text-[15px] leading-[1.55] text-muted-foreground">{t.def}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-12 text-[16px] leading-[1.6] text-muted-foreground">
              Have a project in mind?{" "}
              <Link
                href="/contact"
                className="text-foreground underline decoration-[var(--app-hairline)] underline-offset-[3px] hover:decoration-[var(--app-fg)]"
              >
                Book a free consultation
              </Link>{" "}
              or browse the{" "}
              <Link
                href="/blog"
                className="text-foreground underline decoration-[var(--app-hairline)] underline-offset-[3px] hover:decoration-[var(--app-fg)]"
              >
                blog
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
