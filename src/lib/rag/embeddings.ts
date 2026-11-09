/**
 * Embeddings for RAG retrieval — Gemini's `batchEmbedContents` REST endpoint. Reuses the same
 * GEMINI_API_KEY as generation (src/app/api/chat/route.ts) — one provider, one key, for both.
 */

const MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const BATCH_SIZE = 100; // Gemini's batchEmbedContents request cap

// gemini-embedding-001's default output size — must match the Atlas Search vector index
// (scripts/rag/create-vector-index.ts). Update both together if you change GEMINI_EMBEDDING_MODEL
// or pass a different `outputDimensionality`.
export const EMBEDDING_DIMENSIONS = 3072;

export async function embedOne(text: string): Promise<number[]> {
  const [embedding] = await embedBatch([text]);
  return embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: batch.map((text) => ({
            model: `models/${MODEL}`,
            content: { parts: [{ text }] },
          })),
        }),
      },
    );
    if (!res.ok) {
      throw new Error(`Gemini embeddings request failed (${res.status}): ${await res.text()}`);
    }
    const data = (await res.json()) as { embeddings: { values: number[] }[] };
    out.push(...data.embeddings.map((e) => e.values));
  }
  return out;
}
