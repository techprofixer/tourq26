"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PricingPlan } from "@/lib/pricing-content";
import { ADMIN_INPUT_CLASS as inputClass } from "@/components/admin/form-styles";
import { useAdminMutation } from "@/hooks/useAdminMutation";

function newPlan(): PricingPlan {
  return {
    id: String(Date.now()),
    slug: "",
    name: "",
    summary: "",
    currency: "₹",
    monthlyPrice: 0,
    yearlyPrice: 0,
    discountPercent: 0,
    features: [],
    ctaLabel: "Book a Demo",
    ctaHref: "/contact",
    highlighted: false,
    sortOrder: 0,
    isActive: true,
  };
}

export function PricingEditor({ initialItems }: { initialItems: PricingPlan[] }) {
  const router = useRouter();
  const [items, setItems] = useState<PricingPlan[]>(initialItems);
  const { saving, error, run } = useAdminMutation();

  const update = <K extends keyof PricingPlan>(index: number, field: K, value: PricingPlan[K]) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const setHighlighted = (index: number, value: boolean) => {
    setItems((prev) => prev.map((p, i) => ({ ...p, highlighted: i === index ? value : false })));
  };

  const move = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const add = () => setItems((prev) => [...prev, newPlan()]);
  const remove = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const save = async () => {
    const data = await run<PricingPlan[]>(
      () =>
        fetch("/api/admin/content/pricing", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items),
        }),
      "Save failed",
    );
    if (!data) return;
    setItems(data);
    router.refresh();
  };

  return (
    <div className="mt-6 space-y-6">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`rounded-xl border p-4 space-y-3 ${
            item.highlighted ? "border-primary bg-primary/5" : "border-border/50 bg-muted/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              #{index + 1} {item.highlighted ? "· Most popular" : ""}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-sm text-destructive hover:text-destructive/80"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-sm text-muted-foreground">Plan name</label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => update(index, "name", e.target.value)}
                placeholder="Growth"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground">Currency</label>
              <input
                type="text"
                value={item.currency}
                onChange={(e) => update(index, "currency", e.target.value)}
                placeholder="₹"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground">Monthly base price</label>
              <input
                type="number"
                value={item.monthlyPrice}
                onChange={(e) => update(index, "monthlyPrice", Number(e.target.value))}
                placeholder="16650"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground">Yearly base price</label>
              <input
                type="number"
                value={item.yearlyPrice}
                onChange={(e) => update(index, "yearlyPrice", Number(e.target.value))}
                placeholder="166500"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-sm text-muted-foreground">Offer discount %</label>
              <input
                type="number"
                min={0}
                max={90}
                value={item.discountPercent}
                onChange={(e) => update(index, "discountPercent", Number(e.target.value))}
                placeholder="40"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                0 = no offer badge. The price shown on the site is the base price minus this %.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground">Tagline</label>
            <input
              type="text"
              value={item.summary}
              onChange={(e) => update(index, "summary", e.target.value)}
              placeholder="For growing teams that need everything connected."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground">Features (one per line)</label>
            <textarea
              value={item.features.join("\n")}
              onChange={(e) =>
                update(
                  index,
                  "features",
                  e.target.value.split("\n").map((f) => f.trim()).filter(Boolean),
                )
              }
              rows={5}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground">Button label</label>
              <input
                type="text"
                value={item.ctaLabel}
                onChange={(e) => update(index, "ctaLabel", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground">Button link</label>
              <input
                type="text"
                value={item.ctaHref}
                onChange={(e) => update(index, "ctaHref", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={item.highlighted}
                onChange={(e) => setHighlighted(index, e.target.checked)}
              />
              Most popular
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={item.isActive}
                onChange={(e) => update(index, "isActive", e.target.checked)}
              />
              Show on site
            </label>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
      >
        + Add plan
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="button" onClick={save} disabled={saving} className="btn-base btn-primary">
        {saving ? "Saving…" : "Save all plans"}
      </button>
    </div>
  );
}
