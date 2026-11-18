"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useAiGenerate } from "@/lib/ai/useAiGenerate";
import { TASK_LABELS, TASK_FIELDS, TARGET_WORDS_LABEL, SOURCES_LABEL, type TaskName } from "@/lib/ai/tasks";
import { Spinner } from "@/components/Spinner";
import { AiProgressPanel } from "@/components/admin/AiProgressPanel";

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
  /** Click-to-add snippets under a textarea. Each adds one line; clicking again removes it. */
  suggestions?: string[];
};

/** Common exclusions, shared by every task with an "Avoid" box. */
export const AVOID_SUGGESTIONS = [
  "No pricing or cost figures",
  "Don't mention competitors",
  "No statistics or percentages",
  "No claims about certifications or awards",
  "No guarantees or promises",
  "No client names",
  "No buzzwords or hype",
];

/** Starter lines for "Facts you may use" — each ends in a colon for the editor to complete. */
export const FACT_SUGGESTIONS = [
  "Based in: ",
  "Services offered: ",
  "Our process: ",
  "Tools and technologies: ",
  "Team size and experience: ",
  "Industries served: ",
  "Typical project timeline: ",
  "Proof points (real projects, results): ",
];

/** True when the line is already in the value. A "Label:" starter counts once the editor has typed after it. */
export function hasSuggestion(value: string, line: string): boolean {
  const want = line.trim();
  return value.split("\n").some((l) => (want.endsWith(":") ? l.trim().startsWith(want) : l.trim() === want));
}

/** Adds `line` on its own line, or removes it when it is a plain line already present. A "Label:"
 *  starter is never removed (the editor may have filled it in) and never duplicated. */
export function toggleSuggestion(value: string, line: string): string {
  const lines = value.split("\n");
  if (line.trim().endsWith(":")) return hasSuggestion(value, line) ? value : addLine(value, line);
  const at = lines.findIndex((l) => l.trim() === line.trim());
  if (at >= 0) return lines.filter((_, i) => i !== at).join("\n");
  return addLine(value, line);
}

function addLine(value: string, line: string): string {
  return value.trim() ? `${value.replace(/\s+$/, "")}\n${line}` : line;
}

/** Keyword / length / avoid controls for the `longFormBody` task. */
export function longFormExtraFields({
  primaryKeyword = "",
  secondaryKeywords = "",
  paragraphs = "4",
  words = "500",
}: {
  primaryKeyword?: string;
  secondaryKeywords?: string;
  paragraphs?: string;
  words?: string;
}): ExtraField[] {
  return [
    {
      key: "primaryKeyword",
      label: "Primary keyword",
      type: "text",
      defaultValue: primaryKeyword,
      placeholder: "e.g. CRM development",
    },
    {
      key: "secondaryKeywords",
      label: "Secondary keywords",
      type: "text",
      defaultValue: secondaryKeywords,
      placeholder: "comma-separated",
    },
    { key: "paragraphCount", label: "Paragraphs", type: "number", defaultValue: paragraphs },
    {
      key: "targetWords",
      label: TARGET_WORDS_LABEL,
      type: "number",
      defaultValue: words,
      helpText: "Up to about 3,000 words. Longer pieces take a few minutes on a local model.",
    },
    {
      key: "avoid",
      label: "Avoid",
      type: "textarea",
      placeholder: "e.g. don't mention pricing, avoid buzzwords like \"revolutionary\", no fabricated stats",
      suggestions: AVOID_SUGGESTIONS,
    },
  ];
}

/** Targeting controls for the `fullPage` task. The keyword and audience are part of the brief
 *  itself (from the editor's context); these add length, ground-truth facts and exclusions. */
export function fullPageExtraFields({ words = "1400" }: { words?: string } = {}): ExtraField[] {
  return [
    {
      key: "targetWords",
      label: TARGET_WORDS_LABEL,
      type: "number",
      defaultValue: words,
      helpText: "Total across sections and FAQs. 1,200–1,800 suits a service or hub page.",
    },
    {
      key: "facts",
      label: "Facts you may use",
      type: "textarea",
      placeholder:
        "Ground truth only: where you're based, services offered, process steps, tools, team size, real proof points. The AI won't invent anything beyond this.",
      helpText: "The more real detail you give, the more specific (and citable) the page becomes.",
      suggestions: FACT_SUGGESTIONS,
    },
    {
      key: "avoid",
      label: "Avoid",
      type: "textarea",
      placeholder: "e.g. no pricing, don't mention competitors, no claims about certifications",
      suggestions: AVOID_SUGGESTIONS,
    },
    // Keep this LAST: the server reads every URL after this label as the allowed source list.
    {
      key: "sources",
      label: SOURCES_LABEL,
      type: "textarea",
      placeholder: "One per line, e.g. https://developers.google.com/search/docs/…",
      helpText:
        "Optional. Relevant official sources are picked automatically; list your own here to add to them. The AI only cites URLs from these lists, never ones it invents.",
    },
  ];
}

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
  const { run, previewBrief, cancel, loading, previewLoading, error, setError, progress } = useAiGenerate();
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
            className={`flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl ${
              extraFields?.length ? "max-w-2xl" : "max-w-lg"
            }`}
          >
            <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
            <DialogTitle className="font-display text-lg font-semibold">
              {TASK_LABELS[task] ?? "Generate with AI"}
            </DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {fields?.length
                ? `This will fill in: ${fields.join(", ")}. Optimized for SEO — feel free to add your own details below.`
                : "Optimized for SEO — feel free to add your own details below."}
            </p>

            {loading ? <AiProgressPanel progress={progress} /> : null}

            {!loading && extraFields?.length ? (
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
                    {f.suggestions?.length ? (
                      <span className="mt-2 flex flex-wrap gap-1.5" aria-label={`${f.label} suggestions`}>
                        {f.suggestions.map((line) => {
                          const active = hasSuggestion(extraValues[f.key] ?? "", line);
                          return (
                            <button
                              key={line}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                setExtraValues((prev) => ({ ...prev, [f.key]: toggleSuggestion(prev[f.key] ?? "", line) }))
                              }
                              className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                                active
                                  ? "border-primary/40 bg-primary/10 text-foreground"
                                  : "border-border bg-background text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {active ? "✓ " : "+ "}
                              {line.replace(/:\s*$/, "")}
                            </button>
                          );
                        })}
                      </span>
                    ) : null}
                    {f.helpText ? (
                      <span className="mt-1 block text-[12px] text-muted-foreground">{f.helpText}</span>
                    ) : null}
                  </label>
                ))}
              </div>
            ) : null}

            <div className={loading ? "hidden" : "mt-4"}>
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
            </div>

            <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-border/60 pt-4">
              <button
                type="button"
                onClick={loading ? cancel : close}
                className="btn-base btn-outline"
              >
                {loading ? "Stop" : "Cancel"}
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
