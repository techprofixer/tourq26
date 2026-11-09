"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FooterContent } from "@/lib/footer-content";
import { AiGenerateButton } from "@/components/admin/AiGenerateButton";
import { ADMIN_INPUT_CLASS as inputClass } from "@/components/admin/form-styles";

export function FooterForm({ initialData }: { initialData: FooterContent }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = <K extends keyof FooterContent>(key: K, value: FooterContent[K]) => {
    setSuccess(false);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateColumnEyebrow = (colIndex: number, eyebrow: string) => {
    update(
      "columns",
      data.columns.map((c, i) => (i === colIndex ? { ...c, eyebrow } : c)),
    );
  };

  const updateLink = (colIndex: number, linkIndex: number, patch: { label?: string; href?: string }) => {
    update(
      "columns",
      data.columns.map((c, i) =>
        i === colIndex
          ? { ...c, links: c.links.map((l, j) => (j === linkIndex ? { ...l, ...patch } : l)) }
          : c,
      ),
    );
  };

  const addLink = (colIndex: number) => {
    update(
      "columns",
      data.columns.map((c, i) => (i === colIndex ? { ...c, links: [...c.links, { label: "New link", href: "/" }] } : c)),
    );
  };

  const removeLink = (colIndex: number, linkIndex: number) => {
    update(
      "columns",
      data.columns.map((c, i) =>
        i === colIndex ? { ...c, links: c.links.filter((_, j) => j !== linkIndex) } : c,
      ),
    );
  };

  const save = async () => {
    setError("");
    setSuccess(false);
    setSaving(true);
    const res = await fetch("/api/admin/content/footer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Save failed");
      return;
    }
    setSuccess(true);
    router.refresh();
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="mt-8 max-w-3xl space-y-10">
      <section className="card-flat space-y-4">
        <h2 className="font-display text-base font-semibold text-foreground">Brand summary</h2>
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label className="block text-sm font-medium text-foreground/90">Blurb</label>
            <AiGenerateButton<string>
              task="shortCopy"
              variant="inline"
              context={{ purpose: "footer brand blurb summarizing what the studio does", siteContext: data.blurb }}
              onResult={(text) => update("blurb", text)}
            />
          </div>
          <textarea value={data.blurb} onChange={(e) => update("blurb", e.target.value)} rows={3} className={inputClass} />
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label className="block text-sm font-medium text-foreground/90">Tagline (bottom-right line)</label>
            <AiGenerateButton<string>
              task="shortCopy"
              variant="inline"
              context={{ purpose: "one-line footer tagline for a software studio", siteContext: data.tagline }}
              onResult={(text) => update("tagline", text)}
            />
          </div>
          <input type="text" value={data.tagline} onChange={(e) => update("tagline", e.target.value)} className={inputClass} />
        </div>
      </section>

      <section className="card-flat space-y-4">
        <h2 className="display-sm text-foreground">Columns</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {data.columns.map((col, ci) => (
            <div key={ci} className="rounded-lg border border-border p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground/90">Column heading</label>
                <input
                  type="text"
                  value={col.eyebrow}
                  onChange={(e) => updateColumnEyebrow(ci, e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                {col.links.map((link, li) => (
                  <div key={li} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateLink(ci, li, { label: e.target.value })}
                      placeholder="Label"
                      className={`${inputClass} mt-0`}
                    />
                    <input
                      type="text"
                      value={link.href}
                      onChange={(e) => updateLink(ci, li, { href: e.target.value })}
                      placeholder="Link"
                      className={`${inputClass} mt-0`}
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(ci, li)}
                      className="mono-label shrink-0 rounded border border-border px-2 py-1.5 text-[color:var(--app-destructive)]"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addLink(ci)}
                  className="btn-base btn-outline text-xs"
                >
                  + Add link
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-success">Saved. The footer will update on the next page load.</p> : null}
      <button type="submit" disabled={saving} className="btn-base btn-primary">
        {saving ? "Saving…" : "Save footer"}
      </button>
    </form>
  );
}
