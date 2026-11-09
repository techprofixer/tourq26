import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { readAllPricingPlans, writePricingPlans, type PricingPlan } from "@/lib/pricing-content";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async () => {
  const items = await readAllPricingPlans();
  return NextResponse.json(items);
});

export const PUT = withAdmin(async (request: NextRequest) => {
  const body = await request.json();
  const items = Array.isArray(body) ? body : [];
  const plans: PricingPlan[] = items.map((p: Record<string, unknown>, i: number) => ({
    id: typeof p.id === "string" ? p.id : String(i + 1),
    slug: typeof p.slug === "string" ? p.slug : "",
    name: typeof p.name === "string" ? p.name : "",
    summary: typeof p.summary === "string" ? p.summary : "",
    currency: typeof p.currency === "string" ? p.currency : "₹",
    monthlyPrice: Number.isFinite(Number(p.monthlyPrice)) ? Number(p.monthlyPrice) : 0,
    yearlyPrice: Number.isFinite(Number(p.yearlyPrice)) ? Number(p.yearlyPrice) : 0,
    discountPercent: Number.isFinite(Number(p.discountPercent)) ? Number(p.discountPercent) : 0,
    features: Array.isArray(p.features) ? p.features.filter((f): f is string => typeof f === "string") : [],
    ctaLabel: typeof p.ctaLabel === "string" ? p.ctaLabel : "Book a Demo",
    ctaHref: typeof p.ctaHref === "string" ? p.ctaHref : "/contact",
    highlighted: p.highlighted === true,
    sortOrder: i,
    isActive: p.isActive !== false,
  }));
  const saved = await writePricingPlans(plans);
  void logActivity({ entityType: "pricing", action: "updated", summary: `Updated pricing plans (${saved.length} total)` });
  revalidatePath("/torqos");
  return NextResponse.json(saved);
});
