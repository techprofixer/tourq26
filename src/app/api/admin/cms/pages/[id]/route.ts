import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { PageType, WorkflowStatus } from "@prisma/client";
import { withAdmin } from "@/lib/with-admin";
import { clientErrorMessage, jsonError } from "@/lib/api-response";
import { parseBlocks } from "@/lib/cms/blocks";
import {
  getPageById,
  publishPage,
  transitionPage,
  updatePage,
  briefInputSchema,
  seoInputSchema,
  type UpsertPageInput,
} from "@/lib/cms/pages";
import { logActivity } from "@/lib/activity-log";
import { submitToIndexNow } from "@/lib/indexnow";
import { recordPageMove } from "@/lib/redirects";

type Ctx = { params: Promise<{ id: string }> };

/** Hub routes whose entity cards depend on which pages of that type are published. */
const HUB_FOR_TYPE: Partial<Record<PageType, string>> = {
  SERVICE: "/services",
  SOLUTION: "/solutions",
  INDUSTRY: "/industries",
  TECHNOLOGY: "/technologies",
  LOCATION: "/locations",
};

/**
 * Refreshes everything a CMS page change can affect. `wasPublic` / `isPublic` describe the page
 * before and after the change; when either is true the URL is (or was) live, so the discovery
 * files are rebuilt and IndexNow is pinged — including on unpublish/delete so engines drop it.
 */
function afterPageChange(opts: {
  paths: string[];
  type: PageType;
  wasPublic: boolean;
  isPublic: boolean;
}) {
  revalidatePath("/admin/cms/pages");
  if (!opts.wasPublic && !opts.isPublic) return;
  const paths = Array.from(new Set(opts.paths.filter(Boolean)));
  for (const p of paths) revalidatePath(p);
  const hub = HUB_FOR_TYPE[opts.type];
  if (hub) revalidatePath(hub);
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  // Nav mega-menus list published entity pages.
  revalidatePath("/", "layout");
  void submitToIndexNow(paths);
}

export const GET = withAdmin(async (_request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const page = await getPageById(id);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
});

export const PATCH = withAdmin(async (request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError(400, "Invalid JSON body");

  const before = await getPageById(id);
  if (!before) return jsonError(404, "Not found");
  const wasPublic = before.status === "PUBLISHED";

  if (body.action === "publish" || (body.action === "transition" && body.toStatus)) {
    const page =
      body.action === "publish"
        ? await publishPage(id)
        : await transitionPage(
            id,
            body.toStatus as WorkflowStatus,
            body.comment != null ? String(body.comment) : undefined,
          );
    if (!page) return jsonError(404, "Not found");
    void logActivity({
      entityType: "cms-page",
      entityId: id,
      action: page.status === "PUBLISHED" ? "published" : "updated",
      summary:
        body.action === "publish"
          ? `Published CMS page "${page.title}"`
          : `Transitioned CMS page "${page.title}" to ${page.status}`,
    });
    afterPageChange({
      paths: [page.path],
      type: page.type,
      wasPublic,
      isPublic: page.status === "PUBLISHED",
    });
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

  try {
    if (body.seo != null) patch.seo = seoInputSchema.parse(body.seo);
    if (body.brief != null) patch.brief = briefInputSchema.parse(body.brief);
    const page = await updatePage(id, patch);
    if (!page) return jsonError(404, "Not found");

    const moved = wasPublic && before.path !== page.path;
    if (moved) await recordPageMove(before.path, page.path);

    void logActivity({
      entityType: "cms-page",
      entityId: id,
      action: "updated",
      summary: moved
        ? `Updated CMS page "${page.title}" (moved ${before.path} → ${page.path}, 301 added)`
        : `Updated CMS page "${page.title}"`,
    });
    afterPageChange({
      paths: [before.path, page.path],
      type: page.type,
      wasPublic,
      isPublic: page.status === "PUBLISHED",
    });
    return NextResponse.json(page);
  } catch (e) {
    return jsonError(400, clientErrorMessage(e, "Failed to update page", "cms-pages"));
  }
});

export const DELETE = withAdmin(async (_request: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { prisma } = await import("@/lib/db");
  const page = await getPageById(id);
  if (!page) return jsonError(404, "Not found");

  await prisma.page.delete({ where: { id } });
  void logActivity({ entityType: "cms-page", entityId: id, action: "deleted", summary: `Deleted CMS page "${page.title}"` });
  afterPageChange({
    paths: [page.path],
    type: page.type,
    wasPublic: page.status === "PUBLISHED",
    isPublic: false,
  });
  return NextResponse.json({ ok: true });
});
