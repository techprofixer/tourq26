import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { readCaseStudies } from "@/lib/case-studies-content";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd, webPageJsonLd } from "@/lib/seo";
import { SupportingProseSection } from "@/components/marketing/SupportingProseSection";
import { CaseStudiesFilterGrid } from "./CaseStudiesFilterGrid";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getSiteUrl();
  return {
    title: "Case studies",
    description:
      "How Torq Studio delivers mobile apps, web platforms, AI solutions, and remote engineering teams—real outcomes across fintech, logistics, e-commerce, and B2B SaaS.",
    alternates: { canonical: `${baseUrl}/case-studies` },
    openGraph: {
      title: "Case studies | Torq Studio",
      description:
        "Deep dives into delivery: architecture, AI in support, platform rebuilds, and API modernisation.",
      url: `${baseUrl}/case-studies`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function CaseStudiesIndexPage() {
  const [siteUrl, caseStudies] = await Promise.all([getSiteUrl(), readCaseStudies()]);
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Case studies", path: "/case-studies" },
  ]);
  const webLd = webPageJsonLd({
    siteUrl,
    path: "/case-studies",
    name: "Case studies | Torq Studio",
    description:
      "How we deliver outcomes for fintech, logistics, e-commerce, and B2B SaaS clients worldwide.",
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
              <p className="mono-eyebrow text-white/55">PROOF IN PRACTICE</p>
              <h1 className="display-xxl mt-5 text-white">Case studies.</h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
                Industry-level write-ups: context, approach, and outcomes. Names
                anonymised where required; patterns and metrics reflect how we work
                with product and engineering leaders.
              </p>
            </div>
            <div className="flex flex-col items-start justify-end gap-3 lg:col-span-4 lg:items-end">
              <Link href="/contact" className="btn-base btn-white">
                Talk to an engineer
              </Link>
              <Link href="/services" className="btn-base btn-ghost-on-dark">
                Service catalogue
              </Link>
            </div>
          </div>
        </section>

        <SupportingProseSection
          id="case-studies-method"
          eyebrow="HOW WE DOCUMENT"
          heading="Real delivery patterns — faithful to how we operate."
          paragraphs={[
            "These case studies describe real delivery patterns — architecture choices, team shape, and outcomes — while respecting confidentiality. You will see anonymised industries and composite timelines where needed, but the technical and organisational lessons are faithful to how we operate.",
            "We work with fintech, logistics, e-commerce, B2B SaaS, and other regulated or high-scale environments. Common threads include shipping production mobile apps, rebuilding web platforms, introducing AI-assisted support without losing human oversight, and modernising APIs without breaking long-tail integrations.",
            "If a story resonates with your roadmap, start from the services overview or book a consultation. We are happy to map a similar engagement model to your constraints, risk tolerance, and internal skills.",
          ]}
        />

        {/* Case study grid */}
        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <p className="mono-eyebrow text-muted-foreground">CASE LIBRARY</p>
            <CaseStudiesFilterGrid caseStudies={caseStudies} />
          </div>
        </section>

        <SupportingProseSection
          id="case-studies-outcomes"
          eyebrow="DELIVERY THEMES"
          heading="What we keep optimising for across engagements."
          paragraphs={[
            "Across fintech, logistics, retail, and B2B SaaS we see recurring needs: hardening mobile apps for multi-market releases, replacing legacy web stacks without freezing product roadmaps, and introducing automation where support teams drown in repetitive tickets. Each case study highlights the constraint we optimised for — not generic buzzwords.",
            "API and integration modernisation often means strangling monoliths gradually, versioning public endpoints, and communicating sunset timelines to partners. AI-assisted workflows focus on measurable deflection or triage quality, with logging and escalation paths so humans stay accountable.",
            "If your organisation is evaluating a similar trajectory, use these stories as conversation starters with your internal stakeholders, then bring your specifics to a consultation. We can map a phased plan that matches your risk appetite and existing team skills.",
          ]}
        />
      </main>
      <Footer />
    </div>
  );
}
