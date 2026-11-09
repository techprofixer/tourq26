import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import { requireMarketingFeature } from "@/lib/require-marketing-feature";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ContactForm from "./ContactForm";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd } from "@/lib/seo";
import { SupportingProseSection } from "@/components/marketing/SupportingProseSection";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getSiteUrl();
  return {
    title: "Contact Us",
    description:
      "Contact Torq Studio: senior software engineers for mobile apps, websites, AI, technical consulting, and remote delivery. Free 30-min consultation.",
    alternates: { canonical: `${baseUrl}/contact` },
    openGraph: {
      title: "Contact Torq Studio | Get a Free Consultation",
      description:
        "Discuss your project with our team. Mobile apps, web, AI, remote IT — we're here to help you scale smarter.",
      url: `${baseUrl}/contact`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ContactPage() {
  await requireMarketingFeature("marketing_contact_form", "marketing_contact_form");
  const siteUrl = await getSiteUrl();
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Contact", path: "/contact" },
  ]);
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbLd} />
      <MarketingHeader />
      <main>
        {/* Hero band — dark, form surfaced above the fold */}
        <section className="hero-band">
          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-12 px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-20 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pt-36 lg:pb-20">
            <div className="lg:col-span-6">
              <p className="mono-eyebrow text-white/55">GET IN TOUCH</p>
              <h1 className="display-xxl mt-5 text-white">
                Tell us what you&apos;re building.
              </h1>
              <p className="mt-6 max-w-lg text-[17px] leading-[1.5] text-white/70">
                Free 30-min consultation, no commitment. Fill in the form and
                we&apos;ll reply within 24 hours — or email{" "}
                <a
                  href="mailto:connect@torqstudio.com"
                  className="text-white underline underline-offset-4 decoration-white/40 hover:decoration-white"
                >
                  connect@torqstudio.com
                </a>{" "}
                directly with attachments and background links.
              </p>
              <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-5">
                {[
                  ["RESPONSE", "Within 24 hours"],
                  ["OVERLAP", "India · MENA · EU"],
                  ["NDA", "Standard or yours — happy to sign"],
                ].map(([term, desc]) => (
                  <div key={term}>
                    <dt className="mono-label text-white/45">{term}</dt>
                    <dd className="mt-1 text-[14px] text-white">{desc}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-[4px] border border-black/5 bg-white p-6 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.55)] sm:p-8">
                <p className="mono-eyebrow text-muted-foreground">SEND A MESSAGE</p>
                <h2 className="display-sm mt-2 text-foreground">
                  We read every enquiry ourselves.
                </h2>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What to include + quick answers */}
        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              <aside className="lg:col-span-5">
                <p className="mono-eyebrow text-muted-foreground">WHAT TO INCLUDE</p>
                <h2 className="display-lg mt-4 text-foreground">
                  A short, useful first message.
                </h2>
                <ul className="mt-6 space-y-4 text-[15px] leading-[1.55] text-muted-foreground">
                  {[
                    "Current stage — idea, MVP, scale.",
                    "Tech stack or known constraints.",
                    "Target users, regions, or governance rules.",
                    "Budget band (if you know it) and a rough timeline.",
                    "Whether you need full delivery, staff aug, or advice only.",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-3">
                      <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10 card-flat">
                  <p className="mono-eyebrow text-muted-foreground">FREE CONSULTATION</p>
                  <p className="mt-3 text-[16px] leading-[1.5] text-foreground">
                    Share goals, constraints, and timeline — we&apos;ll suggest a sensible
                    next step.
                  </p>
                  <Link href="/services" className="btn-base btn-outline mt-5">
                    View service catalogue
                  </Link>
                </div>
              </aside>

              <div className="lg:col-span-7">
                <p className="mono-eyebrow text-muted-foreground">BEFORE YOU WRITE</p>
                <h2 className="display-lg mt-4 text-foreground">Quick answers.</h2>
                <dl className="mt-6 divide-y divide-hairline">
                  {[
                    [
                      "Do you sign NDAs before we share details?",
                      "Yes — send yours or ask for our standard NDA and we'll turn it around before the first call.",
                    ],
                    [
                      "Is there a minimum budget?",
                      "No fixed minimum, but most engagements start around a few weeks of senior engineering time. Say what you have in mind and we'll tell you plainly if it's a fit.",
                    ],
                    [
                      "Can we start smaller than a full build?",
                      "Yes — a short paid discovery (architecture review, estimate, or risk assessment) is a common way to de-risk a larger commitment before you fund it.",
                    ],
                  ].map(([q, a]) => (
                    <div key={q} className="py-5 first:pt-0">
                      <dt className="text-[16px] font-medium text-foreground">{q}</dt>
                      <dd className="mt-2 text-[15px] leading-[1.55] text-muted-foreground">{a}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-6 border-t border-hairline pt-6 text-[14px] text-muted-foreground">
                  Prefer email?{" "}
                  <a
                    href="mailto:connect@torqstudio.com"
                    className="text-foreground underline underline-offset-4 decoration-[var(--app-hairline)] hover:decoration-[var(--app-fg)]"
                  >
                    connect@torqstudio.com
                  </a>{" "}
                  · We respond within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </section>

        <SupportingProseSection
          id="contact-next-steps"
          eyebrow="WHAT HAPPENS NEXT"
          heading="A working session, not a sales script."
          paragraphs={[
            "Share a short note about your product, stack, and timeline. We read every message and reply with a concrete next step — a discovery call, a written scope review, or a polite redirect if we are not the right fit.",
            "Typical engagements include mobile apps (iOS and Android), web platforms and APIs, practical AI automation, and remote engineering squads. We also take on advisory work: architecture reviews, vendor diligence, rescue assessments, and estimation sanity checks before you commit budget.",
            "Helpful context in your first message includes: current stage, tech stack or constraints, target users or regions, budget band if you know it, and whether you need full delivery, staff augmentation, or advice only. You do not need a perfect brief — we will ask clarifying questions.",
          ]}
        />

        <SupportingProseSection
          id="contact-locations-models"
          eyebrow="ENGAGEMENT MODELS"
          heading="Fixed-price, retainers, embedded squads, or paid discovery."
          paragraphs={[
            "Fixed-price or milestone work suits bounded scope with clear acceptance criteria. Retainers and embedded squads fit ongoing roadmaps, incident support, and continuous delivery. Discovery engagements are short, paid blocks when you need a written assessment, risk register, or vendor comparison before funding a larger build.",
            "We document decisions in writing, use your issue tracker and repositories when appropriate, and align on security expectations (access, secrets, data residency) from day one. For regulated industries we respect your vendor questionnaires, NDAs, and procurement steps.",
            "Torq Studio is based in Mumbai; we routinely overlap with teams in India, the Gulf, and Western Europe. If you are unsure whether remote collaboration fits your governance rules, mention it in the form and we will outline how we have handled similar clients.",
          ]}
        />
      </main>
      <Footer />
    </div>
  );
}
