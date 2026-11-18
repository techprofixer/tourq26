/**
 * Live-progress protocol for AI generation. The API route streams these as newline-delimited JSON
 * (one event per line); the `useAiGenerate` hook folds them into `AiProgress` for the UI.
 * Client-safe: no server imports.
 */

export type AiRunInfo = {
  /** Model id actually answering (e.g. "qwen2.5:14b-instruct"). */
  model: string;
  /** "local" = Ollama on this machine; "hosted" = an AI_CONTENT_BASE_URL endpoint. */
  provider: "local" | "hosted";
  /** Host only (no path / key), e.g. "localhost:11434". */
  host: string;
  /** Hard cap sent to the model. */
  maxOutputTokens: number;
  /** Best guess of how many tokens this task will really use — drives the bar and the ETA. */
  expectedOutputTokens: number;
};

export type AiPhase = "connecting" | "writing" | "repairing" | "optimizing" | "finalizing";

export type AiUsage = { inputTokens?: number; outputTokens: number };

export type AiStreamEvent =
  | ({ type: "start" } & AiRunInfo)
  /** `expectedOutputTokens`, when present, replaces the run's estimate (a second pass adds length). */
  | { type: "phase"; phase: AiPhase; expectedOutputTokens?: number; detail?: string }
  | { type: "delta"; outputTokens: number; elapsedMs: number }
  | { type: "usage"; usage: AiUsage }
  | { type: "result"; result: unknown; usage: AiUsage; elapsedMs: number }
  | { type: "error"; error: string; status: number };

/** Folded state the progress panel renders. */
export type AiProgress = {
  info: AiRunInfo | null;
  phase: AiPhase;
  /** Short human note for the current phase (e.g. the SEO checks being fixed). */
  detail?: string;
  /** Output tokens so far (estimated from text until the provider reports real usage). */
  outputTokens: number;
  inputTokens?: number;
  /** True once `outputTokens` came from the provider's own usage report, not an estimate. */
  exact: boolean;
  /** Wall-clock ms since the request was sent (client side, so it includes model load time). */
  elapsedMs: number;
  /** ms when the first token arrived, for an honest tokens/sec that excludes cold-start load. */
  firstTokenAtMs: number | null;
};

export const INITIAL_PROGRESS: AiProgress = {
  info: null,
  phase: "connecting",
  outputTokens: 0,
  exact: false,
  elapsedMs: 0,
  firstTokenAtMs: null,
};

/** ~4 characters per token is the usual rule of thumb for English prose and HTML. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export type ProgressView = {
  /** 0–1. Never reaches 1 until the result lands, so the bar can't claim "done" early. */
  fraction: number;
  tokensPerSecond: number | null;
  /** Estimated ms left, or null while unknown / when generation is running past the estimate. */
  remainingMs: number | null;
  /** Past the expected length — the model is just finishing up. */
  overrun: boolean;
};

export function viewProgress(p: AiProgress): ProgressView {
  const expected = p.info?.expectedOutputTokens ?? 0;
  const writingMs = p.firstTokenAtMs === null ? 0 : Math.max(1, p.elapsedMs - p.firstTokenAtMs);
  const tokensPerSecond =
    p.firstTokenAtMs !== null && p.outputTokens >= 8 ? p.outputTokens / (writingMs / 1000) : null;

  if (!expected) return { fraction: 0, tokensPerSecond, remainingMs: null, overrun: false };

  const overrun = p.outputTokens >= expected;
  const fraction = Math.min(0.97, p.outputTokens / expected);
  const remainingMs =
    !overrun && tokensPerSecond ? Math.round(((expected - p.outputTokens) / tokensPerSecond) * 1000) : null;
  return { fraction, tokensPerSecond, remainingMs, overrun };
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}
