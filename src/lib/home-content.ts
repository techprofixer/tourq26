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

export type HomeContent = {
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

function getDefaultHomeContent(): HomeContent {
  return {
    heroEyebrow: "ENGINEERING-LED · MOBILE · WEB · AI",
    heroHeading: "Build what's next with senior engineers, not slide decks.",
    heroSubheading:
      "Torq Studio ships mobile apps, web platforms, public APIs, and grounded AI workflows. You work directly with the engineers doing the work — no account layers, no black-box estimates.",
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
    }),
  );
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
  };
  await writeSingletonSetting((args) => prisma.homePageContent.upsert(args), payload);
}
