import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/with-admin";
import { deleteCustomKnowledgeDoc } from "@/lib/rag/custom-knowledge";
import { logActivity } from "@/lib/activity-log";

export const DELETE = withAdmin(async (_request: Request, { params }: { params: Promise<{ sourceId: string }> }) => {
  const { sourceId } = await params;
  await deleteCustomKnowledgeDoc(sourceId);
  void logActivity({
    entityType: "knowledge_chunk",
    entityId: sourceId,
    action: "deleted",
    summary: "Removed custom knowledge from the chat assistant",
  });
  return NextResponse.json({ ok: true });
});
