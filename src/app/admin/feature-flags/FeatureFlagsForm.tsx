"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeatureFlagDefinition, FeatureFlagKey } from "@/lib/feature-flags-schema";
import { Spinner } from "@/components/Spinner";

type Catalog = FeatureFlagDefinition[];

export function FeatureFlagsForm() {
  const [catalog, setCatalog] = useState<Catalog>([]);
  const [values, setValues] = useState<Record<FeatureFlagKey, boolean> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/feature-flags");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Load failed");
      setCatalog(data.catalog ?? []);
      setValues(data.resolved ?? null);
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Load failed" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byCategory = useMemo(() => {
    const m = new Map<string, FeatureFlagDefinition[]>();
    for (const d of catalog) {
      const list = m.get(d.category) ?? [];
      list.push(d);
      m.set(d.category, list);
    }
    return m;
  }, [catalog]);

  async function save() {
    if (!values) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      setValues(data.resolved ?? values);
      setMessage({ type: "ok", text: "Saved. Edge behaviour updates on the next request (KV) or immediately (local file)." });
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !values) {
    return (
      <p className="flex items-center gap-2 text-muted-foreground">
        <Spinner className="h-4 w-4" /> Loading flags…
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Deploy-time overrides (when set) beat the toggles below — see each flag&apos;s env variable in the
        description. Use <code className="text-primary/90">MAINTENANCE_MODE=true</code> for an instant
        break-glass. With <strong>Vercel KV</strong>, marketing route gates also run at the edge; with local
        files only, page-level checks still apply.
      </p>
      {message && (
        <p className={message.type === "ok" ? "text-sm text-success" : "text-sm text-destructive"}>
          {message.text}
        </p>
      )}
      {Array.from(byCategory.entries()).map(([category, defs]) => (
        <section key={category}>
          <h2 className="text-lg font-semibold text-foreground">{category}</h2>
          <ul className="mt-4 space-y-4">
            {defs.map((def) => (
              <li
                key={def.key}
                className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/30 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 pr-4">
                  <p className="font-medium text-foreground">{def.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{def.description}</p>
                  {def.envOverride && (
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      Env override: {def.envOverride}
                    </p>
                  )}
                </div>
                <label className="flex shrink-0 cursor-pointer items-center gap-3 sm:flex-col sm:items-end">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {values[def.key] ? "On" : "Off"}
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-10 cursor-pointer accent-primary"
                    checked={values[def.key]}
                    onChange={(e) =>
                      setValues((prev) =>
                        prev ? { ...prev, [def.key]: e.target.checked } : prev,
                      )
                    }
                  />
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => save()}
          className="btn-base btn-primary text-[12px]"
        >
          {saving ? <Spinner className="h-4 w-4" /> : null}
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => load()}
          className="btn-base btn-outline text-[12px]"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
