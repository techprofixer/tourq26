import { randomUUID } from "crypto";
// Relative import (not "@/...") — this file is also imported by scripts/rag/build-knowledge-base.ts,
// which runs under tsx and doesn't resolve the tsconfig "@/*" path alias.
import { prisma } from "../prisma";
import { chunkText } from "./chunk";
import { embedBatch } from "./embeddings";

export const CUSTOM_UPLOAD_SOURCE_TYPE = "custom_upload";
export const MAX_CUSTOM_CONTENT_LENGTH = 200_000;
const ACCEPTED_UPLOAD_EXTENSIONS = [".txt", ".md", ".pdf"];

export type CustomKnowledgeDoc = {
  sourceId: string;
  title: string;
  url: string | null;
  chunkCount: number;
  updatedAt: Date;
};

/** Extracts plain text from an uploaded .txt/.md/.pdf file. Throws on unsupported types. */
export async function extractTextFromUpload(file: File): Promise<string> {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ACCEPTED_UPLOAD_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type "${ext || file.name}". Use .txt, .md, or .pdf.`);
  }

  if (ext === ".pdf") {
    // Dynamic import: pdf-parse (and its pdfjs-dist/@napi-rs/canvas transitive deps) must stay
    // out of this module's top-level import graph. This file is imported by page.tsx/route.ts
    // for every load of /admin/knowledge-base, not just PDF uploads — a resolution failure for
    // pdf-parse's native/worker sub-dependencies in serverless must not crash the whole page.
    const { PDFParse } = await import("pdf-parse");
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      // Strip pdf-parse's inter-page "-- N of M --" markers — noise for embeddings, not content.
      return result.text.replace(/^-- \d+ of \d+ --$/gm, "").replace(/\n{3,}/g, "\n\n");
    } finally {
      await parser.destroy();
    }
  }

  return await file.text();
}

/** Chunks, embeds, and stores `content` as a new custom knowledge document. */
export async function addCustomKnowledge(input: {
  title: string;
  content: string;
  url?: string | null;
}): Promise<{ sourceId: string; chunkCount: number }> {
  const pieces = chunkText(input.content);
  if (pieces.length === 0) throw new Error("Content is empty after cleanup.");

  const embeddings = await embedBatch(pieces);
  const sourceId = randomUUID();

  await prisma.knowledgeChunk.createMany({
    data: pieces.map((content, chunkIndex) => ({
      sourceType: CUSTOM_UPLOAD_SOURCE_TYPE,
      sourceId,
      chunkIndex,
      title: input.title,
      content,
      url: input.url || null,
      embedding: embeddings[chunkIndex],
    })),
  });

  return { sourceId, chunkCount: pieces.length };
}

export async function listCustomKnowledgeDocs(): Promise<CustomKnowledgeDoc[]> {
  const rows = await prisma.knowledgeChunk.findMany({
    where: { sourceType: CUSTOM_UPLOAD_SOURCE_TYPE },
    orderBy: { updatedAt: "desc" },
    select: { sourceId: true, title: true, url: true, updatedAt: true },
  });

  const bySourceId = new Map<string, CustomKnowledgeDoc>();
  for (const row of rows) {
    const existing = bySourceId.get(row.sourceId);
    if (existing) {
      existing.chunkCount += 1;
      if (row.updatedAt > existing.updatedAt) existing.updatedAt = row.updatedAt;
    } else {
      bySourceId.set(row.sourceId, {
        sourceId: row.sourceId,
        title: row.title,
        url: row.url,
        chunkCount: 1,
        updatedAt: row.updatedAt,
      });
    }
  }
  return [...bySourceId.values()].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function deleteCustomKnowledgeDoc(sourceId: string): Promise<void> {
  await prisma.knowledgeChunk.deleteMany({
    where: { sourceType: CUSTOM_UPLOAD_SOURCE_TYPE, sourceId },
  });
}
