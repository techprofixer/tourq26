import { z } from "zod";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { retrieveRelevantChunks, type RetrievedChunk } from "@/lib/rag/retrieve";
import { jsonError } from "@/lib/api-response";
import { MAX_CHAT_HISTORY_MESSAGES, MAX_CHAT_MESSAGE_LENGTH } from "@/lib/constants";
import { containsProfanity } from "@/lib/moderation";
import { rateLimit } from "@/lib/rate-limit";
import { logChatQuery } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.7-flash";

// Caps how many Gemini-backed requests one visitor can fire — cost control, not abuse-proofing
// (see src/lib/rate-limit.ts for why this alone isn't a hard guarantee on serverless).
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

// Defaults to Ollama in local dev (so we don't burn Gemini quota / hit its 503s while
// developing) and Gemini in production. Override with CHAT_PROVIDER=gemini|ollama.
const CHAT_PROVIDER = process.env.CHAT_PROVIDER || (process.env.NODE_ENV === "production" ? "gemini" : "ollama");
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3.1";

const FALLBACK_MESSAGE =
  "\n\nI'm not able to help with that. Please reach out via /contact and our team will follow up directly.";
const ERROR_MESSAGE = "\n\nSomething went wrong on our end. Please try again in a moment.";
// Distinct from ERROR_MESSAGE: shown when Gemini's daily free-tier request quota is exhausted,
// where "try again in a moment" is actively misleading — it won't recover until the daily
// quota resets, so we point visitors to a human instead of telling them to retry.
const QUOTA_EXCEEDED_MESSAGE =
  "\n\nOur AI assistant has hit its usage limit for today. Please reach out via /contact and our team will follow up directly.";
const MODERATION_MESSAGE =
  "Let's keep things respectful — could you rephrase that without the language, please? I'm happy to help with your question about Torq Studio.\n\nकृपया बिना अपशब्दों के अपना सवाल दोबारा लिखें, मैं आपकी मदद करने के लिए तैयार हूं।";
// Gemini finish reasons that mean the response was blocked/incomplete, not a normal stop.
const NON_STOP_FINISH_REASONS = new Set(["SAFETY", "RECITATION", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "OTHER"]);

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
      }),
    )
    .min(1)
    .max(MAX_CHAT_HISTORY_MESSAGES),
  isSuggestion: z.boolean().optional().default(false),
});

const SYSTEM_PROMPT = `You are the AI assistant embedded on Torq Studio's website (a software development agency). Answer visitor questions about Torq Studio's services, solutions, industries, technologies, pricing, and case studies.

Each user turn may include a CONTEXT block pulled from the site's own content. Base your answer only on that context and on the ongoing conversation — don't invent services, pricing, page URLs, or case study results that aren't in the context, even if they sound plausible. Only link to a URL that literally appears in the context — never construct or guess one. If a user turn has no CONTEXT block, or the context doesn't cover the question, say so plainly and suggest visiting /contact to talk to the team — don't guess or make something up to sound helpful.

Visitors may write in English, Hindi (Devanagari script), or Hinglish (Roman-script Hindi mixed with English). Pick your reply language from the visitor's FIRST message in the conversation and keep using it for every later reply, even if a later message is short, a single keyword, or otherwise ambiguous — only switch if the visitor clearly writes a whole message in a different language/script than before. If the first message is ambiguous (e.g. a single common English word, a URL, a name), default to English.

Keep answers short and conversational (2-4 sentences unless the visitor asks for more detail). No markdown headers; a short bullet list is fine when comparing options. Whenever you mention a page path or URL, always format it as a markdown link, e.g. "[contact page](/contact)" — never write a bare path like "/contact" as plain text.`;

function buildContextBlock(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => `[${i + 1}] ${c.title}${c.url ? ` (${c.url})` : ""}\n${c.content}`)
    .join("\n\n---\n\n");
}

// Gemini statuses worth retrying — transient demand/rate-limit spikes, not client/config errors.
const RETRYABLE_STATUSES = new Set([429, 503]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries transient Gemini failures (503 "high demand", 429 rate limit) with exponential
 * backoff (400ms, 800ms). Non-retryable statuses and the final attempt are returned/thrown
 * as-is, for the caller's existing `!res.ok` handling.
 */
async function fetchGeminiWithRetry(url: string, init: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      await sleep(400 * 2 ** attempt);
      continue;
    }
    if (res.ok || attempt >= maxRetries || !RETRYABLE_STATUSES.has(res.status)) {
      return res;
    }
    await sleep(400 * 2 ** attempt);
  }
}

function textStreamResponse(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

type ChatMessage = { role: "user" | "assistant"; content: string };
type GeminiPart = { text: string };
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };
type GeminiStreamChunk = {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
};

export async function POST(req: Request) {
  if (!(await isFeatureEnabled("floating_chat_assistant"))) {
    return jsonError(503, "Chat assistant is unavailable.");
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterSeconds } = rateLimit(`chat:${ip}`, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);
  if (!allowed) {
    return jsonError(429, `Too many messages — please wait ${retryAfterSeconds}s and try again.`, {
      "Retry-After": String(retryAfterSeconds),
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (CHAT_PROVIDER === "gemini" && !apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return jsonError(503, "Chat assistant is not configured.");
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonError(400, "Invalid payload");
    }
    body = parsed.data;
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const { messages } = body;
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    return jsonError(400, "The last message must be from the user.");
  }

  void logChatQuery({ query: lastMessage.content, fromSuggestion: body.isSuggestion });

  if (containsProfanity(lastMessage.content)) {
    return textStreamResponse(MODERATION_MESSAGE);
  }

  let chunks: RetrievedChunk[] = [];
  try {
    chunks = await retrieveRelevantChunks(lastMessage.content, 5);
  } catch (err) {
    // Degrade gracefully (e.g. vector index still building) rather than failing the whole
    // chat — the model answers without site-specific context.
    console.error("RAG retrieval failed:", err);
  }

  const finalUserContent = chunks.length
    ? `CONTEXT:\n${buildContextBlock(chunks)}\n\nUser question: ${lastMessage.content}`
    : lastMessage.content;
  const chatMessages: ChatMessage[] = [...messages.slice(0, -1), { role: "user", content: finalUserContent }];

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (CHAT_PROVIDER === "ollama") {
          const model = createOpenAI({ baseURL: OLLAMA_BASE_URL, apiKey: "ollama" }).chat(OLLAMA_CHAT_MODEL);
          const result = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: chatMessages,
            maxOutputTokens: 1024,
          });

          for await (const text of result.textStream) {
            controller.enqueue(encoder.encode(text));
          }
        } else {
          const history: GeminiContent[] = chatMessages.slice(0, -1).map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          }));
          const contents: GeminiContent[] = [
            ...history,
            { role: "user", parts: [{ text: chatMessages[chatMessages.length - 1].content }] },
          ];

          const res = await fetchGeminiWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents,
                // 2048, not 1024: gemini-3.7-flash spends an unpredictable, non-zero chunk of
                // this budget on internal "thinking" tokens before writing visible text — even
                // with thinkingConfig.thinkingBudget: 0, which this model doesn't honor. Too
                // small a budget risks finishReason MAX_TOKENS with zero visible output.
                generationConfig: { maxOutputTokens: 2048 },
              }),
            },
          );

          if (!res.ok || !res.body) {
            const errorBody = await res.text();
            if (res.status === 429) {
              // Retrying (fetchGeminiWithRetry already tried twice) doesn't help when this is
              // the daily free-tier quota, not a short-lived rate limit — it won't reset for
              // hours, so tell the visitor plainly instead of implying a retry will work.
              console.error(`Gemini quota/rate limit hit (429): ${errorBody}`);
              controller.enqueue(encoder.encode(QUOTA_EXCEEDED_MESSAGE));
              return;
            }
            throw new Error(`Gemini request failed (${res.status}): ${errorBody}`);
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let finishReason: string | undefined;
          let emittedText = false;

          const processEvent = (rawEvent: string) => {
            const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data: "));
            if (!dataLine) return;

            const chunk = JSON.parse(dataLine.slice("data: ".length)) as GeminiStreamChunk;
            const candidate = chunk.candidates?.[0];
            const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
            if (text) {
              controller.enqueue(encoder.encode(text));
              emittedText = true;
            }
            if (candidate?.finishReason) finishReason = candidate.finishReason;
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let sepIndex: number;
            while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
              const rawEvent = buffer.slice(0, sepIndex);
              buffer = buffer.slice(sepIndex + 2);
              processEvent(rawEvent);
            }
          }

          // The connection can close right after the last event without a trailing blank-line
          // separator (common when that event — often the one carrying finishReason, e.g.
          // MAX_TOKENS — is also the last thing Gemini sends). Flush the decoder for any
          // trailing multi-byte UTF-8 and process whatever's left in `buffer`, otherwise that
          // final chunk is silently dropped and the widget sees "no text" even though Gemini
          // did respond.
          buffer += decoder.decode();
          if (buffer.trim()) {
            try {
              processEvent(buffer);
            } catch (err) {
              console.error("Failed to parse trailing Gemini SSE fragment:", err);
            }
          }

          if (finishReason && NON_STOP_FINISH_REASONS.has(finishReason)) {
            controller.enqueue(encoder.encode(FALLBACK_MESSAGE));
          } else if (!emittedText) {
            // Stream ended with no visible text at all (e.g. MAX_TOKENS burned entirely on
            // thinking tokens) — don't let the widget see a silent empty response.
            console.error("Gemini stream ended with no text; finishReason:", finishReason);
            controller.enqueue(encoder.encode(ERROR_MESSAGE));
          }
        }
      } catch (err) {
        console.error(`${CHAT_PROVIDER} stream error:`, err);
        controller.enqueue(encoder.encode(ERROR_MESSAGE));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
