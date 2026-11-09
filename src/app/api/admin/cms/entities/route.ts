import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma, type EntityKind } from "@prisma/client";
import { withAdmin } from "@/lib/with-admin";
import {
  createEntity,
  deleteEntity,
  ensureEntityPage,
  listEntities,
  updateEntity,
  type EntityInput,
} from "@/lib/cms/entities";
import { logActivity } from "@/lib/activity-log";

const ENTITY_KIND_VALUES = ["SERVICE", "SOLUTION", "INDUSTRY", "TECHNOLOGY", "LOCATION"] as const;
type CrudEntityKind = (typeof ENTITY_KIND_VALUES)[number];

function isCrudKind(kind: unknown): kind is CrudEntityKind {
  return typeof kind === "string" && ENTITY_KIND_VALUES.includes(kind as CrudEntityKind);
}

function duplicateSlugMessage(e: unknown, fallback: string): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return "Slug already exists";
  return e instanceof Error ? e.message : fallback;
}

const HUB_PATH: Record<CrudEntityKind, string> = {
  SERVICE: "/services",
  SOLUTION: "/solutions",
  INDUSTRY: "/industries",
  TECHNOLOGY: "/technologies",
  LOCATION: "/locations",
};

export const GET = withAdmin(async (request: NextRequest) => {
  const kind = new URL(request.url).searchParams.get("kind") as EntityKind | null;
  if (!kind) {
    const [services, solutions, industries, technologies, locations] = await Promise.all([
      listEntities("SERVICE"),
      listEntities("SOLUTION"),
      listEntities("INDUSTRY"),
      listEntities("TECHNOLOGY"),
      listEntities("LOCATION"),
    ]);
    return NextResponse.json({ services, solutions, industries, technologies, locations });
  }

  const rows = await listEntities(kind);
  return NextResponse.json(rows);
});

export const POST = withAdmin(async (request: NextRequest) => {
  const body = (await request.json()) as {
    action?: string;
    kind?: EntityKind;
    slug?: string;
  };

  if (body.action === "ensure-page" && body.kind && body.slug) {
    if (!isCrudKind(body.kind)) {
      return NextResponse.json({ error: "Unsupported kind" }, { status: 400 });
    }
    const page = await ensureEntityPage(body.kind, body.slug);
    if (!page) return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    void logActivity({ entityType: "cms-entities", entityId: page.id, action: "created", summary: `Ensured entity page for ${body.kind} "${body.slug}"` });
    return NextResponse.json(page);
  }

  if (body.action === "create") {
    if (!isCrudKind(body.kind)) return NextResponse.json({ error: "Unsupported kind" }, { status: 400 });
    const input = body as unknown as EntityInput;
    if (!input.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    try {
      const row = await createEntity(body.kind, input);
      void logActivity({ entityType: "cms-entities", action: "created", summary: `Added ${body.kind} "${input.name}"` });
      revalidatePath(HUB_PATH[body.kind]);
      return NextResponse.json(row);
    } catch (e) {
      return NextResponse.json({ error: duplicateSlugMessage(e, "Create failed") }, { status: 400 });
    }
  }

  if (body.action === "update") {
    if (!isCrudKind(body.kind)) return NextResponse.json({ error: "Unsupported kind" }, { status: 400 });
    const { id, ...patch } = body as unknown as EntityInput & { id?: string };
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    try {
      const row = await updateEntity(body.kind, id, patch);
      void logActivity({ entityType: "cms-entities", entityId: id, action: "updated", summary: `Updated ${body.kind} "${patch.name ?? id}"` });
      revalidatePath(HUB_PATH[body.kind]);
      return NextResponse.json(row);
    } catch (e) {
      return NextResponse.json({ error: duplicateSlugMessage(e, "Update failed") }, { status: 400 });
    }
  }

  if (body.action === "delete") {
    if (!isCrudKind(body.kind)) return NextResponse.json({ error: "Unsupported kind" }, { status: 400 });
    const { id } = body as unknown as { id?: string };
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await deleteEntity(body.kind, id);
    void logActivity({ entityType: "cms-entities", entityId: id, action: "deleted", summary: `Deleted ${body.kind} entity` });
    revalidatePath(HUB_PATH[body.kind]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
});
