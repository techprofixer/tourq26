import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/with-admin";
import { listMediaAssets, saveMediaFile } from "@/lib/media";
import { logActivity } from "@/lib/activity-log";
import { jsonError } from "@/lib/api-response";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";

export const GET = withAdmin(async () => {
  const assets = await listMediaAssets();
  return NextResponse.json(assets);
});

export const POST = withAdmin(async (request: NextRequest) => {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError(400, "No file provided");
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return jsonError(400, "File too large (max 15MB)");
  }

  const asset = await saveMediaFile(file);
  void logActivity({ entityType: "media", entityId: asset.id, action: "created", summary: `Uploaded "${asset.filename}"` });
  return NextResponse.json(asset);
});
