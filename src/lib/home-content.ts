import type { Prisma } from "@prisma/client";
import { prisma, readSingletonSetting, writeSingletonSetting, SINGLETON_KEY } from "@/lib/db";

export type ServiceItem = {
  slug: string;
  title: string;
  description: string;
  result: string;
  category: string;
  icon: string;
};

export type WhyUsItem = {
  eyebrow: string;
  stat: string;
  title: string;
  description: string;
};

export type SlideItem = {
  imageUrl: string;
  alt: string;
  heading: string;
  caption: string;
  ctaLabel: string;
  ctaHref: string;
};

export type OfferItem = {
  title: string;
  description: string;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
};

export type StatItem = { value: string; label: string };
export type ProcessStep = { title: string; body: string; tag: string };
export type HomeFaqItem = { question: string; answer: string };

/**
 * Homepage settings added after the first release. Persisted together as one JSON document
 * (`HomePageContent.extras`) so each new section doesn't need its own column.
 */
export type HomeExtras = {
  /** Words the hero's "Right now we're building …" line cycles through. Empty = service titles. */
  heroRotatingWords: string[];

  proofEnabled: boolean;
  proofStats: StatItem[];
  proofRegions: string[];

  processEnabled: boolean;
  processEyebrow: string;
  processHeading: string;
  processIntro: string;
  processSteps: ProcessStep[];

  industriesEnabled: boolean;
  industriesEyebrow: string;
  industriesHeading: string;
  industriesIntro: string;

  marketPulseEnabled: boolean;
  marketPulseEyebrow: string;
  marketPulseHeading: string;
  marketPulseIntro: string;

  testimonialsEnabled: boolean;
  testimonialsEyebrow: string;
  testimonialsHeading: string;
  testimonialsIntro: string;

  faqEnabled: boolean;
  faqHeading: string;
  faqIntro: string;
  /** Empty = auto-built from the service pages' FAQs. */
  faqItems: HomeFaqItem[];

  // ---- Homepage SEO & schema (blank = fall back to Brand & SEO site defaults) ----
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoOgTitle: string;
  seoOgDescription: string;
  seoOgImageUrl: string;
  /** Absolute URL; blank = the site URL. */
  seoCanonical: string;
  seoRobotsIndex: boolean;
  schemaFaqEnabled: boolean;
  schemaServicesEnabled: boolean;
  /** Raw JSON-LD object/array appended after the generated graph. Must be valid JSON. */
  seoJsonLdCustom: string;
};

export type HomeContent = HomeExtras & {
  heroEyebrow: string;
  heroHeading: string;
  heroSubheading: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaHref: string;
  heroTertiaryCtaLabel: string;
  heroTertiaryCtaHref: string;
  heroTags: string[];

  heroImageEnabled: boolean;
  heroImageUrl: string;
  heroImageAlt: string;

  sliderEnabled: boolean;
  sliderHeading: string;
  sliderItems: SlideItem[];

  offerBannerEnabled: boolean;
  offerBannerText: string;
  offerBannerCtaLabel: string;
  offerBannerCtaHref: string;
  /** YYYY-MM-DD; banner auto-hides after this day (UTC). Blank = never expires. */
  offerBannerEndsAt: string;

  offersEnabled: boolean;
  offersHeading: string;
  offersIntro: string;
  offersItems: OfferItem[];

  servicesEyebrow: string;
  servicesHeading: string;
  servicesIntro: string;
  servicesItems: ServiceItem[];

  whyUsEyebrow: string;
  whyUsHeading: string;
  whyUsIntro: string;
  whyUsItems: WhyUsItem[];

  caseStudiesEyebrow: string;
  caseStudiesHeading: string;
  caseStudiesIntro: string;

  ctaEyebrow: string;
  ctaHeading: string;
  ctaBody: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  ctaEmail: string;
  ctaFootnote: string;

  snapshotHeading: string;
  snapshotParagraphs: string[];
};


/** True while the banner is enabled, has text, and its optional end date (inclusive, UTC) has not passed. */
export function isOfferBannerLive(
  home: Pick<HomeContent, "offerBannerEnabled" | "offerBannerText" | "offerBannerEndsAt">,
  now: Date = new Date(),
): boolean {
  if (!home.offerBannerEnabled || !home.offerBannerText.trim()) return false;
  const end = home.offerBannerEndsAt.trim();
  if (!end) return true;
  const endMs = Date.parse(`${end}T23:59:59.999Z`);
  return Number.isNaN(endMs) || now.getTime() <= endMs;
}

export function getDefaultHomeExtras(): HomeExtras {
  return {
    heroRotatingWords: [],

    proofEnabled: true,
    proofStats: [
      { value: "40%", label: "Lower cost vs. local-only hire" },
      { value: "100%", label: "On-time milestone delivery" },
      { value: "50+", label: "Production launches shipped" },
      { value: "24h", label: "Average first-reply window" },
    ],
    proofRegions: ["Mumbai", "Pune", "Bengaluru", "Delhi NCR", "Hyderabad", "Chennai"],

    processEnabled: true,
    processEyebrow: "HOW WE WORK",
    processHeading: "Five steps from first call to go-live.",
    processIntro:
      "A predictable process is how we keep estimates honest and scope from silently doubling after kickoff.",
    processSteps: [
      {
        title: "Discovery call",
        body: "Free 30 minutes. Bring a problem, a stack, or a one-pager — we reply with a fixed scope, a paid discovery, or an honest redirect.",
        tag: "DAY 1",
      },
      {
        title: "Scope & estimate",
        body: "Written scope, written acceptance criteria, a defensible timeline. Finance sees a number; engineering sees a definition of done.",
        tag: "WEEK 1",
      },
      {
        title: "Design & architecture",
        body: "Flows, data model, and integration decisions documented before code, so surprises surface while they are still cheap.",
        tag: "WEEK 1–2",
      },
      {
        title: "Build in weekly cycles",
        body: "Senior engineers ship working increments every week with a checkpoint demo. You see progress, not status reports.",
        tag: "WEEKLY",
      },
      {
        title: "Launch & hand-over",
        body: "Store submission, monitoring, runbooks and READMEs your team can audit — then support that matches how you operate.",
        tag: "GO-LIVE",
      },
    ],

    industriesEnabled: true,
    industriesEyebrow: "INDUSTRIES",
    industriesHeading: "Domain-aware, not one-size-fits-all.",
    industriesIntro: "Regulation, integrations, and user expectations differ by sector. We start from yours.",

    marketPulseEnabled: true,
    marketPulseEyebrow: "MARKET PULSE",
    marketPulseHeading: "What\u2019s moving in tech, as it moves.",
    marketPulseIntro:
      "Our engineers track the shifts that change build decisions — AI, cloud, security, tooling. Updated as we publish.",

    testimonialsEnabled: true,
    testimonialsEyebrow: "CLIENT VOICE",
    testimonialsHeading: "Teams that shipped with us.",
    testimonialsIntro:
      "Founders, CTOs, and operations leads on what changed in their stack after we shipped — and what they kept.",

    faqEnabled: true,
    faqHeading: "Questions teams ask before we talk.",
    faqIntro: "Straight answers on scope, pricing, timelines and how we work.",
    faqItems: [],

    seoMetaTitle: "",
    seoMetaDescription: "",
    seoOgTitle: "",
    seoOgDescription: "",
    seoOgImageUrl: "",
    seoCanonical: "",
    seoRobotsIndex: true,
    schemaFaqEnabled: true,
    schemaServicesEnabled: true,
    seoJsonLdCustom: "",
  };
}

// --- defensive parsing of the `extras` JSON document (it is hand-editable + schemaless) ---
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const pStr = (v: unknown, d: string, blankOk = false) =>
  typeof v === "string" && (blankOk || v.trim()) ? v : d;
const pBool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
const pStrArr = (v: unknown, d: string[]) =>
  Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : d;
function pObjArr<T>(v: unknown, d: T[], ok: (x: Record<string, unknown>) => boolean, emptyIsDefault: boolean): T[] {
  if (!Array.isArray(v) || !v.every((x) => isObj(x) && ok(x))) return d;
  return v.length === 0 && emptyIsDefault ? d : (v as T[]);
}

export function parseHomeExtras(raw: unknown): HomeExtras {
  const d = getDefaultHomeExtras();
  if (!isObj(raw)) return d;
  const r = raw;
  return {
    heroRotatingWords: pStrArr(r.heroRotatingWords, d.heroRotatingWords),

    proofEnabled: pBool(r.proofEnabled, d.proofEnabled),
    proofStats: pObjArr<StatItem>(
      r.proofStats, d.proofStats, (x) => typeof x.value === "string" && typeof x.label === "string", true),
    proofRegions: pStrArr(r.proofRegions, d.proofRegions),

    processEnabled: pBool(r.processEnabled, d.processEnabled),
    processEyebrow: pStr(r.processEyebrow, d.processEyebrow),
    processHeading: pStr(r.processHeading, d.processHeading),
    processIntro: pStr(r.processIntro, d.processIntro),
    processSteps: pObjArr<ProcessStep>(
      r.processSteps, d.processSteps, (x) => typeof x.title === "string" && typeof x.body === "string", true),

    industriesEnabled: pBool(r.industriesEnabled, d.industriesEnabled),
    industriesEyebrow: pStr(r.industriesEyebrow, d.industriesEyebrow),
    industriesHeading: pStr(r.industriesHeading, d.industriesHeading),
    industriesIntro: pStr(r.industriesIntro, d.industriesIntro),

    marketPulseEnabled: pBool(r.marketPulseEnabled, d.marketPulseEnabled),
    marketPulseEyebrow: pStr(r.marketPulseEyebrow, d.marketPulseEyebrow),
    marketPulseHeading: pStr(r.marketPulseHeading, d.marketPulseHeading),
    marketPulseIntro: pStr(r.marketPulseIntro, d.marketPulseIntro),

    testimonialsEnabled: pBool(r.testimonialsEnabled, d.testimonialsEnabled),
    testimonialsEyebrow: pStr(r.testimonialsEyebrow, d.testimonialsEyebrow),
    testimonialsHeading: pStr(r.testimonialsHeading, d.testimonialsHeading),
    testimonialsIntro: pStr(r.testimonialsIntro, d.testimonialsIntro),

    faqEnabled: pBool(r.faqEnabled, d.faqEnabled),
    faqHeading: pStr(r.faqHeading, d.faqHeading),
    faqIntro: pStr(r.faqIntro, d.faqIntro, true),
    faqItems: pObjArr<HomeFaqItem>(
      r.faqItems, d.faqItems, (x) => typeof x.question === "string" && typeof x.answer === "string", false),

    seoMetaTitle: pStr(r.seoMetaTitle, "", true),
    seoMetaDescription: pStr(r.seoMetaDescription, "", true),
    seoOgTitle: pStr(r.seoOgTitle, "", true),
    seoOgDescription: pStr(r.seoOgDescription, "", true),
    seoOgImageUrl: pStr(r.seoOgImageUrl, "", true),
    seoCanonical: pStr(r.seoCanonical, "", true),
    seoRobotsIndex: pBool(r.seoRobotsIndex, d.seoRobotsIndex),
    schemaFaqEnabled: pBool(r.schemaFaqEnabled, d.schemaFaqEnabled),
    schemaServicesEnabled: pBool(r.schemaServicesEnabled, d.schemaServicesEnabled),
    seoJsonLdCustom: pStr(r.seoJsonLdCustom, "", true),
  };
}

/** Returns an error message when `raw` is not empty and not valid JSON-LD (object or array of objects). */
export function validateJsonLdText(raw: string): string | null {
  if (!raw.trim()) return null;
  try {
    const v: unknown = JSON.parse(raw);
    const items = Array.isArray(v) ? v : [v];
    if (items.length === 0 || !items.every(isObj)) return "JSON-LD must be an object or an array of objects.";
    return null;
  } catch (e) {
    return `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`;
  }
}

/** Parsed custom JSON-LD objects (empty when unset or invalid — never throws). */
export function customHomeJsonLd(raw: string): Record<string, unknown>[] {
  if (validateJsonLdText(raw) || !raw.trim()) return [];
  const v: unknown = JSON.parse(raw);
  return (Array.isArray(v) ? v : [v]).filter(isObj);
}

function getDefaultHomeContent(): HomeContent {
  return {
    heroEyebrow: "MUMBAI · INDIA",
    heroHeading: "Mobile, web and AI built by senior engineers.",
    heroSubheading:
      "Torq Studio is a Mumbai-based engineering studio shipping mobile apps, web platforms, CRMs and grounded AI workflows for businesses across India. You work directly with the engineers — senior engineers, not slide decks.",
    heroPrimaryCtaLabel: "Get started",
    heroPrimaryCtaHref: "/contact",
    heroSecondaryCtaLabel: "Book free consultation",
    heroSecondaryCtaHref: "/contact",
    heroTertiaryCtaLabel: "See results",
    heroTertiaryCtaHref: "/#case-studies",
    heroTags: ["Mobile apps", "Web platforms", "APIs", "AI workflows", "Consulting"],

    heroImageEnabled: false,
    heroImageUrl: "",
    heroImageAlt: "",

    sliderEnabled: false,
    sliderHeading: "FEATURED WORK",
    sliderItems: [],

    offerBannerEnabled: false,
    offerBannerText: "Limited-time: free architecture review with every new engagement booked this month.",
    offerBannerCtaLabel: "Claim this offer",
    offerBannerCtaHref: "/contact",
    offerBannerEndsAt: "",

    offersEnabled: false,
    offersHeading: "Current offers",
    offersIntro: "Time-boxed ways to start working together with less upfront commitment.",
    offersItems: [],

    servicesEyebrow: "THE TORQ STUDIO PLATFORM",
    servicesHeading: "Services that ship — not roadmaps in PDF.",
    servicesIntro:
      "Senior engineers across mobile, web, APIs, and AI. Pick a discipline below for delivery patterns, engagement shapes, and FAQs founders ask.",
    servicesItems: [
      {
        slug: "mobile-app-development",
        title: "Mobile applications",
        description:
          "Native and cross-platform iOS / Android / React Native. Store submission, push, offline, analytics, release trains.",
        result: "Faster launch, lower cost",
        category: "MOBILE",
        icon: "/images/icons/mobile.svg",
      },
      {
        slug: "web-development",
        title: "Web platforms & APIs",
        description:
          "Marketing sites, customer portals, internal tools, partner APIs. Performance, accessibility, SEO where it matters.",
        result: "Convert and scale",
        category: "WEB / API",
        icon: "/images/icons/web.svg",
      },
      {
        slug: "ai-solutions",
        title: "Grounded AI workflows",
        description:
          "Retrieval, tool-use, evals, and human review — not chatbot demos. We add AI only where the workflow improves.",
        result: "Workflow lift, measurable",
        category: "AI",
        icon: "/images/icons/ai.svg",
      },
      {
        slug: "remote-it",
        title: "Embedded remote engineering",
        description:
          "Dedicated engineers and small squads that work inside your repos, rituals, and incident channels.",
        result: "Elastic capacity",
        category: "REMOTE IT",
        icon: "/images/icons/team.svg",
      },
      {
        slug: "technical-consulting",
        title: "Architecture & advisory",
        description:
          "Code reviews, estimates, vendor diligence, and architecture reviews — written outputs, not slideware.",
        result: "Clarity before code",
        category: "CONSULTING",
        icon: "/images/icons/web.svg",
      },
    ],

    whyUsEyebrow: "WHY TORQ STUDIO",
    whyUsHeading: "Grounded in production work, not theatre.",
    whyUsIntro:
      "Three things teams hear back from clients again and again — the same three things we optimise for from kickoff through hand-over.",
    whyUsItems: [
      {
        eyebrow: "COST DISCIPLINE",
        stat: "40%",
        title: "Lower spend, same senior bar",
        description:
          "Efficient delivery and remote talent free budget for product work — without trading away senior-engineer quality on the critical path.",
      },
      {
        eyebrow: "DELIVERY",
        stat: "100%",
        title: "On-time, milestone-checked",
        description:
          "Written scope, written acceptance criteria, weekly checkpoints. Finance and leadership see steady progress — not a status meeting.",
      },
      {
        eyebrow: "OWNERSHIP",
        stat: "1:1",
        title: "Engineers, not account layers",
        description:
          "You speak with the people writing and reviewing your code. Handover ships with READMEs and runbooks your team can audit.",
      },
    ],

    caseStudiesEyebrow: "PROOF IN PRACTICE",
    caseStudiesHeading: "Outcomes from real engagements.",
    caseStudiesIntro:
      "Each write-up covers context, constraints, what we shipped, and what we changed about the system after launch.",

    ctaEyebrow: "START THE CONVERSATION",
    ctaHeading: "Start building on Torq Studio.",
    ctaBody:
      "Free 30-minute call — bring a problem, a stack, or a one-pager. We'll respond with a sensible next step: a fixed scope, a paid discovery, or a polite redirect if we're not the fit.",
    ctaPrimaryLabel: "Contact sales",
    ctaPrimaryHref: "/contact",
    ctaSecondaryLabel: "Get started now",
    ctaSecondaryHref: "/contact",
    ctaEmail: "connect@torqstudio.com",
    ctaFootnote: "NO COMMITMENT · 24 HOUR REPLY",

    snapshotHeading: "Snapshot for technical decision-makers",
    ...getDefaultHomeExtras(),

    snapshotParagraphs: [
      "Torq Studio is a senior-engineering-led practice: we build and advise on mobile applications, customer-facing websites, internal web platforms, public and partner APIs, and practical AI automation where there is a measurable workflow to improve.",
      "Clients choose us when delivery risk is high—store review, traffic spikes, integration breakage, or governance—and they want direct access to the people doing the work. We document scope, acceptance criteria, and milestone checkpoints so finance and leadership see steady progress, not black-box development.",
      "Engagement models span fixed-scope MVPs, ongoing retainers, embedded squads, and paid discovery or architecture reviews when you need confidence before funding a larger build. Explore services for discipline-specific detail, case studies for comparable contexts, or contact us for a free 30-minute consultation.",
    ],
  };
}

function isServiceItemArray(v: unknown): v is ServiceItem[] {
  return (
    Array.isArray(v) &&
    v.every(
      (x) =>
        x &&
        typeof x === "object" &&
        typeof (x as ServiceItem).slug === "string" &&
        typeof (x as ServiceItem).title === "string",
    )
  );
}

function isWhyUsItemArray(v: unknown): v is WhyUsItem[] {
  return (
    Array.isArray(v) &&
    v.every(
      (x) =>
        x &&
        typeof x === "object" &&
        typeof (x as WhyUsItem).title === "string" &&
        typeof (x as WhyUsItem).stat === "string",
    )
  );
}

function isSlideItemArray(v: unknown): v is SlideItem[] {
  return (
    Array.isArray(v) &&
    v.every(
      (x) =>
        x &&
        typeof x === "object" &&
        typeof (x as SlideItem).imageUrl === "string",
    )
  );
}

function isOfferItemArray(v: unknown): v is OfferItem[] {
  return (
    Array.isArray(v) &&
    v.every(
      (x) =>
        x &&
        typeof x === "object" &&
        typeof (x as OfferItem).title === "string",
    )
  );
}

export async function readHomeContent(): Promise<HomeContent> {
  return readSingletonSetting(
    () => prisma.homePageContent.findUnique({ where: { key: SINGLETON_KEY } }),
    getDefaultHomeContent,
    (row, d) => ({
    heroEyebrow: row.heroEyebrow || d.heroEyebrow,
    heroHeading: row.heroHeading || d.heroHeading,
    heroSubheading: row.heroSubheading || d.heroSubheading,
    heroPrimaryCtaLabel: row.heroPrimaryCtaLabel || d.heroPrimaryCtaLabel,
    heroPrimaryCtaHref: row.heroPrimaryCtaHref || d.heroPrimaryCtaHref,
    heroSecondaryCtaLabel: row.heroSecondaryCtaLabel || d.heroSecondaryCtaLabel,
    heroSecondaryCtaHref: row.heroSecondaryCtaHref || d.heroSecondaryCtaHref,
    heroTertiaryCtaLabel: row.heroTertiaryCtaLabel || d.heroTertiaryCtaLabel,
    heroTertiaryCtaHref: row.heroTertiaryCtaHref || d.heroTertiaryCtaHref,
    heroTags: row.heroTags.length ? row.heroTags : d.heroTags,

    heroImageEnabled: row.heroImageEnabled ?? d.heroImageEnabled,
    heroImageUrl: row.heroImageUrl || d.heroImageUrl,
    heroImageAlt: row.heroImageAlt || d.heroImageAlt,

    sliderEnabled: row.sliderEnabled ?? d.sliderEnabled,
    sliderHeading: row.sliderHeading || d.sliderHeading,
    sliderItems: isSlideItemArray(row.sliderItems) ? row.sliderItems : d.sliderItems,

    offerBannerEnabled: row.offerBannerEnabled ?? d.offerBannerEnabled,
    offerBannerText: row.offerBannerText || d.offerBannerText,
    offerBannerCtaLabel: row.offerBannerCtaLabel || d.offerBannerCtaLabel,
    offerBannerCtaHref: row.offerBannerCtaHref || d.offerBannerCtaHref,
    offerBannerEndsAt: row.offerBannerEndsAt || d.offerBannerEndsAt,

    offersEnabled: row.offersEnabled ?? d.offersEnabled,
    offersHeading: row.offersHeading || d.offersHeading,
    offersIntro: row.offersIntro || d.offersIntro,
    offersItems: isOfferItemArray(row.offersItems) ? row.offersItems : d.offersItems,

    servicesEyebrow: row.servicesEyebrow || d.servicesEyebrow,
    servicesHeading: row.servicesHeading || d.servicesHeading,
    servicesIntro: row.servicesIntro || d.servicesIntro,
    servicesItems: isServiceItemArray(row.servicesItems) ? row.servicesItems : d.servicesItems,

    whyUsEyebrow: row.whyUsEyebrow || d.whyUsEyebrow,
    whyUsHeading: row.whyUsHeading || d.whyUsHeading,
    whyUsIntro: row.whyUsIntro || d.whyUsIntro,
    whyUsItems: isWhyUsItemArray(row.whyUsItems) ? row.whyUsItems : d.whyUsItems,

    caseStudiesEyebrow: row.caseStudiesEyebrow || d.caseStudiesEyebrow,
    caseStudiesHeading: row.caseStudiesHeading || d.caseStudiesHeading,
    caseStudiesIntro: row.caseStudiesIntro || d.caseStudiesIntro,

    ctaEyebrow: row.ctaEyebrow || d.ctaEyebrow,
    ctaHeading: row.ctaHeading || d.ctaHeading,
    ctaBody: row.ctaBody || d.ctaBody,
    ctaPrimaryLabel: row.ctaPrimaryLabel || d.ctaPrimaryLabel,
    ctaPrimaryHref: row.ctaPrimaryHref || d.ctaPrimaryHref,
    ctaSecondaryLabel: row.ctaSecondaryLabel || d.ctaSecondaryLabel,
    ctaSecondaryHref: row.ctaSecondaryHref || d.ctaSecondaryHref,
    ctaEmail: row.ctaEmail || d.ctaEmail,
    ctaFootnote: row.ctaFootnote || d.ctaFootnote,

    snapshotHeading: row.snapshotHeading || d.snapshotHeading,
    snapshotParagraphs: row.snapshotParagraphs.length ? row.snapshotParagraphs : d.snapshotParagraphs,

    ...parseHomeExtras((row as { extras?: unknown }).extras),
    }),
  );
}

/** The slice of HomeContent persisted in the `extras` JSON column. */
export function pickHomeExtras(data: HomeContent): HomeExtras {
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(getDefaultHomeExtras())) out[key] = (data as Record<string, unknown>)[key];
  return out as unknown as HomeExtras;
}

export async function writeHomeContent(data: HomeContent): Promise<void> {
  const payload = {
    heroEyebrow: data.heroEyebrow,
    heroHeading: data.heroHeading,
    heroSubheading: data.heroSubheading,
    heroPrimaryCtaLabel: data.heroPrimaryCtaLabel,
    heroPrimaryCtaHref: data.heroPrimaryCtaHref,
    heroSecondaryCtaLabel: data.heroSecondaryCtaLabel,
    heroSecondaryCtaHref: data.heroSecondaryCtaHref,
    heroTertiaryCtaLabel: data.heroTertiaryCtaLabel,
    heroTertiaryCtaHref: data.heroTertiaryCtaHref,
    heroTags: data.heroTags,

    heroImageEnabled: data.heroImageEnabled,
    heroImageUrl: data.heroImageUrl,
    heroImageAlt: data.heroImageAlt,

    sliderEnabled: data.sliderEnabled,
    sliderHeading: data.sliderHeading,
    sliderItems: data.sliderItems,

    offerBannerEnabled: data.offerBannerEnabled,
    offerBannerText: data.offerBannerText,
    offerBannerCtaLabel: data.offerBannerCtaLabel,
    offerBannerCtaHref: data.offerBannerCtaHref,
    offerBannerEndsAt: data.offerBannerEndsAt.trim(),

    offersEnabled: data.offersEnabled,
    offersHeading: data.offersHeading,
    offersIntro: data.offersIntro,
    offersItems: data.offersItems,

    servicesEyebrow: data.servicesEyebrow,
    servicesHeading: data.servicesHeading,
    servicesIntro: data.servicesIntro,
    servicesItems: data.servicesItems,

    whyUsEyebrow: data.whyUsEyebrow,
    whyUsHeading: data.whyUsHeading,
    whyUsIntro: data.whyUsIntro,
    whyUsItems: data.whyUsItems,

    caseStudiesEyebrow: data.caseStudiesEyebrow,
    caseStudiesHeading: data.caseStudiesHeading,
    caseStudiesIntro: data.caseStudiesIntro,

    ctaEyebrow: data.ctaEyebrow,
    ctaHeading: data.ctaHeading,
    ctaBody: data.ctaBody,
    ctaPrimaryLabel: data.ctaPrimaryLabel,
    ctaPrimaryHref: data.ctaPrimaryHref,
    ctaSecondaryLabel: data.ctaSecondaryLabel,
    ctaSecondaryHref: data.ctaSecondaryHref,
    ctaEmail: data.ctaEmail,
    ctaFootnote: data.ctaFootnote,

    snapshotHeading: data.snapshotHeading,
    snapshotParagraphs: data.snapshotParagraphs,

    extras: pickHomeExtras(data) as unknown as Prisma.InputJsonValue,
  };
  await writeSingletonSetting((args) => prisma.homePageContent.upsert(args), payload);
}
