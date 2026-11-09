import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

/** Minimal duck-typed schema shape — matches zod's `safeParse` without depending on zod's (invariant) generic types. */
type ParsableSchema<T> = {
  safeParse(data: unknown): { success: true; data: T } | { success: false };
};

const BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
const MODEL = process.env.OLLAMA_CONTENT_MODEL ?? "qwen2.5:14b-instruct";
/** A 14B-class model can take well over 45s to load into memory on a cold start (Ollama unloads
 *  idle models after its `keep_alive` window). Generation itself is fast once loaded, so the
 *  timeout needs to cover a worst-case cold load, not just inference time. */
const TIMEOUT_MS = 120_000;

/** Ollama unreachable — server down, wrong port, etc. */
export class AiUnavailableError extends Error {}
/** Ollama reachable but the response couldn't be turned into usable content. */
export class AiGenerationError extends Error {}

function chatModel() {
  return createOpenAI({ baseURL: BASE_URL, apiKey: "ollama" }).chat(MODEL);
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

/** Plain-text generation against the local Ollama content model. */
export async function generateFieldContent(params: {
  system: string;
  prompt: string;
  maxOutputTokens?: number;
}): Promise<string> {
  try {
    const { text } = await generateText({
      model: chatModel(),
      system: params.system,
      prompt: params.prompt,
      maxOutputTokens: params.maxOutputTokens ?? 700,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return text.trim();
  } catch (err) {
    if (isModelNotFoundError(err)) {
      throw new AiGenerationError(
        `Model "${MODEL}" is not pulled. Run \`ollama pull ${MODEL}\` and try again.`,
      );
    }
    if (isTimeoutError(err)) {
      throw new AiUnavailableError(
        "AI took too long to respond — the model may still be loading into memory after being idle. Try again in a moment.",
      );
    }
    if (isConnectionError(err)) {
      throw new AiUnavailableError(
        "AI is unavailable — make sure Ollama is running (`ollama serve`) on " + BASE_URL,
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
export async function generateFieldObject<T>(params: {
  system: string;
  prompt: string;
  schema: ParsableSchema<T>;
  maxOutputTokens?: number;
}): Promise<T> {
  const system = `${params.system}\nRespond with ONLY a single valid JSON object. No markdown, no commentary, no code fences.`;
  const raw = await generateFieldContent({
    system,
    prompt: params.prompt,
    maxOutputTokens: params.maxOutputTokens,
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
    const repaired = await generateFieldContent({
      system: "You fix malformed JSON. Respond with ONLY the corrected, valid JSON object.",
      prompt: `This JSON is malformed or has the wrong shape. Fix it and return ONLY valid JSON:\n${raw}`,
      maxOutputTokens: params.maxOutputTokens,
    });
    result = attempt(repaired);
  }

  if (!result || !result.success) {
    throw new AiGenerationError("The AI returned an unexpected response. Try again.");
  }
  return result.data;
}
