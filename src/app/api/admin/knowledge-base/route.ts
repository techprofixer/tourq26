import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/with-admin";
import {
  addCustomKnowledge,
  extractTextFromUpload,
  listCustomKnowledgeDocs,
  MAX_CUSTOM_CONTENT_LENGTH,
} from "@/lib/rag/custom-knowledge";
import { logActivity } from "@/lib/activity-log";
import { jsonError } from "@/lib/api-response";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";

export const runtime = "nodejs";

export const GET = withAdmin(async () => {
  const docs = await listCustomKnowledgeDocs();
  return NextResponse.json(docs);
});

export const POST = withAdmin(async (request: NextRequest) => {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return jsonError(400, "Invalid form data.");
  }

  const title = String(form.get("title") || "").trim();
  const url = String(form.get("url") || "").trim();
  let content = String(form.get("content") || "").trim();

  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return jsonError(400, "File too large (max 15MB).");
    }
    try {
      const extracted = (await extractTextFromUpload(file)).trim();
      content = [content, extracted].filter(Boolean).join("\n\n");
    } catch (err) {
      return jsonError(400, err instanceof Error ? err.message : "Failed to read the uploaded file.");
    }
  }

  if (!title || !content) {
    return jsonError(400, "Title and content (pasted text or an uploaded file) are required.");
  }
  if (content.length > MAX_CUSTOM_CONTENT_LENGTH) {
    return jsonError(400, `Content is too long (max ${MAX_CUSTOM_CONTENT_LENGTH.toLocaleString()} characters).`);
  }
  if (url && !/^https?:\/\//i.test(url)) {
    return jsonError(400, "URL must start with http:// or https://");
  }

  try {
    const { sourceId, chunkCount } = await addCustomKnowledge({ title, content, url: url || null });
    void logActivity({
      entityType: "knowledge_chunk",
      entityId: sourceId,
      action: "created",
      summary: `Added custom knowledge "${title}" to the chat assistant`,
    });
    return NextResponse.json({ ok: true, sourceId, chunkCount });
  } catch (err) {
    console.error("Failed to add custom knowledge:", err);
    return jsonError(500, err instanceof Error ? err.message : "Failed to embed content.");
  }
});
