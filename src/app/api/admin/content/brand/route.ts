import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { readBrandContent, writeBrandContent, type BrandContent } from "@/lib/brand-content";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async () => {
  const data = await readBrandContent();
  return NextResponse.json(data);
});

export const PUT = withAdmin(async (request: NextRequest) => {
  const body = (await request.json()) as Partial<BrandContent>;
  const current = await readBrandContent();
  const data: BrandContent = { ...current, ...body };
  await writeBrandContent(data);
  void logActivity({ entityType: "brand", action: "updated", summary: "Updated brand settings" });
  revalidatePath("/");
  return NextResponse.json(data);
});
