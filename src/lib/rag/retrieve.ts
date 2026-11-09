import { prisma } from "@/lib/prisma";
import { embedOne } from "./embeddings";

export const VECTOR_INDEX_NAME = "knowledge_vector_index";

export type RetrievedChunk = {
  sourceType: string;
  sourceId: string;
  title: string;
  content: string;
  url: string | null;
  score: number;
};

type AggregateRawResult = {
  cursor?: { firstBatch?: unknown[] };
  ok?: number;
};

// gemini-embedding-001 cosine scores sit around 0.79 for completely unrelated content (the
// embedding space's noise floor) and climb to 0.82+ once a chunk is actually on-topic. Below
// this, a chunk is closer to "nearest neighbor of nothing" than a real match — including it in
// CONTEXT makes the model force an answer out of unrelated pages instead of admitting the site
// doesn't cover the question.
const MIN_RELEVANCE_SCORE = 0.82;

/** Embeds `query` and runs an Atlas `$vectorSearch` against `KnowledgeChunk.embedding`. */
export async function retrieveRelevantChunks(query: string, topK = 5): Promise<RetrievedChunk[]> {
  const queryVector = await embedOne(query);

  const raw = (await prisma.$runCommandRaw({
    aggregate: "KnowledgeChunk",
    pipeline: [
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector,
          numCandidates: Math.max(100, topK * 20),
          limit: topK,
        },
      },
      {
        $project: {
          _id: 0,
          sourceType: 1,
          sourceId: 1,
          title: 1,
          content: 1,
          url: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ],
    cursor: {},
  })) as AggregateRawResult;

  const batch = raw.cursor?.firstBatch ?? [];
  return batch
    .map((doc) => {
      const d = doc as Record<string, unknown>;
      return {
        sourceType: String(d.sourceType ?? ""),
        sourceId: String(d.sourceId ?? ""),
        title: String(d.title ?? ""),
        content: String(d.content ?? ""),
        url: typeof d.url === "string" ? d.url : null,
        score: typeof d.score === "number" ? d.score : 0,
      };
    })
    .filter((chunk) => chunk.score >= MIN_RELEVANCE_SCORE);
}
