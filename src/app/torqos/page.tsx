import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd } from "@/lib/seo";
import { readCaseStudies } from "@/lib/case-studies-content";
import { readPricingPlans } from "@/lib/pricing-content";
import { requireMarketingFeature } from "@/lib/require-marketing-feature";
import TorqosAnalytics from "./TorqosAnalytics";
import DemoCta from "./DemoCta";
import VideoDemo from "./VideoDemo";
import PlatformExplorer from "./PlatformExplorer";
import PricingPlans from "./PricingPlans";
import ModulesAccordion from "./ModulesAccordion";
import {
  BriefcaseIcon,
  CartIcon,
  CatalogIcon,
  ChecklistIcon,
  ClockIcon,
  ContactCardIcon,
  DiceIcon,
  EyeOffIcon,
  GlobeIcon,
  GridIcon,
  LayersIcon,
  MapPinIcon,
  MegaphoneIcon,
  ReceiptIcon,
  ScatterIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TechnicianIcon,
  TicketIcon,
  TrendingUpIcon,
  TruckIcon,
  UnlinkIcon,
  UsersIcon,
  WalletIcon,
  WrenchIcon,
} from "./icons";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getSiteUrl();
  return {
    title: "torqOS — The Business Operating System for Growing Companies | Torq Studio",
    description:
      "torqOS unifies your CRM, operations, finances and reporting into one system — so your team stops running the business on spreadsheets and WhatsApp. Book a demo.",
    alternates: { canonical: `${baseUrl}/torqos` },
    openGraph: {
      title: "torqOS — The Business Operating System for Growing Companies | Torq Studio",
      description:
        "torqOS unifies your CRM, operations, finances and reporting into one system — so your team stops running the business on spreadsheets and WhatsApp. Book a demo.",
      url: `${baseUrl}/torqos`,
    },
    robots: { index: true, follow: true },
  };
}

const PROBLEMS = [
  { text: "Leads scattered across WhatsApp & email", Icon: ScatterIcon },
  { text: "Customer data trapped in spreadsheets", Icon: GridIcon },
  { text: "No shared visibility across teams", Icon: EyeOffIcon },
  { text: "Reports that are out of date the moment they're sent", Icon: ClockIcon },
  { text: "Tools that don't talk to each other", Icon: UnlinkIcon },
  { text: "Decisions made on gut feel, not real numbers", Icon: DiceIcon },
];

const MODULES = [
  {
    title: "Dashboard, Reports & Analytics",
    short: "REPORTS",
    desc: "Live dashboards leadership can actually trust, built from real-time data.",
    Icon: TrendingUpIcon,
    bullets: [
      "Real-time revenue, job, and pipeline dashboards",
      "Custom reports without waiting on a developer",
      "Role-based views for leadership vs. field teams",
    ],
  },
  {
    title: "Job Management",
    short: "JOBS",
    desc: "Track every job from assignment to completion, with full visibility for your team.",
    Icon: ChecklistIcon,
    bullets: [
      "Assign, schedule, and track jobs end to end",
      "Live status updates technicians can see",
      "Job history tied to every customer record",
    ],
  },
  {
    title: "Catalog",
    short: "CATALOG",
    desc: "One shared catalog of products and services, always up to date.",
    Icon: CatalogIcon,
    bullets: [
      "One source of truth for products and services",
      "Pricing and availability always in sync",
      "Shared across quotes, jobs, and invoices",
    ],
  },
  {
    title: "Technician Management",
    short: "TECH",
    desc: "Schedule, dispatch, and track technicians against every job.",
    Icon: TechnicianIcon,
    bullets: [
      "Schedule and dispatch by skill and location",
      "Track hours, jobs completed, and utilization",
      "Mobile-friendly for field updates",
    ],
  },
  {
    title: "Team Management",
    short: "TEAM",
    desc: "Roles, attendance, and performance for your whole team in one place.",
    Icon: UsersIcon,
    bullets: [
      "Roles and permissions per team member",
      "Attendance and performance tracking",
      "Onboard new hires without spreadsheets",
    ],
  },
  {
    title: "Quotation",
    short: "QUOTES",
    desc: "Create, send, and track quotations that turn into jobs automatically.",
    Icon: ReceiptIcon,
    bullets: [
      "Branded quotes sent in minutes",
      "Accepted quotes convert into jobs automatically",
      "Track open, sent, and won quotes",
    ],
  },
  {
    title: "CRM",
    short: "CRM",
    desc: "Every lead, deal, and customer relationship in one shared system.",
    Icon: ContactCardIcon,
    bullets: [
      "Every lead and deal in one pipeline",
      "Full contact and interaction history",
      "No more leads lost in someone's inbox",
    ],
  },
  {
    title: "CMS",
    short: "CMS",
    desc: "Manage the content behind your customer-facing pages without a developer.",
    Icon: LayersIcon,
    bullets: [
      "Edit website content without a developer",
      "Publish updates instantly",
      "Same content system across every page",
    ],
  },
  {
    title: "AMC",
    short: "AMC",
    desc: "Track annual maintenance contracts, renewals, and service schedules.",
    Icon: ShieldCheckIcon,
    bullets: [
      "Track contract renewals before they lapse",
      "Automated service-schedule reminders",
      "Full history per contract and customer",
    ],
  },
  {
    title: "Finance",
    short: "FINANCE",
    desc: "Real-time visibility into revenue, costs, and cash flow.",
    Icon: WalletIcon,
    bullets: [
      "Live revenue, cost, and margin visibility",
      "Invoices and payments in one place",
      "No more waiting on finance for numbers",
    ],
  },
  {
    title: "Marketing",
    short: "MARKET",
    desc: "Run campaigns and track what's actually driving new business.",
    Icon: MegaphoneIcon,
    bullets: [
      "Run and track campaigns in one place",
      "See what's actually driving new business",
      "Connects straight into the CRM pipeline",
    ],
  },
  {
    title: "Website",
    short: "WEBSITE",
    desc: "Your public site, connected to the same data as the rest of torqOS.",
    Icon: GlobeIcon,
    bullets: [
      "Your public site on the same data as the rest of torqOS",
      "No separate CMS or hosting to manage",
      "Updates reflect instantly across the business",
    ],
  },
  {
    title: "Ticket Manager",
    short: "TICKETS",
    desc: "Log, assign, and resolve customer support tickets end to end.",
    Icon: TicketIcon,
    bullets: [
      "Log, assign, and resolve tickets end to end",
      "SLA and priority tracking built in",
      "Full history tied to the customer record",
    ],
  },
];

/** First 6 modules, used for the compact hero sidebar mockup — not the full list. */
const SIDEBAR_MODULES = MODULES.slice(0, 6);
/** First 9 modules, used for the small icon grid in the Solution section diagram. */
const DIAGRAM_MODULES = MODULES.slice(0, 9);

const WHO_ITS_FOR = [
  { label: "Service businesses", Icon: WrenchIcon },
  { label: "Agencies", Icon: MegaphoneIcon },
  { label: "E-commerce businesses", Icon: CartIcon },
  { label: "Distributors & trading businesses", Icon: TruckIcon },
  { label: "Professional services", Icon: BriefcaseIcon },
  { label: "Growing SMEs", Icon: TrendingUpIcon },
  { label: "Multi-location businesses", Icon: MapPinIcon },
  { label: "Operations-heavy teams", Icon: SettingsIcon },
];

const STAT_TILES = [
  { label: "PIPELINE", value: "37 OPEN", bars: [35, 55, 40, 65, 60, 85] },
  { label: "REVENUE", value: "$148,320", bars: [30, 45, 50, 60, 75, 95] },
  { label: "JOBS", value: "212", bars: [55, 40, 65, 45, 80, 50] },
];

const ACTIVITY_ROWS = [
  { title: "Acme Logistics", tag: "NEW LEAD", tone: "blue" as const },
  { title: "Quotation #1042", tag: "SENT", tone: "mint" as const },
  { title: "Job #204 — AC Service", tag: "DONE", tone: "white" as const },
];

const ACTIVITY_TONE_CLASSES: Record<(typeof ACTIVITY_ROWS)[number]["tone"], string> = {
  blue: "border-[var(--brand-orange)]/40 text-[var(--brand-orange)]",
  mint: "border-[var(--brand-mint)]/50 text-[var(--brand-mint)]",
  white: "border-white/20 text-white/60",
};

export default async function TorqosPage() {
  await requireMarketingFeature("torqos_landing", "torqos_landing");
  const siteUrl = await getSiteUrl();
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "torqOS", path: "/torqos" },
  ]);
  const caseStudies = (await readCaseStudies()).slice(0, 3);
  const pricingPlans = (await readPricingPlans()).filter((p) => p.isActive);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbLd} />
      <TorqosAnalytics />
      <MarketingHeader />
      <main>
        {/* Hero */}
        <section className="hero-band">
          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-14 px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-20 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pt-36 lg:pb-24">
            <div className="lg:col-span-7">
              <p className="mono-eyebrow animate-fade-up text-white/55 opacity-0 animate-delay-1">
                TORQOS — THE BUSINESS OPERATING SYSTEM
              </p>
              <h1 className="display-xxl animate-fade-up mt-5 max-w-[15ch] text-white opacity-0 animate-delay-2">
                One system to run your entire business.
              </h1>
              <p className="animate-fade-up mt-6 max-w-xl text-[17px] leading-[1.5] text-white/70 opacity-0 animate-delay-3">
                torqOS brings your leads, customers, operations, and finances into a single
                platform — so your team stops jumping between spreadsheets, WhatsApp, and
                disconnected apps.
              </p>
              <div className="animate-fade-up mt-9 flex flex-col items-start gap-3 opacity-0 animate-delay-4">
                <DemoCta ctaId="hero" className="btn-base btn-primary">
                  Book a Demo
                </DemoCta>
                <span className="mono-label text-white/45">
                  30-MINUTE WALKTHROUGH · NO OBLIGATION
                </span>
              </div>
            </div>

            {/* Product visual — stylized dashboard mockup, not a literal screenshot */}
            <div className="lg:col-span-5">
              <div className="animate-scale-in opacity-0 animate-delay-2">
                <div className="overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[#0b0b0b] shadow-2xl">
                  <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="mono-label ml-3 truncate text-white/35">torqos.app/dashboard</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <div className="col-span-3 space-y-1 border-r border-white/10 p-2.5 sm:p-3">
                      {SIDEBAR_MODULES.map(({ short, Icon }, i) => (
                        <div
                          key={short}
                          className={`flex items-center gap-2 rounded-[4px] px-2 py-2 ${
                            i === 0 ? "bg-white/10" : ""
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 text-white/55" />
                          <span className="hidden truncate text-[10px] tracking-wide text-white/45 sm:inline">
                            {short}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="col-span-9 space-y-3 p-3 sm:p-4">
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {STAT_TILES.map((stat) => (
                          <div key={stat.label} className="rounded-[4px] border border-white/10 p-2 sm:p-3">
                            <p className="mono-label text-[9px] text-white/35 sm:text-[10px]">{stat.label}</p>
                            <p className="mt-1.5 truncate text-[13px] font-medium text-white sm:text-[14px]">
                              {stat.value}
                            </p>
                            <div className="mt-2 flex h-8 items-end gap-[3px] sm:mt-3">
                              {stat.bars.map((h, i) => (
                                <span
                                  key={i}
                                  className="w-1 flex-1 rounded-sm sm:w-1.5"
                                  style={{
                                    height: `${h}%`,
                                    background:
                                      i === stat.bars.length - 1
                                        ? "var(--brand-mint)"
                                        : "rgba(255,255,255,0.18)",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {ACTIVITY_ROWS.map((row) => (
                          <div
                            key={row.title}
                            className="flex items-center gap-3 rounded-[4px] border border-white/10 px-3 py-2"
                          >
                            <span className="h-6 w-6 shrink-0 rounded-full bg-white/10" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12px] text-white/70">{row.title}</p>
                              <div className="mt-1.5 h-1 w-1/3 rounded-full bg-white/10" />
                            </div>
                            <span
                              className={`mono-label shrink-0 rounded-full border px-2 py-1 text-[9px] ${ACTIVITY_TONE_CLASSES[row.tone]}`}
                            >
                              {row.tag}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-6 text-[12px] text-white/50">
                  <span className="mono-eyebrow">CRM · JOBS · CATALOG · FINANCE · TICKETS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <p className="mono-eyebrow text-muted-foreground">THE PROBLEM</p>
            <h2 className="display-lg mt-4 max-w-2xl text-foreground">
              Growing businesses outgrow spreadsheets fast.
            </h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PROBLEMS.map(({ text, Icon }) => (
                <li key={text} className="card-flat flex flex-col gap-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-hairline bg-background text-foreground/70">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-[15px] leading-[1.4] text-foreground">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Solution */}
        <section className="border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
              <div className="lg:col-span-6">
                <p className="mono-eyebrow text-muted-foreground">THE SOLUTION</p>
                <h2 className="display-lg mt-4 max-w-xl text-foreground">
                  torqOS. One operating system, built around how you already run.
                </h2>
                <p className="mt-6 max-w-xl text-[16px] leading-[1.6] text-muted-foreground">
                  Not another off-the-shelf tool your team has to adapt to. torqOS unifies your
                  CRM, operations, finances, and reporting into a single system — configured
                  around your existing workflows, so adoption is fast and every part of your
                  business finally shares the same data.
                </p>
              </div>

              <div className="lg:col-span-6">
                <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-center lg:gap-6">
                  <div className="flex w-full max-w-[280px] flex-col gap-3">
                    {[
                      { label: "Spreadsheets", Icon: GridIcon },
                      { label: "WhatsApp & email", Icon: ScatterIcon },
                      { label: "Disconnected apps", Icon: UnlinkIcon },
                    ].map(({ label, Icon }, i) => (
                      <div
                        key={label}
                        className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-hairline bg-background px-3 py-2.5 text-muted-foreground"
                        style={{ transform: i % 2 === 0 ? "rotate(-1.5deg)" : "rotate(1.5deg)" }}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="mono-label whitespace-nowrap">{label}</span>
                      </div>
                    ))}
                  </div>

                  <span className="mono-eyebrow shrink-0 rotate-90 text-muted-foreground/60 lg:rotate-0">
                    →
                  </span>

                  <div className="w-full max-w-[220px] overflow-hidden rounded-[var(--radius-sm)]">
                    <span aria-hidden className="block h-[3px] w-full" style={{ background: "var(--brand-gradient)" }} />
                    <div className="card-flat-on-dark">
                      <p className="mono-eyebrow text-white/55">TORQOS</p>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {DIAGRAM_MODULES.map(({ short, Icon }) => (
                          <span
                            key={short}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--brand-hairline-on-dark)] text-white/60"
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product demo video */}
        <VideoDemo />

        {/* Platform modules — interactive tab explorer */}
        <section className="band-dark border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <p className="mono-eyebrow text-white/55">PLATFORM MODULES</p>
            <h2 className="display-lg mt-4 max-w-2xl text-white">
              See how each module fits into the same system.
            </h2>
            <PlatformExplorer />
          </div>
        </section>

        {/* Modules */}
        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mono-eyebrow text-muted-foreground">WHAT&apos;S INSIDE</p>
                <h2 className="display-lg mt-4 max-w-2xl text-foreground">
                  Everything your business needs to run, in one place.
                </h2>
              </div>
              <p className="mono-label text-muted-foreground/60">CLICK A MODULE TO EXPAND</p>
            </div>
            <ModulesAccordion
              modules={MODULES.map(({ title, short, desc, bullets }) => ({ title, short, desc, bullets }))}
            />
          </div>
        </section>

        {/* Who it's for */}
        <section className="border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <p className="mono-eyebrow text-muted-foreground">WHO IT&apos;S FOR</p>
            <h2 className="display-lg mt-4 max-w-2xl text-foreground">
              Built for operations-heavy businesses ready to scale.
            </h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {WHO_ITS_FOR.map(({ label, Icon }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-hairline px-4 py-3.5"
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--app-muted)] text-foreground/70">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="mono-label text-foreground/80">{label}</span>
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
                  <div
                    key={cs.slug}
                    className="group overflow-hidden rounded-[var(--radius-sm)] border border-hairline transition-colors hover:border-foreground/30"
                  >
                    <span aria-hidden className="block h-[3px] w-full" style={{ background: "var(--brand-gradient)" }} />
                    <Link href={`/case-studies/${cs.slug}`} className="block bg-surface p-6">
                      <p className="mono-label text-muted-foreground">{cs.industry}</p>
                      <p className="display-sm mt-3 text-foreground">{cs.metric}</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">{cs.metricLabel}</p>
                      <p className="mt-4 text-[14px] leading-[1.5] text-foreground/90">{cs.outcome}</p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Pricing */}
        {pricingPlans.length > 0 ? (
          <section className="border-t border-hairline">
            <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
              <div className="text-center">
                <p className="mono-eyebrow text-muted-foreground">PRICING</p>
                <h2 className="display-lg mx-auto mt-4 max-w-2xl text-foreground">
                  Simple pricing that scales with you.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[15px] leading-[1.5] text-muted-foreground">
                  Pick the tier that matches your operation today — every plan runs on the same
                  system, so upgrading never means switching tools.
                </p>
              </div>

              <PricingPlans plans={pricingPlans} />
            </div>
          </section>
        ) : null}

        {/* Final CTA */}
        <section className="hero-band">
          <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
            <p className="mono-eyebrow text-white/55">SEE IT ON YOUR OPERATIONS</p>
            <h2 className="display-lg mx-auto mt-4 max-w-2xl text-white">
              Book a demo and see torqOS built around your business.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-[1.5] text-white/70">
              In 30 minutes, we&apos;ll show you exactly how torqOS would look running your
              leads, your workflows, and your data — no obligation.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <DemoCta ctaId="final" className="btn-base btn-primary">
                Book a Demo
              </DemoCta>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
