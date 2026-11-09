import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { readHomeContent, writeHomeContent, type HomeContent } from "@/lib/home-content";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async () => {
  const data = await readHomeContent();
  return NextResponse.json(data);
});

export const PUT = withAdmin(async (request: NextRequest) => {
  const body = (await request.json()) as Partial<HomeContent>;
  const current = await readHomeContent();
  const data: HomeContent = { ...current, ...body };
  await writeHomeContent(data);
  void logActivity({ entityType: "home", action: "updated", summary: "Updated homepage content" });
  revalidatePath("/");
  return NextResponse.json(data);
});
