/**
 * One-time setup: creates the Atlas Search vector index used by src/lib/rag/retrieve.ts.
 * Run after DATABASE_URL points at an Atlas cluster with Search enabled (M10+, or a
 * shared/serverless tier with Atlas Search available):
 *
 *   npm run rag:index
 *
 * `createSearchIndexes` is asynchronous on Atlas's side — the index shows status "BUILDING"
 * for a bit after this returns before it's queryable.
 *
 * If this fails (older cluster tier, missing privilege, etc.), create it manually instead:
 * Atlas UI → your cluster → Search → Create Search Index → JSON Editor, collection
 * `KnowledgeChunk`, name `knowledge_vector_index`, using the `definition` below.
 */
import { prisma } from "../../src/lib/prisma";
import { EMBEDDING_DIMENSIONS } from "../../src/lib/rag/embeddings";
import { VECTOR_INDEX_NAME } from "../../src/lib/rag/retrieve";

const definition = {
  fields: [
    {
      type: "vector",
      path: "embedding",
      numDimensions: EMBEDDING_DIMENSIONS,
      similarity: "cosine",
    },
  ],
};

async function main() {
  try {
    // Drop-then-create makes this idempotent when the embedding model (and its dimension
    // count) changes — createSearchIndexes errors on a name collision otherwise. Ignore any
    // error here; it just means there was no prior index with this name.
    try {
      await prisma.$runCommandRaw({ dropSearchIndex: "KnowledgeChunk", name: VECTOR_INDEX_NAME });
    } catch {
      /* no existing index to drop */
    }

    await prisma.$runCommandRaw({
      createSearchIndexes: "KnowledgeChunk",
      indexes: [{ name: VECTOR_INDEX_NAME, type: "vectorSearch", definition }],
    });
    console.log(`Requested creation of Atlas Search index "${VECTOR_INDEX_NAME}" on KnowledgeChunk.`);
    console.log("It will show status BUILDING in Atlas for a short time before it's queryable.");
  } catch (err) {
    console.error("Could not create the index automatically:", err instanceof Error ? err.message : err);
    console.log("\nCreate it manually instead — Atlas UI → cluster → Search → Create Search Index → JSON Editor:");
    console.log(`  Collection: KnowledgeChunk`);
    console.log(`  Index name: ${VECTOR_INDEX_NAME}`);
    console.log(`  Definition:\n${JSON.stringify(definition, null, 2)}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
