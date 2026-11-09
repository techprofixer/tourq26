import { prisma, withDbTimeout } from "@/lib/db";

export type PricingPlan = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  currency: string;
  /** Base (pre-discount) price billed monthly. */
  monthlyPrice: number;
  /** Base (pre-discount) price billed yearly (in total, not per-month). */
  yearlyPrice: number;
  /** Offer discount applied to the base price for display, e.g. 40 = 40% off. 0 = no offer. */
  discountPercent: number;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  /** Renders the plan as the emphasized "most popular" card. */
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
};

/**
 * `PricingPlan.features` is a free-form Prisma `Json?` column. We pack the
 * per-plan display extras (monthly/yearly base price, discount, highlighted)
 * into it alongside the feature list rather than adding dedicated columns,
 * since nothing else reads this model yet — keeps the schema untouched while
 * still giving admins full control over every field below.
 */
type FeaturesBlobRaw = {
  items?: unknown;
  monthlyPrice?: unknown;
  yearlyPrice?: unknown;
  discountPercent?: unknown;
  highlighted?: unknown;
};

type FeaturesBlobOut = {
  items: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  discountPercent: number;
  highlighted: boolean;
};

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseFeaturesBlob(raw: unknown): FeaturesBlobOut {
  const blob = (raw && typeof raw === "object" ? raw : {}) as FeaturesBlobRaw;
  const items = Array.isArray(blob.items) ? blob.items.filter((x): x is string => typeof x === "string") : [];
  const monthlyPrice = toNumber(blob.monthlyPrice, 0);
  const yearlyPrice = toNumber(blob.yearlyPrice, 0);
  const discountPercent = toNumber(blob.discountPercent, 0);
  const highlighted = blob.highlighted === true;
  return { items, monthlyPrice, yearlyPrice, discountPercent, highlighted };
}

function toFeaturesBlob(
  plan: Pick<PricingPlan, "features" | "monthlyPrice" | "yearlyPrice" | "discountPercent" | "highlighted">,
): FeaturesBlobOut {
  return {
    items: plan.features,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    discountPercent: plan.discountPercent,
    highlighted: plan.highlighted,
  };
}

function toPricingPlan(row: {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  priceLabel: string | null;
  currency: string | null;
  features: unknown;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  isActive: boolean;
}): PricingPlan {
  const { items, monthlyPrice, yearlyPrice, discountPercent, highlighted } = parseFeaturesBlob(row.features);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary ?? "",
    currency: row.currency ?? "₹",
    monthlyPrice,
    yearlyPrice,
    discountPercent,
    features: items,
    ctaLabel: row.ctaLabel ?? "Book a Demo",
    ctaHref: row.ctaHref ?? "/contact",
    highlighted,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    slug: "starter",
    name: "Starter",
    summary: "For small teams ready to get off spreadsheets.",
    currency: "₹",
    monthlyPrice: 8325,
    yearlyPrice: 83250,
    discountPercent: 40,
    features: ["CRM & pipeline", "Job management", "Up to 5 team members", "Email support"],
    ctaLabel: "Book a Demo",
    ctaHref: "/contact",
    highlighted: false,
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "growth",
    slug: "growth",
    name: "Growth",
    summary: "For growing teams that need everything connected.",
    currency: "₹",
    monthlyPrice: 16650,
    yearlyPrice: 166500,
    discountPercent: 40,
    features: [
      "Everything in Starter",
      "Finance dashboard & reporting",
      "Quotation & catalog",
      "Up to 20 team members",
      "Priority support",
    ],
    ctaLabel: "Book a Demo",
    ctaHref: "/contact",
    highlighted: true,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "scale",
    slug: "scale",
    name: "Scale",
    summary: "For multi-location operations running at full scale.",
    currency: "₹",
    monthlyPrice: 26650,
    yearlyPrice: 266500,
    discountPercent: 40,
    features: [
      "Everything in Growth",
      "CMS & website",
      "AMC & ticket manager",
      "Unlimited team members",
      "Dedicated onboarding",
    ],
    ctaLabel: "Book a Demo",
    ctaHref: "/contact",
    highlighted: false,
    sortOrder: 2,
    isActive: true,
  },
];

/** Public read — active plans only, for the marketing page. Falls back to the default tiers if none are configured yet. */
export async function readPricingPlans(): Promise<PricingPlan[]> {
  try {
    const rows = await withDbTimeout(
      prisma.pricingPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    );
    if (rows.length === 0) return DEFAULT_PRICING_PLANS;
    return rows.map(toPricingPlan);
  } catch {
    return DEFAULT_PRICING_PLANS;
  }
}

/** Admin read — every plan (active or not), for the editor. Falls back to the default tiers so the first visit has something to edit. */
export async function readAllPricingPlans(): Promise<PricingPlan[]> {
  try {
    const rows = await withDbTimeout(prisma.pricingPlan.findMany({ orderBy: { sortOrder: "asc" } }));
    if (rows.length === 0) return DEFAULT_PRICING_PLANS;
    return rows.map(toPricingPlan);
  } catch {
    return DEFAULT_PRICING_PLANS;
  }
}

function slugify(input: string, fallback: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

export async function writePricingPlans(items: PricingPlan[]): Promise<PricingPlan[]> {
  const seen = new Set<string>();
  const withSlugs = items.map((p, i) => {
    let slug = slugify(p.slug || p.name, `plan-${i + 1}`);
    while (seen.has(slug)) slug = `${slug}-${i + 1}`;
    seen.add(slug);
    return { ...p, slug };
  });

  const slugs = withSlugs.map((p) => p.slug);
  await prisma.$transaction([
    prisma.pricingPlan.deleteMany({ where: { slug: { notIn: slugs } } }),
    ...withSlugs.map((p, i) =>
      prisma.pricingPlan.upsert({
        where: { slug: p.slug },
        create: {
          slug: p.slug,
          name: p.name,
          summary: p.summary,
          currency: p.currency,
          features: toFeaturesBlob(p),
          ctaLabel: p.ctaLabel,
          ctaHref: p.ctaHref,
          sortOrder: i,
          isActive: p.isActive,
        },
        update: {
          name: p.name,
          summary: p.summary,
          currency: p.currency,
          features: toFeaturesBlob(p),
          ctaLabel: p.ctaLabel,
          ctaHref: p.ctaHref,
          sortOrder: i,
          isActive: p.isActive,
        },
      }),
    ),
  ]);

  return readAllPricingPlans();
}
