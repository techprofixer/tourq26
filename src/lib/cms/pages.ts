import type {
  EntityKind,
  PageOrigin,
  PageType,
  Prisma,
  WorkflowStatus,
} from "@prisma/client";
import { prisma, withDbTimeout } from "@/lib/db";
import { parseBlocks, type CmsBlock } from "@/lib/cms/blocks";

export type PageWithSeo = Prisma.PageGetPayload<{
  include: { seo: true; brief: true; entityLinks: true };
}>;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function pathFor(type: PageType, slug: string): string {
  const s = slugify(slug);
  switch (type) {
    case "HOME":
      return "/";
    case "SERVICE":
      return `/services/${s}`;
    case "SOLUTION":
      return `/solutions/${s}`;
    case "INDUSTRY":
      return `/industries/${s}`;
    case "TECHNOLOGY":
      return `/technologies/${s}`;
    case "LOCATION":
      return `/locations/${s}`;
    case "PRICING":
      return `/pricing/${s}`;
    case "CASE_STUDY":
      return `/case-studies/${s}`;
    case "BLOG":
      return `/blog/${s}`;
    case "COMPANY":
      return `/company/${s}`;
    case "CONTACT":
      return "/contact";
    case "GUIDE":
      return `/resources/guides/${s}`;
    case "COMPARISON":
      return `/compare/${s}`;
    case "GLOSSARY":
      return `/resources/glossary/${s}`;
    default:
      return `/${s}`;
  }
}

export async function listPages(opts?: {
  status?: WorkflowStatus;
  type?: PageType;
  take?: number;
}) {
  return prisma.page.findMany({
    where: {
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.type ? { type: opts.type } : {}),
    },
    include: { seo: true },
    orderBy: [{ updatedAt: "desc" }],
    take: opts?.take ?? 200,
  });
}

export async function getPageById(id: string) {
  return prisma.page.findUnique({
    where: { id },
    include: { seo: true, brief: true, entityLinks: true },
  });
}

export async function getPublishedPageByPath(path: string) {
  const normalized = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  return withDbTimeout(
    prisma.page.findFirst({
      where: {
        path: normalized,
        status: "PUBLISHED",
      },
      include: { seo: true, brief: true, entityLinks: true },
    }),
  );
}

export async function getPageByPathAnyStatus(path: string) {
  const normalized = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  return prisma.page.findUnique({
    where: { path: normalized },
    include: { seo: true, brief: true, entityLinks: true },
  });
}

export type UpsertPageInput = {
  title: string;
  slug: string;
  type: PageType;
  origin?: PageOrigin;
  status?: WorkflowStatus;
  path?: string;
  excerpt?: string | null;
  blocks?: CmsBlock[];
  primaryEntityKind?: EntityKind | null;
  primaryEntityId?: string | null;
  seo?: {
    metaTitle?: string | null;
    metaDescription?: string | null;
    canonical?: string | null;
    robotsIndex?: boolean;
    robotsFollow?: boolean;
    focusKeyword?: string | null;
    schemaKeys?: string[];
    breadcrumbLabel?: string | null;
  };
  brief?: {
    targetKeyword?: string | null;
    secondaryKeywords?: string[];
    searchIntent?: "INFORMATIONAL" | "NAVIGATIONAL" | "COMMERCIAL" | "TRANSACTIONAL" | null;
    targetAudience?: string | null;
    buyerStage?: "AWARENESS" | "CONSIDERATION" | "DECISION" | "RETENTION" | null;
  };
};

export async function createPage(input: UpsertPageInput) {
  const slug = slugify(input.slug || input.title);
  const path = input.path ?? pathFor(input.type, slug);
  const blocks = input.blocks ?? [];

  return prisma.page.create({
    data: {
      slug,
      path,
      title: input.title,
      type: input.type,
      origin: input.origin ?? "MANUAL",
      status: input.status ?? "DRAFT",
      excerpt: input.excerpt ?? null,
      blocks: blocks as unknown as Prisma.InputJsonValue,
      primaryEntityKind: input.primaryEntityKind ?? null,
      primaryEntityId: input.primaryEntityId ?? null,
      seo: input.seo
        ? {
            create: {
              metaTitle: input.seo.metaTitle ?? input.title,
              metaDescription: input.seo.metaDescription ?? null,
              canonical: input.seo.canonical ?? null,
              robotsIndex: input.seo.robotsIndex ?? true,
              robotsFollow: input.seo.robotsFollow ?? true,
              focusKeyword: input.seo.focusKeyword ?? null,
              schemaKeys: input.seo.schemaKeys ?? [],
              breadcrumbLabel: input.seo.breadcrumbLabel ?? null,
            },
          }
        : {
            create: {
              metaTitle: input.title,
              robotsIndex: true,
              robotsFollow: true,
            },
          },
      brief: input.brief
        ? {
            create: {
              targetKeyword: input.brief.targetKeyword ?? null,
              secondaryKeywords: input.brief.secondaryKeywords ?? [],
              searchIntent: input.brief.searchIntent ?? null,
              targetAudience: input.brief.targetAudience ?? null,
              buyerStage: input.brief.buyerStage ?? null,
            },
          }
        : undefined,
    },
    include: { seo: true, brief: true },
  });
}

export async function updatePage(id: string, input: Partial<UpsertPageInput> & { blocks?: CmsBlock[] }) {
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) return null;

  const slug = input.slug != null ? slugify(input.slug) : existing.slug;
  const type = input.type ?? existing.type;
  const path = input.path ?? (input.slug || input.type ? pathFor(type, slug) : existing.path);

  return prisma.page.update({
    where: { id },
    data: {
      ...(input.title != null ? { title: input.title } : {}),
      slug,
      path,
      type,
      ...(input.status != null ? { status: input.status } : {}),
      ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
      ...(input.blocks != null
        ? { blocks: input.blocks as unknown as Prisma.InputJsonValue }
        : {}),
      ...(input.primaryEntityKind !== undefined
        ? { primaryEntityKind: input.primaryEntityKind }
        : {}),
      ...(input.primaryEntityId !== undefined
        ? { primaryEntityId: input.primaryEntityId }
        : {}),
      ...(input.seo
        ? {
            seo: {
              upsert: {
                create: {
                  metaTitle: input.seo.metaTitle ?? input.title ?? existing.title,
                  metaDescription: input.seo.metaDescription ?? null,
                  canonical: input.seo.canonical ?? null,
                  robotsIndex: input.seo.robotsIndex ?? true,
                  robotsFollow: input.seo.robotsFollow ?? true,
                  focusKeyword: input.seo.focusKeyword ?? null,
                  schemaKeys: input.seo.schemaKeys ?? [],
                  breadcrumbLabel: input.seo.breadcrumbLabel ?? null,
                },
                update: {
                  ...(input.seo.metaTitle !== undefined
                    ? { metaTitle: input.seo.metaTitle }
                    : {}),
                  ...(input.seo.metaDescription !== undefined
                    ? { metaDescription: input.seo.metaDescription }
                    : {}),
                  ...(input.seo.canonical !== undefined
                    ? { canonical: input.seo.canonical }
                    : {}),
                  ...(input.seo.robotsIndex !== undefined
                    ? { robotsIndex: input.seo.robotsIndex }
                    : {}),
                  ...(input.seo.robotsFollow !== undefined
                    ? { robotsFollow: input.seo.robotsFollow }
                    : {}),
                  ...(input.seo.focusKeyword !== undefined
                    ? { focusKeyword: input.seo.focusKeyword }
                    : {}),
                  ...(input.seo.schemaKeys !== undefined
                    ? { schemaKeys: input.seo.schemaKeys }
                    : {}),
                  ...(input.seo.breadcrumbLabel !== undefined
                    ? { breadcrumbLabel: input.seo.breadcrumbLabel }
                    : {}),
                },
              },
            },
          }
        : {}),
      ...(input.brief
        ? {
            brief: {
              upsert: {
                create: {
                  targetKeyword: input.brief.targetKeyword ?? null,
                  secondaryKeywords: input.brief.secondaryKeywords ?? [],
                  searchIntent: input.brief.searchIntent ?? null,
                  targetAudience: input.brief.targetAudience ?? null,
                  buyerStage: input.brief.buyerStage ?? null,
                },
                update: {
                  ...(input.brief.targetKeyword !== undefined
                    ? { targetKeyword: input.brief.targetKeyword }
                    : {}),
                  ...(input.brief.secondaryKeywords !== undefined
                    ? { secondaryKeywords: input.brief.secondaryKeywords }
                    : {}),
                  ...(input.brief.searchIntent !== undefined
                    ? { searchIntent: input.brief.searchIntent }
                    : {}),
                  ...(input.brief.targetAudience !== undefined
                    ? { targetAudience: input.brief.targetAudience }
                    : {}),
                  ...(input.brief.buyerStage !== undefined
                    ? { buyerStage: input.brief.buyerStage }
                    : {}),
                },
              },
            },
          }
        : {}),
    },
    include: { seo: true, brief: true },
  });
}

export async function publishPage(id: string) {
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) return null;

  const page = await prisma.page.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      archivedAt: null,
    },
    include: { seo: true },
  });

  await prisma.workflowEvent.create({
    data: {
      pageId: id,
      fromStatus: existing.status,
      toStatus: "PUBLISHED",
      comment: "Published via admin",
    },
  });

  return page;
}

export async function transitionPage(
  id: string,
  toStatus: WorkflowStatus,
  comment?: string,
) {
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) return null;

  const page = await prisma.page.update({
    where: { id },
    data: {
      status: toStatus,
      ...(toStatus === "PUBLISHED"
        ? { publishedAt: new Date(), archivedAt: null }
        : {}),
      ...(toStatus === "ARCHIVED" ? { archivedAt: new Date() } : {}),
    },
    include: { seo: true },
  });

  await prisma.workflowEvent.create({
    data: {
      pageId: id,
      fromStatus: existing.status,
      toStatus,
      comment: comment ?? null,
    },
  });

  return page;
}

export function getPageBlocks(page: { blocks: unknown }): CmsBlock[] {
  return parseBlocks(page.blocks);
}
