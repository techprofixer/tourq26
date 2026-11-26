import type { Metadata } from "next";
import MarketingHeader from "@/components/MarketingHeader";
import { requireMarketingFeature } from "@/lib/require-marketing-feature";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ContactForm from "./ContactForm";
import Reveal from "@/components/motion/Reveal";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { CONTACT_EMAIL } from "@/lib/contact-topics";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd, DEFAULT_OG_IMAGE, INDEXABLE_ROBOTS } from "@/lib/seo";
import { SupportingProseSection } from "@/components/marketing/SupportingProseSection";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getSiteUrl();
  return {
    title: "Contact Us",
    description:
      "Contact Torq Studio: senior software engineers for mobile apps, websites, AI, technical consulting, and remote delivery. Free 30-min consultation.",
    alternates: { canonical: `${baseUrl}/contact` },
    openGraph: {
      images: [DEFAULT_OG_IMAGE],
      title: "Contact Torq Studio | Get a Free Consultation",
      description:
        "Discuss your project with our team. Mobile apps, web, AI, remote IT — we're here to help you scale smarter.",
      url: `${baseUrl}/contact`,
    },
    robots: INDEXABLE_ROBOTS,
  };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const STEPS = [
  ["01", "You message us", "WhatsApp or the form — whichever is easier. Short is fine; we'll ask the right questions."],
  ["02", "An engineer replies", "Within 24 hours, with a concrete next step: a call, a written scope review, or an honest redirect."],
  ["03", "We scope it in writing", "Acceptance criteria, timeline and cost range before any build commitment."],
];

export default async function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  await requireMarketingFeature("marketing_contact_form", "marketing_contact_form");
  const sp = await searchParams;
  const category = first(sp.category);
  const siteUrl = await getSiteUrl();
  const waUrl = buildWhatsAppUrl("Hi Torq Studio, I'd like to talk about a project.");
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Contact", path: "/contact" },
  ]);
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbLd} />
      <MarketingHeader />
      <main>
        {/* Hero — headline + three ways to reach us */}
        <section className="hero-band hero-grid">
          <div className="hero-orb hero-orb-a" aria-hidden />
          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pb-24 lg:pt-36">
            <div className="lg:col-span-7">
              <p className="mono-eyebrow animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white/75 opacity-0 animate-delay-1">
                <span className="pulse-dot" aria-hidden /> GET IN TOUCH
              </p>
              <h1 className="display-xxl animate-fade-up mt-6 max-w-[14ch] text-white opacity-0 animate-delay-2">
                Tell us what you&apos;re building.
              </h1>
              <p className="animate-fade-up mt-6 max-w-lg text-[17px] leading-[1.55] text-white/70 opacity-0 animate-delay-3">
                Free 30-minute consultation, no commitment. Message us on WhatsApp or use the form — an engineer
                replies within 24 hours.
              </p>
              <dl className="animate-fade-up mt-10 flex flex-wrap gap-x-8 gap-y-5 opacity-0 animate-delay-4">
                {[
                  ["RESPONSE", "Within 24 hours"],
                  ["BASED IN", "Mumbai · IST"],
                  ["NDA", "Standard or yours"],
                ].map(([term, desc]) => (
                  <div key={term}>
                    <dt className="mono-label text-white/45">{term}</dt>
                    <dd className="mt-1 text-[14px] text-white">{desc}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="animate-scale-in space-y-3 opacity-0 animate-delay-2 lg:col-span-5">
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-[var(--radius-md)] bg-whatsapp p-5 text-whatsapp-foreground shadow-xl transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <WhatsAppIcon className="h-7 w-7" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="display-sm block">Chat on WhatsApp</span>
                    <span className="mt-0.5 block text-[13px] text-white/85">Fastest way to reach an engineer</span>
                  </span>
                  <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
                </a>
              ) : null}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="group flex items-center gap-4 rounded-[var(--radius-md)] border border-white/15 bg-white/[0.06] p-5 text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="display-sm block">Email us</span>
                  <span className="mt-0.5 block truncate text-[13px] text-white/65">{CONTACT_EMAIL}</span>
                </span>
                <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
              </a>
              <a
                href="#enquiry"
                className="group flex items-center gap-4 rounded-[var(--radius-md)] border border-white/15 bg-white/[0.06] p-5 text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
                    <path d="M4 5h16v11H8l-4 4V5Z" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="display-sm block">Send a detailed brief</span>
                  <span className="mt-0.5 block text-[13px] text-white/65">Use the form below</span>
                </span>
                <span className="transition-transform group-hover:translate-y-1" aria-hidden>↓</span>
              </a>
            </div>
          </div>
        </section>

        {/* Form + what happens next */}
        <section id="enquiry" className="band-light scroll-mt-24 border-t border-hairline">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-14 lg:px-8 lg:py-[80px]">
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <p className="mono-eyebrow text-muted-foreground">HOW IT WORKS</p>
                <h2 className="display-lg mt-4 text-foreground">Three steps to a plan.</h2>
                <ol className="mt-8 space-y-6">
                  {STEPS.map(([n, title, body]) => (
                    <li key={n} className="flex gap-4">
                      <span className="mono-label flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/15 text-foreground">
                        {n}
                      </span>
                      <div>
                        <p className="display-sm text-foreground">{title}</p>
                        <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-8 border-t border-hairline pt-6 text-[14px] text-muted-foreground">
                  Need to share files or an NDA first? Email{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-foreground underline decoration-[var(--app-hairline)] underline-offset-4 hover:decoration-[var(--app-fg)]"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
              </div>
            </aside>

            <div className="lg:col-span-8">
              <Reveal>
                <div className="rounded-[var(--radius-md)] border border-black/10 bg-white p-6 shadow-[0_24px_64px_-32px_rgba(0,0,0,0.25)] sm:p-9">
                  <p className="mono-eyebrow text-muted-foreground">SEND A MESSAGE</p>
                  <h2 className="display-md mt-2 text-foreground">We read every enquiry ourselves.</h2>
                  <div className="mt-8">
                    <ContactForm initialTopic={first(sp.topic)} category={category || undefined} from={first(sp.from) || undefined} />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Quick answers */}
        <section className="border-t border-hairline bg-[var(--app-muted)]">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-14 lg:px-8">
            <header className="lg:col-span-4">
              <p className="mono-eyebrow text-muted-foreground">BEFORE YOU WRITE</p>
              <h2 className="display-lg mt-4 text-foreground">Quick answers.</h2>
            </header>
            <dl className="divide-y divide-[var(--app-border)] overflow-hidden rounded-[var(--radius-md)] border border-black/10 bg-white lg:col-span-8">
              {[
                ["Do you sign NDAs before we share details?", "Yes — send yours or ask for our standard NDA and we'll turn it around before the first call."],
                ["Is there a minimum budget?", "No fixed minimum, but most engagements start around a few weeks of senior engineering time. Say what you have in mind and we'll tell you plainly if it's a fit."],
                ["Can we start smaller than a full build?", "Yes — a short paid discovery (architecture review, estimate, or risk assessment) is a common way to de-risk a larger commitment before you fund it."],
                ["What should I include in my first message?", "Current stage (idea, MVP, scale), tech stack or constraints, target users or regions, budget band and timeline if you know them, and whether you need full delivery, staff augmentation, or advice only."],
              ].map(([q, a]) => (
                <div key={q} className="p-5 sm:p-6">
                  <dt className="text-[16px] font-medium text-foreground">{q}</dt>
                  <dd className="mt-2 text-[15px] leading-[1.55] text-muted-foreground">{a}</dd>
                </div>
              ))}
            </dl>
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
            "Torq Studio is based in Mumbai; we work with teams across India in IST, remotely by default and on-site where it helps. If you are unsure whether remote collaboration fits your governance rules, mention it in the form and we will outline how we have handled similar clients.",
          ]}
        />
      </main>
      <Footer />
    </div>
  );
}
