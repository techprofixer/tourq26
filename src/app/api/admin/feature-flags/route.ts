import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import {
  getFeatureFlagCatalogForAdmin,
  getResolvedFeatureFlags,
  isValidFeatureFlagKey,
  saveFeatureFlagValues,
  type FeatureFlagKey,
} from "@/lib/feature-flags";

export const GET = withAdmin(async () => {
  const [catalog, resolved] = await Promise.all([
    Promise.resolve(getFeatureFlagCatalogForAdmin()),
    getResolvedFeatureFlags(),
  ]);
  return NextResponse.json({ catalog, resolved });
});

export const PUT = withAdmin(async (request: NextRequest) => {
  const body = (await request.json().catch(() => null)) as {
    values?: Record<string, boolean>;
  } | null;
  if (!body?.values || typeof body.values !== "object") {
    return NextResponse.json({ error: "Expected { values: { [key]: boolean } }" }, { status: 400 });
  }
  const patch: Partial<Record<FeatureFlagKey, boolean>> = {};
  for (const [k, v] of Object.entries(body.values)) {
    if (!isValidFeatureFlagKey(k)) {
      return NextResponse.json({ error: `Unknown flag: ${k}` }, { status: 400 });
    }
    if (typeof v !== "boolean") {
      return NextResponse.json({ error: `Invalid value for ${k}` }, { status: 400 });
    }
    patch[k] = v;
  }
  const resolved = await saveFeatureFlagValues(patch);
  revalidatePath("/", "layout");
  revalidatePath("/blog");
  revalidatePath("/contact");
  return NextResponse.json({ resolved });
});
