import type { EntityKind, PageType, Prisma, WorkflowStatus } from "@prisma/client";
import { z } from "zod";
import { prisma, withDbTimeout } from "@/lib/db";
import { parseBlocks, type CmsBlock } from "@/lib/cms/blocks";
import { slugify } from "@/lib/slug";
import { normalizePagePath, pagePathError, pathFor } from "@/lib/cms/paths";


export type PageWithSeo = Prisma.PageGetPayload<{
  include: { seo: true; brief: true };
}>;

function resolvePagePath(path: string): string {
  const normalized = normalizePagePath(path);
  const err = pagePathError(normalized);
  if (err) throw new Error(err);
  return normalized;
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
    include: { seo: true, brief: true },
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
      include: { seo: true, brief: true },
    }),
  );
}

export async function getPageByPathAnyStatus(path: string) {
  const normalized = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  return prisma.page.findUnique({
    where: { path: normalized },
    include: { seo: true, brief: true },
  });
}

export type UpsertPageInput = {
  title: string;
  slug: string;
  type: PageType;
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
    breadcrumbLabel?: string | null;
    ogImageUrl?: string | null;
    authorName?: string | null;
    jsonLdCustom?: Prisma.InputJsonValue | null;
  };
  brief?: {
    targetKeyword?: string | null;
    secondaryKeywords?: string[];
    searchIntent?: "INFORMATIONAL" | "NAVIGATIONAL" | "COMMERCIAL" | "TRANSACTIONAL" | null;
    targetAudience?: string | null;
    buyerStage?: "AWARENESS" | "CONSIDERATION" | "DECISION" | "RETENTION" | null;
  };
};

type SeoInput = NonNullable<UpsertPageInput["seo"]>;
type BriefInput = NonNullable<UpsertPageInput["brief"]>;

/** Drops `undefined` keys so partial updates only touch the fields the caller sent. */
function definedOnly<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function trimmedOrNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const t = value?.trim() ?? "";
  return t ? t : null;
}

/** Maps editor SEO input onto SeoMetadata columns. MongoDB has no JSON null, so a cleared custom
 *  JSON-LD value is stored as an empty array (treated as "none" by the renderer). */
function seoFields(seo: SeoInput) {
  return definedOnly({
    metaTitle: trimmedOrNull(seo.metaTitle),
    metaDescription: trimmedOrNull(seo.metaDescription),
    canonical: trimmedOrNull(seo.canonical),
    robotsIndex: seo.robotsIndex,
    robotsFollow: seo.robotsFollow,
    focusKeyword: trimmedOrNull(seo.focusKeyword),
    breadcrumbLabel: trimmedOrNull(seo.breadcrumbLabel),
    ogImageUrl: trimmedOrNull(seo.ogImageUrl),
    authorName: trimmedOrNull(seo.authorName),
    jsonLdCustom:
      seo.jsonLdCustom === undefined ? undefined : (seo.jsonLdCustom ?? ([] as Prisma.InputJsonValue)),
  });
}

function briefFields(brief: BriefInput) {
  return definedOnly({
    targetKeyword: trimmedOrNull(brief.targetKeyword),
    secondaryKeywords: brief.secondaryKeywords,
    searchIntent: brief.searchIntent,
    targetAudience: trimmedOrNull(brief.targetAudience),
    buyerStage: brief.buyerStage,
  });
}

const optionalText = (max: number) => z.string().max(max).nullish();
const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v) || v.startsWith("/"), {
    message: "Must be an absolute http(s) URL or a site-relative path",
  })
  .nullish();

/** Custom JSON-LD: accepts a JSON object/array, or a string containing one (from the editor textarea). */
const jsonLdInput = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.record(z.string(), z.unknown()))])
  .nullish()
  .transform((value, ctx) => {
    if (value == null) return value;
    if (typeof value !== "string") return value as Prisma.InputJsonValue;
    if (!value.trim()) return null;
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) return parsed as Prisma.InputJsonValue;
    } catch {
      /* fall through */
    }
    ctx.addIssue({ code: "custom", message: "Custom JSON-LD must be a valid JSON object or array" });
    return z.NEVER;
  });

export const seoInputSchema = z.object({
  metaTitle: optionalText(200),
  metaDescription: optionalText(500),
  canonical: optionalUrl,
  robotsIndex: z.boolean().optional(),
  robotsFollow: z.boolean().optional(),
  focusKeyword: optionalText(120),
  breadcrumbLabel: optionalText(120),
  ogImageUrl: optionalUrl,
  authorName: optionalText(120),
  jsonLdCustom: jsonLdInput,
});

export const briefInputSchema = z.object({
  targetKeyword: optionalText(120),
  secondaryKeywords: z.array(z.string().max(120)).max(50).optional(),
  searchIntent: z.enum(["INFORMATIONAL", "NAVIGATIONAL", "COMMERCIAL", "TRANSACTIONAL"]).nullish(),
  targetAudience: optionalText(500),
  buyerStage: z.enum(["AWARENESS", "CONSIDERATION", "DECISION", "RETENTION"]).nullish(),
});

export async function createPage(input: UpsertPageInput) {
  const slug = slugify(input.slug || input.title);
  const path = resolvePagePath(input.path || pathFor(input.type, slug));

  return prisma.page.create({
    data: {
      slug,
      path,
      title: input.title,
      type: input.type,
      status: input.status ?? "DRAFT",
      excerpt: input.excerpt ?? null,
      blocks: (input.blocks ?? []) as unknown as Prisma.InputJsonValue,
      primaryEntityKind: input.primaryEntityKind ?? null,
      primaryEntityId: input.primaryEntityId ?? null,
      seo: { create: { metaTitle: input.title, ...(input.seo ? seoFields(input.seo) : {}) } },
      brief: input.brief ? { create: briefFields(input.brief) } : undefined,
    },
    include: { seo: true, brief: true },
  });
}

export async function updatePage(id: string, input: Partial<UpsertPageInput>) {
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) return null;

  const slug = input.slug != null ? slugify(input.slug) : existing.slug;
  const type = input.type ?? existing.type;
  const path = input.path
    ? resolvePagePath(input.path)
    : input.slug || input.type
      ? resolvePagePath(pathFor(type, slug))
      : existing.path;

  const seo = input.seo ? seoFields(input.seo) : null;
  const brief = input.brief ? briefFields(input.brief) : null;

  return prisma.page.update({
    where: { id },
    data: {
      slug,
      path,
      type,
      ...definedOnly({
        title: input.title ?? undefined,
        status: input.status ?? undefined,
        excerpt: input.excerpt,
        primaryEntityKind: input.primaryEntityKind,
        primaryEntityId: input.primaryEntityId,
      }),
      ...(input.blocks ? { blocks: input.blocks as unknown as Prisma.InputJsonValue } : {}),
      ...(seo
        ? {
            seo: {
              upsert: {
                create: { metaTitle: input.title ?? existing.title, ...seo },
                update: seo,
              },
            },
          }
        : {}),
      ...(brief ? { brief: { upsert: { create: brief, update: brief } } } : {}),
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
