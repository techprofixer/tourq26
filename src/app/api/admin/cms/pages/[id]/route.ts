import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { WorkflowStatus } from "@prisma/client";
import { withAdmin } from "@/lib/with-admin";
import { parseBlocks } from "@/lib/cms/blocks";
import {
  getPageById,
  publishPage,
  transitionPage,
  updatePage,
  type UpsertPageInput,
} from "@/lib/cms/pages";
import { logActivity } from "@/lib/activity-log";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAdmin(async (_request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const page = await getPageById(id);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
});

export const PATCH = withAdmin(async (request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const body = (await request.json()) as Record<string, unknown>;

  if (body.action === "publish") {
    const page = await publishPage(id);
    void logActivity({ entityType: "cms-page", entityId: id, action: "published", summary: `Published CMS page "${page?.title ?? id}"` });
    if (page?.path) {
      revalidatePath(page.path);
      revalidatePath("/sitemap.xml");
      // A SERVICE page's publish state gates whether its entity card is listed on /services.
      if (page.type === "SERVICE") revalidatePath("/services");
    }
    return NextResponse.json(page);
  }

  if (body.action === "transition" && body.toStatus) {
    const page = await transitionPage(
      id,
      body.toStatus as WorkflowStatus,
      body.comment != null ? String(body.comment) : undefined,
    );
    void logActivity({
      entityType: "cms-page",
      entityId: id,
      action: page?.status === "PUBLISHED" ? "published" : "updated",
      summary: `Transitioned CMS page "${page?.title ?? id}" to ${body.toStatus}`,
    });
    if (page?.status === "PUBLISHED" && page.path) {
      revalidatePath(page.path);
      revalidatePath("/sitemap.xml");
      if (page.type === "SERVICE") revalidatePath("/services");
    }
    return NextResponse.json(page);
  }

  const patch: Partial<UpsertPageInput> = {};
  if (body.title != null) patch.title = String(body.title);
  if (body.slug != null) patch.slug = String(body.slug);
  if (body.type != null) patch.type = body.type as UpsertPageInput["type"];
  if (body.status != null) patch.status = body.status as WorkflowStatus;
  if (body.excerpt !== undefined) {
    patch.excerpt = body.excerpt == null ? null : String(body.excerpt);
  }
  if (body.path != null) patch.path = String(body.path);
  if (body.blocks != null) patch.blocks = parseBlocks(body.blocks);
  if (body.seo != null) patch.seo = body.seo as UpsertPageInput["seo"];
  if (body.brief != null) patch.brief = body.brief as UpsertPageInput["brief"];

  try {
    const page = await updatePage(id, patch);
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    void logActivity({ entityType: "cms-page", entityId: id, action: "updated", summary: `Updated CMS page "${page.title}"` });
    if (page.status === "PUBLISHED") {
      revalidatePath(page.path);
    }
    revalidatePath("/admin/cms/pages");
    return NextResponse.json(page);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update page";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

export const DELETE = withAdmin(async (_request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { prisma } = await import("@/lib/db");
  const page = await getPageById(id);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.page.delete({ where: { id } });
  void logActivity({ entityType: "cms-page", entityId: id, action: "deleted", summary: `Deleted CMS page "${page.title}"` });
  revalidatePath("/admin/cms/pages");
  if (page.path) revalidatePath(page.path);
  if (page.type === "SERVICE") revalidatePath("/services");
  return NextResponse.json({ ok: true });
});
