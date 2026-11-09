"use client";

import { useMemo, useState } from "react";
import type { PricingPlan } from "@/lib/pricing-content";
import DemoCta from "./DemoCta";
import { CheckIcon } from "./icons";

type Cadence = "monthly" | "yearly";

const INR_FORMATTER = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function formatPrice(value: number): string {
  return INR_FORMATTER.format(Math.round(value));
}

export default function PricingPlans({ plans }: { plans: PricingPlan[] }) {
  const [cadence, setCadence] = useState<Cadence>("monthly");

  /** Representative annual saving (base yearly vs. 12x base monthly) shown on the toggle itself. */
  const annualSavingsPercent = useMemo(() => {
    const withBoth = plans.find((p) => p.monthlyPrice > 0 && p.yearlyPrice > 0);
    if (!withBoth) return 0;
    const fullYear = withBoth.monthlyPrice * 12;
    if (fullYear <= 0) return 0;
    return Math.max(0, Math.round((1 - withBoth.yearlyPrice / fullYear) * 100));
  }, [plans]);

  return (
    <div>
      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface p-1">
          {(
            [
              { key: "monthly", label: "Monthly" },
              { key: "yearly", label: "Yearly" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setCadence(key)}
              aria-pressed={cadence === key}
              className={`mono-label relative rounded-full px-5 py-2.5 transition-colors ${
                cadence === key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {key === "yearly" && annualSavingsPercent > 0 ? (
                <span
                  className="mono-label absolute -top-3 -right-3 rounded-full px-2 py-0.5 text-[9px] text-[#050505]"
                  style={{ background: "var(--brand-mint)" }}
                >
                  SAVE {annualSavingsPercent}%
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const basePrice = cadence === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
          const hasOffer = plan.discountPercent > 0 && basePrice > 0;
          const finalPrice = hasOffer ? basePrice * (1 - plan.discountPercent / 100) : basePrice;
          const period = cadence === "monthly" ? "/month" : "/year";

          return (
            <div
              key={plan.slug}
              className={`flex flex-col overflow-hidden rounded-[var(--radius-sm)] ${
                plan.highlighted ? "" : "border border-hairline"
              }`}
            >
              {plan.highlighted ? (
                <span
                  aria-hidden
                  className="block h-[3px] w-full shrink-0"
                  style={{ background: "var(--brand-gradient)" }}
                />
              ) : null}
              <div
                className={`flex flex-1 flex-col p-8 ${
                  plan.highlighted ? "card-flat-on-dark" : "bg-surface"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {plan.highlighted ? (
                    <span className="mono-label inline-flex w-fit items-center rounded-full bg-[var(--brand-mint)] px-3 py-1 text-[#050505]">
                      MOST POPULAR
                    </span>
                  ) : null}
                  {hasOffer ? (
                    <span
                      className={`mono-label inline-flex w-fit items-center rounded-full border px-3 py-1 ${
                        plan.highlighted
                          ? "border-[var(--brand-orange)]/50 text-[var(--brand-orange)]"
                          : "border-[var(--brand-orange)]/40 bg-[var(--brand-orange)]/10 text-[var(--brand-orange)]"
                      }`}
                    >
                      {plan.discountPercent}% OFF
                    </span>
                  ) : null}
                </div>
                <p className={`display-sm mt-4 ${plan.highlighted ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </p>
                <p className={`mt-2 text-[14px] leading-[1.4] ${plan.highlighted ? "text-white/60" : "text-muted-foreground"}`}>
                  {plan.summary}
                </p>

                <div className="mt-6">
                  {hasOffer ? (
                    <span className={`mono-label block ${plan.highlighted ? "text-white/40" : "text-muted-foreground/70"}`}>
                      <span className="line-through">
                        {plan.currency}
                        {formatPrice(basePrice)}
                      </span>
                    </span>
                  ) : null}
                  <div className="flex items-baseline gap-1.5">
                    <span className={`mono-label ${plan.highlighted ? "text-white/50" : "text-muted-foreground"}`}>
                      {plan.currency}
                    </span>
                    <span
                      className={`display-xxl ${plan.highlighted ? "text-white" : "text-foreground"}`}
                      style={{ fontSize: "clamp(36px, 5vw, 48px)" }}
                    >
                      {formatPrice(finalPrice)}
                    </span>
                    <span className={`mono-label ${plan.highlighted ? "text-white/50" : "text-muted-foreground"}`}>
                      {period}
                    </span>
                  </div>
                </div>

                <DemoCta
                  ctaId={`pricing-${plan.slug}`}
                  href={plan.ctaHref}
                  className={`btn-base mt-6 w-full ${plan.highlighted ? "btn-mint" : "btn-outline"}`}
                >
                  {plan.ctaLabel}
                </DemoCta>

                <ul
                  className={`mt-8 space-y-3 border-t pt-6 ${
                    plan.highlighted ? "border-[var(--brand-hairline-on-dark)]" : "border-hairline"
                  }`}
                >
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[14px] leading-[1.4]">
                      <CheckIcon
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          plan.highlighted ? "text-[var(--brand-mint)]" : "text-foreground/60"
                        }`}
                      />
                      <span className={plan.highlighted ? "text-white/80" : "text-foreground/80"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
