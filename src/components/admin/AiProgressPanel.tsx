"use client";

import { formatDuration, viewProgress, type AiPhase, type AiProgress } from "@/lib/ai/progress";

const STEPS: { phase: AiPhase; label: string }[] = [
  { phase: "connecting", label: "Connect" },
  { phase: "writing", label: "Write" },
  { phase: "optimizing", label: "SEO check" },
  { phase: "finalizing", label: "Finish" },
];

const PHASE_LABEL: Record<AiPhase, string> = {
  connecting: "Starting the model…",
  writing: "Writing",
  repairing: "Fixing the format",
  optimizing: "Optimising for SEO",
  finalizing: "Finishing up",
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/60 bg-background px-3 py-2">
      <dt className="mono-label text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-[14px] font-medium tabular-nums text-foreground" title={value}>
        {value}
      </dd>
      {hint ? <p className="truncate text-[11.5px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Live status for a running AI generation: bar, model, tokens, speed, elapsed and time left. */
export function AiProgressPanel({ progress }: { progress: AiProgress }) {
  const { info, phase, outputTokens, inputTokens, exact, elapsedMs } = progress;
  const view = viewProgress(progress);
  const waiting = phase === "connecting" || (phase === "writing" && outputTokens === 0);
  // "repairing" is a second writing pass; show it on the Write step.
  const activeStep = phase === "repairing" ? "writing" : phase;
  const activeIndex = STEPS.findIndex((s) => s.phase === activeStep);
  const percent = Math.round(view.fraction * 100);

  const tokenValue = info
    ? `${outputTokens.toLocaleString()} / ~${info.expectedOutputTokens.toLocaleString()}`
    : outputTokens.toLocaleString();

  let remaining = "Estimating…";
  if (phase === "finalizing") remaining = "Almost done";
  else if (view.overrun) remaining = "Finishing up";
  else if (view.remainingMs !== null) remaining = `~${formatDuration(view.remainingMs)}`;
  else if (waiting) remaining = "Loading model…";

  return (
    <div
      className="mt-4 rounded-xl border border-border bg-muted/20 p-4"
      role="status"
      aria-live="polite"
      aria-label="AI generation progress"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[14px] font-medium text-foreground">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--app-primary)] opacity-40 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--app-primary)]" />
          </span>
          {PHASE_LABEL[phase]}
          {progress.detail ? (
            <span className="font-normal text-muted-foreground">· {progress.detail}</span>
          ) : null}
        </p>
        <p className="font-mono text-[12.5px] tabular-nums text-muted-foreground">
          {waiting ? "" : `~${percent}% · `}
          {formatDuration(elapsedMs)}
        </p>
      </div>

      <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-border/60"
        role="progressbar"
        aria-label="Generation progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={waiting ? undefined : percent}
        aria-valuetext={waiting ? "Starting" : `About ${percent} percent`}
      >
        <div
          className={`h-full rounded-full bg-[color:var(--app-primary)] transition-[width] duration-300 ease-out ${
            waiting ? "w-1/3 animate-pulse motion-reduce:animate-none" : ""
          }`}
          style={waiting ? undefined : { width: `${Math.max(2, percent)}%` }}
        />
      </div>

      <ol className="mt-3 flex items-center gap-2 text-[12px]" aria-label="Stages">
        {STEPS.map((step, i) => {
          const done = i < activeIndex;
          const current = i === activeIndex;
          return (
            <li key={step.phase} className="flex items-center gap-2">
              <span
                className={`inline-flex h-5 items-center rounded-full border px-2 ${
                  current
                    ? "border-[color:var(--app-primary)] text-foreground"
                    : done
                      ? "border-transparent bg-[color:var(--app-primary-muted)] text-foreground"
                      : "border-border text-muted-foreground"
                }`}
                aria-current={current ? "step" : undefined}
              >
                {done ? "✓ " : ""}
                {step.label}
              </span>
              {i < STEPS.length - 1 ? <span className="h-px w-4 bg-border" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>

      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat
          label="Model"
          value={info?.model ?? "Connecting…"}
          hint={info ? `${info.provider === "hosted" ? "Hosted" : "Local"} · ${info.host}` : undefined}
        />
        <Stat
          label="Tokens written"
          value={tokenValue}
          hint={exact ? "Reported by the model" : "Estimated"}
        />
        <Stat
          label="Speed"
          value={view.tokensPerSecond ? `${view.tokensPerSecond.toFixed(1)} tok/s` : "—"}
          hint={inputTokens ? `${inputTokens.toLocaleString()} prompt tokens` : undefined}
        />
        <Stat label="Elapsed" value={formatDuration(elapsedMs)} />
        <Stat label="Time left" value={remaining} hint="Estimate" />
        <Stat
          label="Token limit"
          value={info ? info.maxOutputTokens.toLocaleString() : "—"}
          hint="Hard cap for this task"
        />
      </dl>

      {waiting && elapsedMs > 20_000 && info?.provider === "local" ? (
        <p className="mt-3 text-[12.5px] text-muted-foreground">
          Still loading the model into memory — the first run after idle is the slowest.
        </p>
      ) : null}
    </div>
  );
}
