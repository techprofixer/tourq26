import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { PageType, WorkflowStatus } from "@prisma/client";
import { withAdmin } from "@/lib/with-admin";
import { clientErrorMessage, jsonError } from "@/lib/api-response";
import { parseBlocks } from "@/lib/cms/blocks";
import { briefInputSchema, createPage, listPages, seoInputSchema } from "@/lib/cms/pages";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as WorkflowStatus | null;
  const type = searchParams.get("type") as PageType | null;

  const pages = await listPages({
    status: status || undefined,
    type: type || undefined,
  });
  return NextResponse.json(pages);
});

export const POST = withAdmin(async (request: NextRequest) => {
  const body = (await request.json()) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  const type = String(body.type ?? "LANDING") as PageType;
  const slug = String(body.slug ?? title).trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const page = await createPage({
      title,
      slug,
      type,
      status: (body.status as WorkflowStatus) || "DRAFT",
      excerpt: body.excerpt != null ? String(body.excerpt) : null,
      blocks: body.blocks != null ? parseBlocks(body.blocks) : undefined,
      seo: body.seo != null ? seoInputSchema.parse(body.seo) : undefined,
      brief: body.brief != null ? briefInputSchema.parse(body.brief) : undefined,
    });
    void logActivity({ entityType: "cms-page", entityId: page.id, action: "created", summary: `Created CMS page "${page.title}"` });
    revalidatePath("/admin/cms/pages");
    return NextResponse.json(page, { status: 201 });
  } catch (e) {
    return jsonError(400, clientErrorMessage(e, "Failed to create page", "cms-pages"));
  }
});
