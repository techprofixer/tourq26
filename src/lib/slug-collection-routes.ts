import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { jsonError } from "@/lib/api-response";
import { slugify } from "@/lib/slug";
import { logActivity } from "@/lib/activity-log";
import { submitToIndexNow } from "@/lib/indexnow";

type SlugItem = { slug: string; title: string; status?: string };
type SlugParams = { params: Promise<{ slug: string }> };

export type SlugCollectionConfig<T extends SlugItem> = {
  read: () => Promise<T[]>;
  write: (items: T[]) => Promise<void>;
  /** Turns an untrusted request body into an item (minus final slug); `prev` is set on update. */
  normalise: (raw: Record<string, unknown>, prev?: T) => Omit<T, "slug"> & { slug?: string };
  /** Activity-log entity type, e.g. "blog". */
  entityType: string;
  /** Human label used in activity summaries, e.g. "blog post". */
  label: string;
  /** Public listing path, e.g. "/blog"; item pages are `${publicBase}/${slug}`. */
  publicBase: string;
  /** Prefix for the fallback slug when neither slug nor title yields one. */
  fallbackSlugPrefix: string;
  /** Extra paths to revalidate on every change (e.g. "/" when items appear on the home page). */
  alsoRevalidate?: string[];
};

/**
 * Admin CRUD handlers for slug-keyed content collections (blog, tech news, case studies).
 * `collection` serves `/api/admin/content/<kind>`; `item` serves `/api/admin/content/<kind>/[slug]`.
 */
export function createSlugCollectionRoutes<T extends SlugItem>(cfg: SlugCollectionConfig<T>) {
  /** Revalidates affected pages + discovery files. `ping` submits the item URLs to IndexNow —
   *  skipped for edits to drafts, which never had a public URL. */
  const revalidate = (slugs: string[], ping = true) => {
    for (const p of cfg.alsoRevalidate ?? []) revalidatePath(p);
    revalidatePath(cfg.publicBase);
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms.txt");
    revalidatePath("/llms-full.txt");
    const itemPaths = Array.from(new Set(slugs)).map((s) => `${cfg.publicBase}/${s}`);
    for (const p of itemPaths) revalidatePath(p);
    if (ping) void submitToIndexNow([...itemPaths, cfg.publicBase]);
  };
  const isPublic = (item: SlugItem) => (item.status ?? "published") === "published";

  const readBody = async (request: NextRequest): Promise<Record<string, unknown> | null> => {
    const body = await request.json().catch(() => null);
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  };

  const hasTitle = (title: string) => Boolean(title.trim()) && title !== "Untitled";

  const collection = {
    GET: withAdmin(async () => NextResponse.json(await cfg.read())),

    POST: withAdmin(async (request: NextRequest) => {
      const raw = await readBody(request);
      if (!raw) return jsonError(400, "Invalid JSON body");
      const candidate = cfg.normalise(raw);
      if (!hasTitle(candidate.title)) return jsonError(400, "Title is required");

      const items = await cfg.read();
      const slug = candidate.slug || slugify(candidate.title) || `${cfg.fallbackSlugPrefix}-${Date.now()}`;
      if (items.some((i) => i.slug === slug)) return jsonError(400, "Slug already exists");

      const created = { ...candidate, slug } as T;
      await cfg.write([...items, created]);
      void logActivity({
        entityType: cfg.entityType,
        entityId: slug,
        action: "created",
        summary: `Created ${cfg.label} "${created.title}"`,
      });
      revalidate([slug], isPublic(created));
      return NextResponse.json(created);
    }),
  };

  const item = {
    GET: withAdmin(async (_request: NextRequest, { params }: SlugParams) => {
      const { slug } = await params;
      const found = (await cfg.read()).find((i) => i.slug === slug);
      return found ? NextResponse.json(found) : jsonError(404, "Not found");
    }),

    PUT: withAdmin(async (request: NextRequest, { params }: SlugParams) => {
      const { slug } = await params;
      const items = await cfg.read();
      const index = items.findIndex((i) => i.slug === slug);
      if (index === -1) return jsonError(404, "Not found");

      const raw = await readBody(request);
      if (!raw) return jsonError(400, "Invalid JSON body");
      const prev = items[index];
      const candidate = cfg.normalise(raw, prev);
      if (!hasTitle(candidate.title)) return jsonError(400, "Title is required");

      const nextSlug = candidate.slug || slugify(candidate.title) || prev.slug;
      if (nextSlug !== slug && items.some((i) => i.slug === nextSlug)) {
        return jsonError(400, "Slug already exists");
      }

      const updated = { ...candidate, slug: nextSlug } as T;
      items[index] = updated;
      await cfg.write(items);
      void logActivity({
        entityType: cfg.entityType,
        entityId: nextSlug,
        action: updated.status === "published" ? "published" : "updated",
        summary: `Updated ${cfg.label} "${updated.title}"`,
      });
      // Ping when the item is (or was) public: covers publish, edit-while-live, and unpublish.
      revalidate([nextSlug, slug], isPublic(updated) || isPublic(prev));
      return NextResponse.json(updated);
    }),

    DELETE: withAdmin(async (_request: NextRequest, { params }: SlugParams) => {
      const { slug } = await params;
      const items = await cfg.read();
      const removed = items.find((i) => i.slug === slug);
      if (!removed) return jsonError(404, "Not found");
      const remaining = items.filter((i) => i.slug !== slug);
      await cfg.write(remaining);
      void logActivity({
        entityType: cfg.entityType,
        entityId: slug,
        action: "deleted",
        summary: `Deleted ${cfg.label} "${slug}"`,
      });
      revalidate([slug], isPublic(removed));
      return NextResponse.json({ ok: true });
    }),
  };

  return { collection, item };
}
