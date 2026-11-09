import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { readFooterContent, writeFooterContent, type FooterContent } from "@/lib/footer-content";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async () => {
  const data = await readFooterContent();
  return NextResponse.json(data);
});

export const PUT = withAdmin(async (request: NextRequest) => {
  const body = (await request.json()) as Partial<FooterContent>;
  const current = await readFooterContent();
  const data: FooterContent = { ...current, ...body };
  await writeFooterContent(data);
  void logActivity({ entityType: "footer", action: "updated", summary: "Updated footer content" });
  revalidatePath("/", "layout");
  return NextResponse.json(data);
});
