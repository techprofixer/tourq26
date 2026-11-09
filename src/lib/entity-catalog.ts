import { prisma, withDbTimeout } from "@/lib/db";
import { servicePages } from "@/data/services-content";

export type EntityCatalogKind = "SERVICE" | "SOLUTION" | "INDUSTRY" | "TECHNOLOGY" | "LOCATION";

export type EntityCatalogCard = {
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  category: string | null;
};

export const ENTITY_HUB_PATH: Record<EntityCatalogKind, string> = {
  SERVICE: "/services",
  SOLUTION: "/solutions",
  INDUSTRY: "/industries",
  TECHNOLOGY: "/technologies",
  LOCATION: "/locations",
};

const FALLBACK_ICON: Record<string, string> = {
  "mobile-app-development": "/images/icons/mobile.svg",
  "web-development": "/images/icons/web.svg",
  "ai-solutions": "/images/icons/ai.svg",
  "remote-it": "/images/icons/team.svg",
  "technical-consulting": "/images/icons/web.svg",
};

const FALLBACK_CATEGORY: Record<string, string> = {
  "mobile-app-development": "MOBILE",
  "web-development": "WEB / API",
  "ai-solutions": "AI",
  "remote-it": "REMOTE IT",
  "technical-consulting": "CONSULTING",
};

function staticServiceCatalog(): EntityCatalogCard[] {
  return servicePages.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    icon: FALLBACK_ICON[p.slug] ?? null,
    category: FALLBACK_CATEGORY[p.slug] ?? null,
  }));
}

type EntityRow = {
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  icon: string | null;
  category: string | null;
  pageId: string | null;
};

type EntityDelegate = {
  findMany: (args: {
    where: { isActive: boolean };
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }];
  }) => Promise<EntityRow[]>;
};

function entityDelegate(kind: EntityCatalogKind): EntityDelegate {
  switch (kind) {
    case "SERVICE":
      return prisma.service as unknown as EntityDelegate;
    case "SOLUTION":
      return prisma.solution as unknown as EntityDelegate;
    case "INDUSTRY":
      return prisma.industry as unknown as EntityDelegate;
    case "TECHNOLOGY":
      return prisma.technology as unknown as EntityDelegate;
    case "LOCATION":
      return prisma.location as unknown as EntityDelegate;
  }
}

/**
 * Cards for a hub/index page (/services, /solutions, /industries, /technologies).
 * Prefers the entity table (Admin → CMS → Entities) so newly added/published entries show up
 * automatically, but only lists entities that actually resolve to a page — either a published
 * CMS page or (for SERVICE only) a legacy static fallback slug — so nothing links to a 404.
 * Falls back to the static service catalog entirely if no SERVICE entity resolves, or returns
 * an empty list for the other kinds if the DB is unavailable or nothing is published yet.
 */
export async function getEntityCatalogCards(kind: EntityCatalogKind): Promise<EntityCatalogCard[]> {
  try {
    const rows = await withDbTimeout(
      entityDelegate(kind).findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
    );
    if (rows.length === 0) return kind === "SERVICE" ? staticServiceCatalog() : [];

    const pageIds = rows.map((r) => r.pageId).filter((id): id is string => Boolean(id));
    const publishedPages = pageIds.length
      ? await withDbTimeout(
          prisma.page.findMany({
            where: { id: { in: pageIds }, status: "PUBLISHED" },
            select: { id: true },
          }),
        )
      : [];
    const publishedPageIds = new Set(publishedPages.map((p) => p.id));
    const staticSlugs = kind === "SERVICE" ? new Set(servicePages.map((p) => p.slug)) : new Set<string>();

    const cards: EntityCatalogCard[] = rows
      .filter((r) => (r.pageId && publishedPageIds.has(r.pageId)) || staticSlugs.has(r.slug))
      .map((r) => ({
        slug: r.slug,
        title: r.name,
        description: r.summary || r.description || "",
        icon: r.icon || FALLBACK_ICON[r.slug] || null,
        category: r.category || FALLBACK_CATEGORY[r.slug] || null,
      }));

    if (cards.length > 0) return cards;
    return kind === "SERVICE" ? staticServiceCatalog() : [];
  } catch {
    return kind === "SERVICE" ? staticServiceCatalog() : [];
  }
}
