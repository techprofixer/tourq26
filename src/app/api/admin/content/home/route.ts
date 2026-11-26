import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import {
  readHomeContent,
  writeHomeContent,
  parseHomeExtras,
  pickHomeExtras,
  validateJsonLdText,
  type HomeContent,
} from "@/lib/home-content";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async () => {
  const data = await readHomeContent();
  return NextResponse.json(data);
});

export const PUT = withAdmin(async (request: NextRequest) => {
  const body = (await request.json()) as Partial<HomeContent>;
  const current = await readHomeContent();
  const merged: HomeContent = { ...current, ...body };
  // Normalise the schemaless `extras` slice so a malformed payload can't poison the stored document.
  const data: HomeContent = { ...merged, ...parseHomeExtras(pickHomeExtras(merged)) };

  const jsonLdError = validateJsonLdText(data.seoJsonLdCustom);
  if (jsonLdError) return NextResponse.json({ error: `Custom JSON-LD: ${jsonLdError}` }, { status: 400 });
  if (data.seoCanonical.trim() && !/^https?:\/\/\S+$/i.test(data.seoCanonical.trim())) {
    return NextResponse.json({ error: "Canonical URL must be absolute (https://…) or blank." }, { status: 400 });
  }
  if (data.seoOgImageUrl.trim() && !/^(https?:\/\/|\/)\S+$/i.test(data.seoOgImageUrl.trim())) {
    return NextResponse.json({ error: "OG image must be an absolute URL or a /path." }, { status: 400 });
  }

  await writeHomeContent(data);
  void logActivity({ entityType: "home", action: "updated", summary: "Updated homepage content" });
  revalidatePath("/");
  revalidatePath("/llms.txt");
  return NextResponse.json(data);
});
