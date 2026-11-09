"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Testimonial } from "@/lib/content";
import { AiGenerateButton } from "@/components/admin/AiGenerateButton";
import { ADMIN_INPUT_CLASS as inputClass } from "@/components/admin/form-styles";
import { useAdminMutation } from "@/hooks/useAdminMutation";

export function TestimonialsEditor({ initialItems }: { initialItems: Testimonial[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Testimonial[]>(initialItems);
  const { saving, error, run } = useAdminMutation();

  const update = (index: number, field: keyof Testimonial, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const add = () => {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        quote: "",
        result: "",
        name: "",
        role: "",
        company: "",
        rating: 5,
      },
    ]);
  };

  const remove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    const data = await run(
      () =>
        fetch("/api/admin/content/testimonials", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items),
        }),
      "Save failed",
    );
    if (!data) return;
    router.refresh();
  };

  return (
    <div className="mt-6 space-y-6">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3"
        >
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">#{index + 1}</span>
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-sm text-destructive hover:text-destructive/80"
            >
              Remove
            </button>
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <label className="block text-sm text-muted-foreground">Quote</label>
              <AiGenerateButton<{ quote: string; result: string }>
                task="polishQuote"
                variant="inline"
                label="Polish wording"
                context={{ rawQuote: item.quote, result: item.result }}
                onResult={({ quote, result }) => {
                  update(index, "quote", quote);
                  if (result) update(index, "result", result);
                }}
                disabled={!item.quote.trim()}
              />
            </div>
            <textarea
              value={item.quote}
              onChange={(e) => update(index, "quote", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground">Result tag</label>
            <input
              type="text"
              value={item.result}
              onChange={(e) => update(index, "result", e.target.value)}
              placeholder="On time, under budget"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground">Name</label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => update(index, "name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground">Role</label>
              <input
                type="text"
                value={item.role}
                onChange={(e) => update(index, "role", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground">Company</label>
              <input
                type="text"
                value={item.company}
                onChange={(e) => update(index, "company", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground">Rating (1–5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={item.rating}
              onChange={(e) => update(index, "rating", parseInt(e.target.value, 10) || 5)}
              className="mt-1 w-20 rounded border border-border bg-surface/50 px-3 py-2 text-foreground"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
      >
        + Add testimonial
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="btn-base btn-primary"
      >
        {saving ? "Saving…" : "Save all testimonials"}
      </button>
    </div>
  );
}
