"use client";

import { useState } from "react";
import type { RedirectDto } from "@/lib/redirects";
import { ADMIN_INPUT_CLASS as inputClass } from "@/components/admin/form-styles";
import { useAdminMutation } from "@/hooks/useAdminMutation";

export function RedirectsClient({ initialRedirects }: { initialRedirects: RedirectDto[] }) {
  const [redirects, setRedirects] = useState<RedirectDto[]>(initialRedirects);
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [type, setType] = useState<RedirectDto["type"]>("PERMANENT_301");
  const { saving, error, run } = useAdminMutation();

  const add = async () => {
    const data = await run<RedirectDto>(
      () =>
        fetch("/api/admin/redirects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromPath, toPath, type }),
        }),
      "Failed to add redirect",
    );
    if (!data) return;
    setRedirects((prev) => [data, ...prev]);
    setFromPath("");
    setToPath("");
  };

  const toggleActive = async (r: RedirectDto) => {
    setRedirects((prev) => prev.map((x) => (x.id === r.id ? { ...x, isActive: !x.isActive } : x)));
    await fetch(`/api/admin/redirects/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !r.isActive }),
    });
  };

  const remove = async (id: string) => {
    setRedirects((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/admin/redirects/${id}`, { method: "DELETE" });
  };

  return (
    <div className="mt-6 space-y-6">
      <section className="card-flat space-y-4">
        <h2 className="font-display text-base font-semibold text-foreground">Add a redirect</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-foreground/90">From path</label>
            <input type="text" value={fromPath} onChange={(e) => setFromPath(e.target.value)} placeholder="/old-page" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90">To path</label>
            <input type="text" value={toPath} onChange={(e) => setToPath(e.target.value)} placeholder="/new-page" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as RedirectDto["type"])} className={inputClass}>
              <option value="PERMANENT_301">301 (permanent)</option>
              <option value="TEMPORARY_302">302 (temporary)</option>
            </select>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button type="button" disabled={saving || !fromPath || !toPath} onClick={add} className="btn-base btn-primary">
          {saving ? "Adding…" : "Add redirect"}
        </button>
      </section>

      <section className="card-flat space-y-3">
        <h2 className="display-sm text-foreground">Rules</h2>
        {redirects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No redirects yet.</p>
        ) : (
          <div className="space-y-2">
            {redirects.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 bg-background/60 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {r.fromPath} <span className="text-muted-foreground">→</span> {r.toPath}
                  </p>
                  <p className="mono-label text-muted-foreground">
                    {r.type === "PERMANENT_301" ? "301" : "302"} · {r.isActive ? "ACTIVE" : "DISABLED"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => toggleActive(r)} className="btn-base btn-secondary !px-2 !py-1 text-xs">
                    {r.isActive ? "Disable" : "Enable"}
                  </button>
                  <button type="button" onClick={() => remove(r.id)} className="btn-base btn-secondary !px-2 !py-1 text-xs text-destructive">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
