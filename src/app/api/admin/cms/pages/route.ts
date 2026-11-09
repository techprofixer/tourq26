import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { PageType, WorkflowStatus } from "@prisma/client";
import { withAdmin } from "@/lib/with-admin";
import { parseBlocks } from "@/lib/cms/blocks";
import { createPage, listPages } from "@/lib/cms/pages";
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
      seo: body.seo as Parameters<typeof createPage>[0]["seo"],
      brief: body.brief as Parameters<typeof createPage>[0]["brief"],
    });
    void logActivity({ entityType: "cms-page", entityId: page.id, action: "created", summary: `Created CMS page "${page.title}"` });
    revalidatePath("/admin/cms/pages");
    return NextResponse.json(page, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create page";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
