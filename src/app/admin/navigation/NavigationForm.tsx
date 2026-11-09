"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NavLink } from "@/lib/nav-content";
import { ADMIN_INPUT_CLASS as inputClass } from "@/components/admin/form-styles";

function reorder<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function NavigationForm({ initialLinks }: { initialLinks: NavLink[] }) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const updateLink = (index: number, patch: Partial<NavLink>) => {
    setSuccess(false);
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const save = async () => {
    setError("");
    setSuccess(false);
    setSaving(true);
    const res = await fetch("/api/admin/content/navigation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links }),
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
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="mt-8 max-w-2xl space-y-6">
      <section className="card-flat space-y-4">
        <h2 className="font-display text-base font-semibold text-foreground">Primary navigation</h2>
        <p className="text-sm text-muted-foreground">
          Shown in the top nav on every marketing page.
        </p>
        <div className="space-y-4">
          {links.map((link, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="mono-label text-muted-foreground">LINK {i + 1}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => setLinks(reorder(links, i, i - 1))}
                    className="mono-label rounded border border-border px-2 py-1 text-muted-foreground disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === links.length - 1}
                    onClick={() => setLinks(reorder(links, i, i + 1))}
                    className="mono-label rounded border border-border px-2 py-1 text-muted-foreground disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <label className="mono-label flex items-center gap-1.5 text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={link.openInNewTab}
                      onChange={(e) => updateLink(i, { openInNewTab: e.target.checked })}
                    />
                    NEW TAB
                  </label>
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, j) => j !== i))}
                    className="mono-label rounded border border-border px-2 py-1 text-[color:var(--app-destructive)]"
                  >
                    REMOVE
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground/90">Label</label>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(i, { label: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/90">Link</label>
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => updateLink(i, { href: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLinks([...links, { label: "New link", href: "/", openInNewTab: false }])}
            className="btn-base btn-outline text-sm"
          >
            + Add link
          </button>
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-success">Saved. The nav will update on the next page load.</p> : null}
      <button type="submit" disabled={saving} className="btn-base btn-primary">
        {saving ? "Saving…" : "Save navigation"}
      </button>
    </form>
  );
}
