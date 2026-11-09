import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd } from "@/lib/seo";
import { readCaseStudies } from "@/lib/case-studies-content";
import { requireMarketingFeature } from "@/lib/require-marketing-feature";
import BusinessSystemsAnalytics from "./BusinessSystemsAnalytics";
import AuditCta from "./AuditCta";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getSiteUrl();
  return {
    title: "Business Automation & Custom Software for Growing Businesses | Torq Studio",
    description:
      "Torq Studio builds custom CRM, automation, AI and business systems that help growing businesses replace manual processes with smarter workflows.",
    alternates: { canonical: `${baseUrl}/business-systems` },
    openGraph: {
      title: "Business Automation & Custom Software for Growing Businesses | Torq Studio",
      description:
        "Torq Studio builds custom CRM, automation, AI and business systems that help growing businesses replace manual processes with smarter workflows.",
      url: `${baseUrl}/business-systems`,
    },
    robots: { index: true, follow: true },
  };
}

const PROBLEMS = [
  "Leads scattered across WhatsApp",
  "Customer data in Excel/Google Sheets",
  "Missed follow-ups",
  "Too many manual processes",
  "Disconnected tools",
  "Poor operational visibility",
];

const SERVICES = [
  { title: "CRM & Lead Management", desc: "One place for every lead, conversation, and deal stage." },
  { title: "Business Automation", desc: "Automate the repetitive steps your team does manually today." },
  { title: "Custom Business Software", desc: "Software built around how your business actually runs." },
  { title: "Dashboards & Analytics", desc: "Real-time visibility into leads, sales, and operations." },
  { title: "AI Automation", desc: "Practical AI for support, follow-ups, and internal workflows." },
  { title: "Integrations", desc: "Connect the tools you already use so data moves on its own." },
];

const WHO_ITS_FOR = [
  "Service businesses",
  "Agencies",
  "E-commerce businesses",
  "Distributors/trading businesses",
  "Professional services",
  "Growing SMEs",
  "Operations-heavy businesses",
  "Startups with complex workflows",
];

const AUDIT_REVIEW_ITEMS = [
  "Leads",
  "Customers",
  "Follow-ups",
  "Internal tasks",
  "Reporting",
  "Repetitive processes",
];

export default async function BusinessSystemsPage() {
  await requireMarketingFeature("business_systems_audit", "business_systems_audit");
  const siteUrl = await getSiteUrl();
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Business Systems", path: "/business-systems" },
  ]);
  const caseStudies = (await readCaseStudies()).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbLd} />
      <BusinessSystemsAnalytics />
      <MarketingHeader />
      <main>
        {/* Hero */}
        <section className="hero-band">
          <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pt-28 pb-16 text-center sm:px-6 sm:pt-32 sm:pb-20 lg:px-8 lg:pt-36 lg:pb-24">
            <p className="mono-eyebrow text-white/55">FREE BUSINESS SYSTEMS AUDIT</p>
            <h1 className="display-xxl mx-auto mt-5 max-w-3xl text-white">
              Still running your business on WhatsApp + Excel?
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-[1.5] text-white/70">
              We build custom CRM, automation and business systems that bring your leads,
              customers, tasks and operations into one place.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3">
              <AuditCta ctaId="hero" className="btn-base btn-primary">
                Book a Free Business Systems Audit
              </AuditCta>
              <span className="mono-label text-white/45">
                20–30 MINUTE CONSULTATION · NO OBLIGATION
              </span>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <p className="mono-eyebrow text-muted-foreground">THE PROBLEM</p>
            <h2 className="display-lg mt-4 max-w-2xl text-foreground">
              Your business has grown. Your systems haven&apos;t.
            </h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PROBLEMS.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 rounded-[4px] border border-hairline p-4 text-[15px] text-foreground"
                >
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Solution */}
        <section className="border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <p className="mono-eyebrow text-muted-foreground">THE SOLUTION</p>
            <h2 className="display-lg mt-4 max-w-2xl text-foreground">
              One system. Built around your business.
            </h2>
            <p className="mt-6 max-w-2xl text-[16px] leading-[1.6] text-muted-foreground">
              No off-the-shelf tool that forces your team to change how it works. We design and
              build the CRM, automation, and dashboards around your existing processes — so
              adoption is easy and the data finally lives in one place.
            </p>
          </div>
        </section>

        {/* Services */}
        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <p className="mono-eyebrow text-muted-foreground">WHAT WE BUILD</p>
            <h2 className="display-lg mt-4 max-w-2xl text-foreground">
              Services that replace manual work.
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((s) => (
                <div key={s.title} className="card-flat">
                  <p className="text-[16px] font-medium text-foreground">{s.title}</p>
                  <p className="mt-2 text-[14px] leading-[1.5] text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <p className="mono-eyebrow text-muted-foreground">WHO IT&apos;S FOR</p>
            <h2 className="display-lg mt-4 max-w-2xl text-foreground">
              Built for operations-heavy businesses.
            </h2>
            <ul className="mt-8 flex flex-wrap gap-3">
              {WHO_ITS_FOR.map((w) => (
                <li
                  key={w}
                  className="mono-label rounded-full border border-hairline px-4 py-2 text-foreground/80"
                >
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Proof / case studies */}
        {caseStudies.length > 0 ? (
          <section className="band-light border-t border-hairline">
            <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
              <p className="mono-eyebrow text-muted-foreground">PROOF</p>
              <h2 className="display-lg mt-4 max-w-2xl text-foreground">Results, not promises.</h2>
              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                {caseStudies.map((cs) => (
                  <Link
                    key={cs.slug}
                    href={`/case-studies/${cs.slug}`}
                    className="card-flat block transition-colors hover:border-foreground/30"
                  >
                    <p className="mono-label text-muted-foreground">{cs.industry}</p>
                    <p className="display-sm mt-3 text-foreground">{cs.metric}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">{cs.metricLabel}</p>
                    <p className="mt-4 text-[14px] leading-[1.5] text-foreground/90">{cs.outcome}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Offer */}
        <section className="border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-6">
                <p className="mono-eyebrow text-muted-foreground">THE OFFER</p>
                <h2 className="display-lg mt-4 text-foreground">Free Business Systems Audit</h2>
                <p className="mt-6 max-w-lg text-[16px] leading-[1.6] text-muted-foreground">
                  In a free 20–30 minute session, we&apos;ll review how your business currently
                  runs and show you exactly where a system would save the most time.
                </p>
              </div>
              <div className="lg:col-span-6">
                <p className="mono-label text-muted-foreground">WE&apos;LL REVIEW</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {AUDIT_REVIEW_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-[15px] text-foreground">
                      <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <AuditCta ctaId="offer" className="btn-base btn-primary mt-8 inline-flex">
                  Book My Free Audit
                </AuditCta>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="hero-band">
          <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
            <h2 className="display-lg text-white">Ready to see what a real system looks like?</h2>
            <div className="mt-8 flex flex-col items-center gap-3">
              <AuditCta ctaId="final" className="btn-base btn-primary">
                Book a Free Business Systems Audit
              </AuditCta>
              <span className="mono-label text-white/45">
                20–30 MINUTE CONSULTATION · NO OBLIGATION
              </span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
