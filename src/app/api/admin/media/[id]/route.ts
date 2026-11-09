import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/with-admin";
import { deleteMediaAsset, getMediaAssetStatus, updateMediaAsset } from "@/lib/media";
import { logActivity } from "@/lib/activity-log";
import { jsonError } from "@/lib/api-response";

export const GET = withAdmin(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const asset = await getMediaAssetStatus(id);
  if (!asset) return jsonError(404, "Media asset not found");
  return NextResponse.json(asset);
});

export const PATCH = withAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError(400, "Invalid request body");

  const asset = await updateMediaAsset(id, { alt: body.alt, title: body.title });
  if (!asset) return jsonError(404, "Media asset not found");
  void logActivity({ entityType: "media", entityId: id, action: "updated", summary: `Updated "${asset.filename}"` });
  return NextResponse.json(asset);
});

export const DELETE = withAdmin(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await deleteMediaAsset(id);
  void logActivity({ entityType: "media", entityId: id, action: "deleted", summary: "Deleted media asset" });
  return NextResponse.json({ ok: true });
});
