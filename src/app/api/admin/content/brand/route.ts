import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { jsonError } from "@/lib/api-response";
import {
  BRAND_FIELDS,
  isSafeCssColor,
  readBrandContent,
  writeBrandContent,
  type BrandContent,
} from "@/lib/brand-content";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async () => {
  const data = await readBrandContent();
  return NextResponse.json(data);
});

export const PUT = withAdmin(async (request: NextRequest) => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return jsonError(400, "Invalid JSON body");

  const data: BrandContent = { ...(await readBrandContent()) };
  // Only known string fields are accepted — never spread arbitrary request keys into settings.
  for (const field of BRAND_FIELDS) {
    const value = body[field];
    if (value === undefined) continue;
    if (typeof value !== "string") return jsonError(400, `${field} must be a string`);
    data[field] = value.trim();
  }
  for (const field of ["colorPrimary", "colorAccent"] as const) {
    if (data[field] && !isSafeCssColor(data[field])) {
      return jsonError(400, `${field} must be a hex, rgb() or hsl() color`);
    }
  }

  await writeBrandContent(data);
  void logActivity({ entityType: "brand", action: "updated", summary: "Updated brand settings" });
  revalidatePath("/");
  return NextResponse.json(data);
});
