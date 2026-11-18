import { generateText, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { estimateTokens, type AiPhase, type AiRunInfo, type AiStreamEvent } from "@/lib/ai/progress";

/** Minimal duck-typed schema shape — matches zod's `safeParse` without depending on zod's (invariant) generic types. */
type ParsableSchema<T> = {
  safeParse(data: unknown): { success: true; data: T } | { success: false };
};

/**
 * Content generation runs against any OpenAI-compatible endpoint. Default is local Ollama; set
 * AI_CONTENT_BASE_URL + AI_CONTENT_API_KEY + AI_CONTENT_MODEL to use a hosted model instead (e.g.
 * Gemini's OpenAI-compatible endpoint https://generativelanguage.googleapis.com/v1beta/openai/ or
 * OpenAI) — recommended for whole-page generation, where a stronger model writes noticeably better.
 */
const BASE_URL = process.env.AI_CONTENT_BASE_URL ?? process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
const MODEL = process.env.AI_CONTENT_MODEL ?? process.env.OLLAMA_CONTENT_MODEL ?? "qwen2.5:14b-instruct";
const API_KEY = process.env.AI_CONTENT_API_KEY ?? "ollama";
const IS_HOSTED = Boolean(process.env.AI_CONTENT_BASE_URL);
/** A 14B-class model can take well over 45s to load into memory on a cold start (Ollama unloads
 *  idle models after its `keep_alive` window). Generation itself is fast once loaded, so the
 *  timeout needs to cover a worst-case cold load, not just inference time. */
const TIMEOUT_MS = 120_000;
/** Long outputs need longer than the base timeout: allow ~50ms per requested token (≈20 tok/s). */
function timeoutFor(maxOutputTokens: number): number {
  return Math.max(TIMEOUT_MS, maxOutputTokens * 50);
}

/** Ollama unreachable — server down, wrong port, etc. */
export class AiUnavailableError extends Error {}
/** Ollama reachable but the response couldn't be turned into usable content. */
export class AiGenerationError extends Error {}

function chatModel() {
  return createOpenAI({ baseURL: BASE_URL, apiKey: API_KEY }).chat(MODEL);
}

/** Chat models often wrap output in a markdown fence (```html … ```) even when told not to —
 *  left in, the fence would be saved into the field as literal text. */
export function stripCodeFence(text: string): string {
  const match = text.trim().match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n?```$/);
  return (match ? match[1] : text).trim();
}

function isConnectionError(err: unknown): boolean {
  const cause = (err as { cause?: { code?: string } } | undefined)?.cause;
  return cause?.code === "ECONNREFUSED" || cause?.code === "ENOTFOUND" || cause?.code === "ETIMEDOUT";
}

/** `AbortSignal.timeout()` fires a `DOMException` named "TimeoutError" — distinct from a refused
 *  connection, since Ollama is reachable but just hasn't responded yet (usually a cold model load). */
function isTimeoutError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "TimeoutError";
}

function isModelNotFoundError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /model.*not found|404/i.test(message);
}

/** Which model/endpoint is answering — shown in the admin progress panel. Never includes the key. */
export function contentModelInfo(): Pick<AiRunInfo, "model" | "provider" | "host"> {
  let host = BASE_URL;
  try {
    host = new URL(BASE_URL).host;
  } catch {
    /* keep the raw value */
  }
  return { model: MODEL, provider: IS_HOSTED ? "hosted" : "local", host };
}

/** Options shared by every generation call that reports live progress. */
export type AiProgressOptions = {
  /** When set, generation streams and reports events through this callback. */
  onEvent?: (event: AiStreamEvent) => void;
  /** Aborts generation (e.g. the admin closed the dialog) so no more tokens are spent. */
  signal?: AbortSignal;
  /** Tokens already produced by an earlier pass of the same request (repair / optimise passes). */
  tokenOffset?: number;
  /** Phase reported once tokens start flowing. Defaults to "writing". */
  phase?: AiPhase;
};

/** Minimum gap between `delta` events — keeps the stream light without making the bar feel stuck. */
const DELTA_INTERVAL_MS = 200;

/** Plain-text generation against the configured content model. Streams when `onEvent` is given. */
export async function generateFieldContent(
  params: {
    system: string;
    prompt: string;
    maxOutputTokens?: number;
  } & AiProgressOptions,
): Promise<string> {
  const maxOutputTokens = params.maxOutputTokens ?? 700;
  const abortSignal = AbortSignal.any([
    AbortSignal.timeout(timeoutFor(maxOutputTokens)),
    ...(params.signal ? [params.signal] : []),
  ]);
  try {
    if (!params.onEvent) {
      const { text } = await generateText({
        model: chatModel(),
        system: params.system,
        prompt: params.prompt,
        maxOutputTokens,
        abortSignal,
      });
      return stripCodeFence(text);
    }

    const emit = params.onEvent;
    const offset = params.tokenOffset ?? 0;
    const startedAt = Date.now();
    const result = streamText({
      model: chatModel(),
      system: params.system,
      prompt: params.prompt,
      maxOutputTokens,
      abortSignal,
    });

    let text = "";
    let lastEmit = 0;
    let wrote = false;
    for await (const part of result.fullStream) {
      if (part.type === "error") throw part.error;
      if (part.type !== "text-delta") continue;
      if (!wrote) {
        wrote = true;
        emit({ type: "phase", phase: params.phase ?? "writing" });
      }
      text += part.text;
      const now = Date.now();
      if (now - lastEmit >= DELTA_INTERVAL_MS) {
        lastEmit = now;
        emit({ type: "delta", outputTokens: offset + estimateTokens(text), elapsedMs: now - startedAt });
      }
    }
    emit({ type: "delta", outputTokens: offset + estimateTokens(text), elapsedMs: Date.now() - startedAt });

    // Real token counts, when the provider reports them (Ollama and hosted APIs both usually do).
    const usage = await Promise.resolve(result.usage).catch(() => undefined);
    if (usage?.outputTokens) {
      emit({
        type: "usage",
        usage: { inputTokens: usage.inputTokens, outputTokens: offset + usage.outputTokens },
      });
    }
    return stripCodeFence(text);
  } catch (err) {
    if (params.signal?.aborted) throw new AiGenerationError("Generation cancelled.");
    if (isModelNotFoundError(err)) {
      throw new AiGenerationError(
        IS_HOSTED
          ? `Model "${MODEL}" was not found at ${BASE_URL}. Check AI_CONTENT_MODEL.`
          : `Model "${MODEL}" is not pulled. Run \`ollama pull ${MODEL}\` and try again.`,
      );
    }
    if (isTimeoutError(err)) {
      throw new AiUnavailableError(
        "AI took too long to respond — the model may still be loading into memory after being idle. Try again in a moment.",
      );
    }
    if (isConnectionError(err)) {
      throw new AiUnavailableError(
        IS_HOSTED
          ? "AI is unavailable — could not reach " + BASE_URL
          : "AI is unavailable — make sure Ollama is running (`ollama serve`) on " + BASE_URL,
      );
    }
    throw new AiGenerationError(err instanceof Error ? err.message : "Generation failed.");
  }
}

function extractJsonObject(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/);
  const candidate = match ? match[0] : raw;
  return JSON.parse(candidate);
}

/**
 * Structured generation via plain-text JSON prompting + manual parse/validate.
 * Ollama's JSON mode only guarantees syntactically valid JSON, not schema conformance,
 * so `generateObject`'s strict validation would throw on exactly the failures we need
 * to survive. One repair round-trip covers the common "prose before the brace" slip.
 */
export async function generateFieldObject<T>(
  params: {
    system: string;
    prompt: string;
    schema: ParsableSchema<T>;
    maxOutputTokens?: number;
    /** Description of the expected JSON shape, so the repair pass can fix wrong keys, not just syntax. */
    shapeHint?: string;
  } & AiProgressOptions,
): Promise<T> {
  const system = `${params.system}\nRespond with ONLY a single valid JSON object. No markdown, no commentary, no code fences.`;
  let producedTokens = 0;
  // Track the cumulative count so the repair pass continues the bar instead of resetting it.
  const track: AiProgressOptions["onEvent"] = params.onEvent
    ? (e) => {
        if (e.type === "delta" || e.type === "usage") {
          producedTokens = Math.max(producedTokens, e.type === "delta" ? e.outputTokens : e.usage.outputTokens);
        }
        params.onEvent?.(e);
      }
    : undefined;
  const raw = await generateFieldContent({
    system,
    prompt: params.prompt,
    maxOutputTokens: params.maxOutputTokens,
    onEvent: track,
    signal: params.signal,
    tokenOffset: params.tokenOffset,
    phase: params.phase,
  });

  const attempt = (text: string) => {
    try {
      return params.schema.safeParse(extractJsonObject(text));
    } catch {
      return null;
    }
  };

  let result = attempt(raw);
  if (!result || !result.success) {
    params.onEvent?.({ type: "phase", phase: "repairing" });
    const repaired = await generateFieldContent({
      onEvent: track,
      signal: params.signal,
      tokenOffset: producedTokens,
      phase: "repairing",
      system: "You fix malformed JSON. Respond with ONLY the corrected, valid JSON object.",
      prompt: `This JSON is malformed or has the wrong shape. Fix it and return ONLY valid JSON${
        params.shapeHint ? ` matching this spec — ${params.shapeHint}` : ""
      }:\n${raw}`,
      maxOutputTokens: params.maxOutputTokens,
    });
    result = attempt(repaired);
  }

  if (!result || !result.success) {
    throw new AiGenerationError("The AI returned an unexpected response. Try again.");
  }
  return result.data;
}
