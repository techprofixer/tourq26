import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { jsonError } from "@/lib/api-response";
import { BRAND_FIELDS, readBrandContent, writeBrandContent, type BrandContent } from "@/lib/brand-content";
import { THEME_COLOR_FIELDS, isHexColor, isRadiusScale } from "@/lib/theme";
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
  // Theme values end up inside a <style> tag — accept only exact hex / whitelisted keys.
  for (const field of THEME_COLOR_FIELDS) {
    if (data[field] && !isHexColor(data[field])) {
      return jsonError(400, `${field} must be a hex color like #2f63b8`);
    }
  }
  if (data.radiusScale && !isRadiusScale(data.radiusScale)) {
    return jsonError(400, "radiusScale is not a known scale");
  }

  await writeBrandContent(data);
  void logActivity({ entityType: "brand", action: "updated", summary: "Updated brand settings" });
  // Theme lives in the root layout, so every route needs re-rendering — not just the home page.
  revalidatePath("/", "layout");
  return NextResponse.json(data);
});
