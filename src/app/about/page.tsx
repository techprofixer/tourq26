import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd, DEFAULT_OG_IMAGE, INDEXABLE_ROBOTS } from "@/lib/seo";
import { SupportingProseSection } from "@/components/marketing/SupportingProseSection";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getSiteUrl();
  return {
    title: "About Us",
    description:
      "Torq Studio is led by senior software engineers who build and advise: mobile apps, websites, AI, and technical consulting for teams worldwide.",
    alternates: { canonical: `${baseUrl}/about` },
    openGraph: {
      images: [DEFAULT_OG_IMAGE],
      title: "About Torq Studio | Senior Engineers, Build & Consulting",
      description:
        "Mobile, web, AI, and hands-on technical consulting—direct access to engineers who still ship production code.",
      url: `${baseUrl}/about`,
    },
    robots: INDEXABLE_ROBOTS,
  };
}

const values: { eyebrow: string; title: string; description: string }[] = [
  {
    eyebrow: "QUALITY",
    title: "Production-grade by default",
    description:
      "We ship on time without cutting corners. Rigorous testing, observability, and senior talent so your product stands up in production.",
  },
  {
    eyebrow: "TRANSPARENCY",
    title: "Direct, written, honest",
    description:
      "Clear communication, written scope, and honest timelines. You work with senior engineers who own outcomes — not endless account layers.",
  },
  {
    eyebrow: "REACH",
    title: "Global delivery, local impact",
    description:
      "We serve clients worldwide with remote teams that deliver. Reduce delivery cost by up to 40% while keeping the senior quality bar.",
  },
];

export default async function AboutPage() {
  const siteUrl = await getSiteUrl();
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ]);
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbLd} />
      <MarketingHeader />
      <main>
        {/* Hero band — dark */}
        <section className="hero-band">
          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 pt-32 pb-20 sm:px-6 sm:pt-36 sm:pb-24 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pt-40 lg:pb-[80px]">
            <div className="lg:col-span-8">
              <p className="mono-eyebrow text-white/55">WHO WE ARE</p>
              <h1 className="display-xxl mt-5 text-white">
                Senior engineers you can actually talk to.
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
                Torq Studio combines delivery and consulting: mobile apps, web platforms,
                AI workflows, and technical advisory — architecture, estimates, reviews,
                and execution when you are ready.
              </p>
            </div>
            <div className="flex flex-col items-start justify-end gap-4 lg:col-span-4 lg:items-end">
              <Link href="/contact" className="btn-base btn-white">
                Contact sales
              </Link>
              <Link href="/services" className="btn-base btn-ghost-on-dark">
                See service catalogue
              </Link>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-4">
                <p className="mono-eyebrow text-muted-foreground">OUR MISSION</p>
                <h2 className="display-xl mt-4 text-foreground">
                  Help you make the right technical bets — then build them.
                </h2>
              </div>
              <div className="space-y-5 text-[16px] leading-[1.6] text-muted-foreground lg:col-span-8 lg:max-w-[680px]">
                <p>
                  Whether you need a senior engineer to own delivery, a second opinion before
                  you hire or outsource, or a long-term partner for mobile, web, and AI — we
                  keep the conversation honest and the work production-grade.
                </p>
                <p>
                  Many clients save significantly versus hiring only in high-cost markets,
                  without giving up senior quality. Clear scopes, direct communication, and no
                  bait-and-switch: you always know who is doing the work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values — research-card grid on dark */}
        <section className="band-dark" aria-labelledby="values-heading">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mono-eyebrow text-white/55">WHAT WE STAND FOR</p>
                <h2 id="values-heading" className="display-xl mt-4 text-white">
                  Three principles, applied every engagement.
                </h2>
              </div>
              <p className="max-w-md text-[16px] leading-[1.5] text-white/65">
                These show up in the scoping doc, the standups, and the runbook you receive
                on day one of go-live.
              </p>
            </div>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((item, i) => (
                <li key={item.title} className="card-flat-on-dark card-hover flex h-full flex-col">
                  <div className="flex items-center justify-between">
                    <p className="mono-eyebrow text-white/55">{item.eyebrow}</p>
                    <span className="mono-eyebrow text-white/40">0{i + 1}</span>
                  </div>
                  <h3 className="display-md mt-6 text-white">{item.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/65">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <SupportingProseSection
          id="about-capabilities"
          eyebrow="WHAT WE SHIP"
          heading="From mobile release trains to grounded AI workflows."
          paragraphs={[
            "Our teams routinely own consumer and B2B mobile applications end to end: store submission, push notifications, offline behaviour, analytics hooks, and release trains. On the web we build marketing sites, authenticated customer portals, and internal admin tools — with attention to performance, accessibility, and SEO where they affect your funnel.",
            "API and integration work is a core strength: versioning strategies, partner-facing documentation, rate limits, authentication, and observability so you are not blind after launch. When AI is in scope, we focus on grounded workflows — retrieval, tool use, evaluation metrics, and human review — rather than one-off demos that fail in production.",
            "Many clients combine delivery with periodic architecture or roadmap reviews. That hybrid keeps your in-house team unblocked while an experienced engineer sanity-checks estimates, dependency risk, and security assumptions before you sign major contracts or hire permanently.",
          ]}
        />

        <SupportingProseSection
          id="about-delivery-philosophy"
          eyebrow="HOW WE COLLABORATE"
          heading="Engineers in your rituals, not over a wall."
          paragraphs={[
            "Torq Studio is structured so you speak with engineers who still write and review production code. That keeps estimates grounded, reduces telephone-game miscommunication, and makes handover documentation trustworthy because the same people who build also explain trade-offs.",
            "We are comfortable joining your rituals — stand-ups, design reviews, incident channels — when embedded, and we are equally comfortable owning a bounded milestone with written acceptance criteria when you prefer a fixed scope. Security, privacy, and compliance expectations are surfaced early, especially for apps that handle accounts, payments, or regulated data.",
            "Based in Mumbai with overlap for India, Europe, and MENA time zones, we collaborate remotely by default. Whether you need a mobile release owner, a web platform rebuild, API hardening, or practical AI workflows, we align on overlap hours and written decisions so progress survives team changes on your side.",
          ]}
        />

        {/* Closing CTA */}
        <section className="hero-band border-t border-[var(--brand-hairline-on-dark)]">
          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-[80px]">
            <div className="lg:col-span-7">
              <p className="mono-eyebrow text-white/55">READY TO BUILD?</p>
              <h2 className="display-xl mt-4 text-white">
                Free 30-minute consultation, no commitment.
              </h2>
              <p className="mt-5 max-w-xl text-[17px] leading-[1.5] text-white/65">
                Bring the problem, the stack, or just a one-pager — we&apos;ll respond
                with a sensible next step.
              </p>
            </div>
            <div className="flex flex-col items-start justify-center gap-3 lg:col-span-5 lg:items-end">
              <div className="flex flex-wrap gap-3">
                <Link href="/contact" className="btn-base btn-white">
                  Get in touch
                </Link>
                <Link href="/case-studies" className="btn-base btn-ghost-on-dark">
                  See case studies
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
