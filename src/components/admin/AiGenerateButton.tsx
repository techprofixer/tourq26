"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useAiGenerate } from "@/lib/ai/useAiGenerate";
import { TASK_LABELS, TASK_FIELDS, type TaskName } from "@/lib/ai/tasks";
import { Spinner } from "@/components/Spinner";

type Variant = "secondary" | "inline" | "outline";

const VARIANT_CLASS: Record<Variant, string> = {
  secondary: "btn-base btn-secondary",
  inline: "btn-base btn-secondary !px-2 !py-1 text-xs",
  outline: "btn-base btn-outline",
};

/** An extra structured control shown above the free-text brief — its value is appended to the
 *  brief as `${label}: ${value}` before generation, so it reads as a normal, editable instruction
 *  rather than a hidden parameter. */
export type ExtraField = {
  key: string;
  label: string;
  type: "text" | "number" | "textarea";
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
};

function formatExtraFields(fields: ExtraField[], values: Record<string, string>): string {
  return fields
    .map((f) => {
      const value = (values[f.key] ?? "").trim();
      if (!value) return "";
      return `${f.label}: ${value}`;
    })
    .filter(Boolean)
    .join("\n");
}

export function AiGenerateButton<T = string | Record<string, unknown>>({
  task,
  context,
  onResult,
  label = "Generate with AI",
  variant = "secondary",
  disabled,
  className,
  extraFields,
}: {
  task: TaskName;
  context: Record<string, unknown>;
  onResult: (result: T) => void;
  label?: string;
  variant?: Variant;
  disabled?: boolean;
  className?: string;
  /** Optional structured controls (keyword targeting, length, things to avoid, etc.) rendered
   *  above the brief textarea. Folded into the brief text at generation time. */
  extraFields?: ExtraField[];
}) {
  const { run, previewBrief, loading, previewLoading, error, setError } = useAiGenerate();
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});

  const openModal = async () => {
    setError("");
    setOpen(true);
    setExtraValues(
      Object.fromEntries((extraFields ?? []).map((f) => [f.key, f.defaultValue ?? ""])),
    );
    setBrief(await previewBrief(task, context));
  };

  const close = () => {
    if (loading) return;
    setOpen(false);
  };

  const generate = async () => {
    const extra = extraFields?.length ? formatExtraFields(extraFields, extraValues) : "";
    const fullBrief = extra ? `${brief}\n\n${extra}` : brief;
    const result = await run<T>(task, context, fullBrief);
    if (result !== null) {
      onResult(result);
      setOpen(false);
    }
  };

  const fields = TASK_FIELDS[task];

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={openModal}
        className={`${VARIANT_CLASS[variant]} ${className ?? ""}`}
      >
        {label}
      </button>

      <Dialog open={open} onClose={close} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            className={`w-full rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl ${
              extraFields?.length ? "max-w-2xl" : "max-w-lg"
            }`}
          >
            <DialogTitle className="font-display text-lg font-semibold">
              {TASK_LABELS[task] ?? "Generate with AI"}
            </DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {fields?.length
                ? `This will fill in: ${fields.join(", ")}. Optimized for SEO — feel free to add your own details below.`
                : "Optimized for SEO — feel free to add your own details below."}
            </p>

            {extraFields?.length ? (
              <div className="mt-4 grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-3.5 sm:grid-cols-2">
                {extraFields.map((f) => (
                  <label
                    key={f.key}
                    className={`block text-sm ${f.type === "textarea" ? "sm:col-span-2" : ""}`}
                  >
                    <span className="mono-label text-muted-foreground">{f.label}</span>
                    {f.type === "textarea" ? (
                      <textarea
                        value={extraValues[f.key] ?? ""}
                        onChange={(e) => setExtraValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        disabled={loading}
                        rows={2}
                        placeholder={f.placeholder}
                        className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    ) : (
                      <input
                        type={f.type === "number" ? "number" : "text"}
                        value={extraValues[f.key] ?? ""}
                        onChange={(e) => setExtraValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        disabled={loading}
                        placeholder={f.placeholder}
                        className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    )}
                    {f.helpText ? (
                      <span className="mt-1 block text-[12px] text-muted-foreground">{f.helpText}</span>
                    ) : null}
                  </label>
                ))}
              </div>
            ) : null}

            <div className="mt-4">
              <label className="mono-label text-muted-foreground">What should the AI write about?</label>
              <textarea
                value={previewLoading ? "Loading…" : brief}
                onChange={(e) => setBrief(e.target.value)}
                disabled={previewLoading || loading}
                rows={6}
                placeholder="Add extra details, tone, or specifics the AI should use…"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:text-muted-foreground"
              />
              <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                Pre-filled from this form&apos;s fields. Edit it however you like, then generate.
              </p>
            </div>

            {error ? (
              <p className="mt-2 text-[13px] text-[color:var(--app-destructive)]">{error}</p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={close} disabled={loading} className="btn-base btn-outline">
                Cancel
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={previewLoading || loading || !brief.trim()}
                className="btn-base btn-primary"
              >
                {loading ? <Spinner className="h-4 w-4" /> : null}
                {loading ? "Generating…" : "Generate"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
