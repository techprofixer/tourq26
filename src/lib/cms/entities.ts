import type { EntityKind, RelationType } from "@prisma/client";
import { prisma, withDbTimeout } from "@/lib/db";
import { slugify } from "@/lib/cms/pages";

export const ENTITY_KINDS = [
  "SERVICE",
  "SOLUTION",
  "INDUSTRY",
  "TECHNOLOGY",
  "LOCATION",
] as const satisfies readonly EntityKind[];

export type SeedEntity = {
  slug: string;
  name: string;
  summary?: string;
  category?: string;
  parentSlug?: string;
};

export const SEED_SERVICES: SeedEntity[] = [
  { slug: "software-development", name: "Software Development", summary: "End-to-end custom software delivery." },
  { slug: "custom-software-development", name: "Custom Software Development", parentSlug: "software-development" },
  { slug: "product-engineering", name: "Product Engineering" },
  { slug: "ai-development", name: "AI Development", summary: "Production AI systems and integrations." },
  { slug: "ai-consulting", name: "AI Consulting", parentSlug: "ai-development" },
  { slug: "ai-agent-development", name: "AI Agent Development", parentSlug: "ai-development" },
  { slug: "ai-automation", name: "AI Automation", parentSlug: "ai-development" },
  { slug: "saas-development", name: "SaaS Development" },
  { slug: "crm-development", name: "CRM Development" },
  { slug: "erp-development", name: "ERP Development" },
  { slug: "marketplace-development", name: "Marketplace Development" },
  { slug: "mobile-app-development", name: "Mobile App Development" },
  { slug: "web-application-development", name: "Web Application Development" },
  { slug: "cloud-consulting", name: "Cloud Consulting" },
  { slug: "devops", name: "DevOps" },
  { slug: "dedicated-development-team", name: "Dedicated Development Team" },
  { slug: "cto-as-a-service", name: "CTO as a Service" },
  { slug: "maintenance-and-support", name: "Maintenance & Support" },
];

export const SEED_SOLUTIONS: SeedEntity[] = [
  { slug: "build-crm", name: "Build CRM" },
  { slug: "build-erp", name: "Build ERP" },
  { slug: "build-marketplace", name: "Build Marketplace" },
  { slug: "build-inventory-software", name: "Build Inventory Software" },
  { slug: "build-pos", name: "Build POS" },
  { slug: "build-hrms", name: "Build HRMS" },
  { slug: "build-lms", name: "Build LMS" },
  { slug: "build-booking-platform", name: "Build Booking Platform" },
  { slug: "build-saas", name: "Build SaaS" },
  { slug: "build-ai-assistant", name: "Build AI Assistant" },
  { slug: "build-ai-chatbot", name: "Build AI Chatbot" },
  { slug: "build-ai-agent", name: "Build AI Agent" },
  { slug: "build-internal-tools", name: "Build Internal Tools" },
];

export const SEED_INDUSTRIES: SeedEntity[] = [
  { slug: "healthcare", name: "Healthcare" },
  { slug: "fintech", name: "Fintech" },
  { slug: "retail", name: "Retail" },
  { slug: "manufacturing", name: "Manufacturing" },
  { slug: "logistics", name: "Logistics" },
  { slug: "construction", name: "Construction" },
  { slug: "education", name: "Education" },
  { slug: "insurance", name: "Insurance" },
  { slug: "real-estate", name: "Real Estate" },
  { slug: "travel", name: "Travel" },
  { slug: "hospitality", name: "Hospitality" },
  { slug: "automotive", name: "Automotive" },
];

export const SEED_LOCATIONS: SeedEntity[] = [
  {
    slug: "software-development-company-india",
    name: "India",
    summary: "Software development delivered from India, for clients worldwide.",
  },
  {
    slug: "software-development-company-mumbai",
    name: "Mumbai",
    summary: "Torq Studio's home base — software development delivered from Mumbai.",
  },
  {
    slug: "software-development-company-ahmedabad",
    name: "Ahmedabad",
    summary: "Software development for Ahmedabad and Gujarat-based businesses.",
  },
];

export const SEED_TECHNOLOGIES: SeedEntity[] = [
  { slug: "react", name: "React", category: "Frontend" },
  { slug: "next-js", name: "Next.js", category: "Frontend" },
  { slug: "node-js", name: "Node.js", category: "Backend" },
  { slug: "nestjs", name: "NestJS", category: "Backend" },
  { slug: "python", name: "Python", category: "Backend" },
  { slug: "java", name: "Java", category: "Backend" },
  { slug: "dot-net", name: ".NET", category: "Backend" },
  { slug: "go", name: "Go", category: "Backend" },
  { slug: "flutter", name: "Flutter", category: "Mobile" },
  { slug: "react-native", name: "React Native", category: "Mobile" },
  { slug: "aws", name: "AWS", category: "Cloud" },
  { slug: "azure", name: "Azure", category: "Cloud" },
  { slug: "docker", name: "Docker", category: "DevOps" },
  { slug: "kubernetes", name: "Kubernetes", category: "DevOps" },
  { slug: "mongodb", name: "MongoDB", category: "Data" },
  { slug: "postgresql", name: "PostgreSQL", category: "Data" },
  { slug: "openai", name: "OpenAI", category: "AI" },
  { slug: "claude", name: "Claude", category: "AI" },
  { slug: "gemini", name: "Gemini", category: "AI" },
  { slug: "langchain", name: "LangChain", category: "AI" },
  { slug: "langgraph", name: "LangGraph", category: "AI" },
  { slug: "mcp", name: "MCP", category: "AI" },
];

export async function listEntities(kind: EntityKind) {
  switch (kind) {
    case "SERVICE":
      return withDbTimeout(prisma.service.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }));
    case "SOLUTION":
      return withDbTimeout(prisma.solution.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }));
    case "INDUSTRY":
      return withDbTimeout(prisma.industry.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }));
    case "TECHNOLOGY":
      return withDbTimeout(prisma.technology.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }));
    case "LOCATION":
      return withDbTimeout(prisma.location.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }));
    default:
      return [];
  }
}

type EntityDelegate = {
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  delete: (args: { where: { id: string } }) => Promise<unknown>;
};

type ManagedEntityKind = "SERVICE" | "SOLUTION" | "INDUSTRY" | "TECHNOLOGY" | "LOCATION";

function entityDelegate(kind: ManagedEntityKind): EntityDelegate {
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

export type EntityInput = {
  name: string;
  slug?: string;
  summary?: string | null;
  description?: string | null;
  icon?: string | null;
  category?: string | null;
  sortOrder?: number;
};

export async function createEntity(
  kind: ManagedEntityKind,
  input: EntityInput,
) {
  const slug = slugify(input.slug?.trim() || input.name);
  if (!slug) throw new Error("Name or slug is required");
  return entityDelegate(kind).create({
    data: {
      slug,
      name: input.name.trim(),
      summary: input.summary?.trim() || null,
      description: input.description?.trim() || null,
      icon: input.icon?.trim() || null,
      category: input.category?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateEntity(
  kind: ManagedEntityKind,
  id: string,
  input: Partial<EntityInput>,
) {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.slug !== undefined) data.slug = slugify(input.slug);
  if (input.summary !== undefined) data.summary = input.summary?.trim() || null;
  if (input.description !== undefined) data.description = input.description?.trim() || null;
  if (input.icon !== undefined) data.icon = input.icon?.trim() || null;
  if (input.category !== undefined) data.category = input.category?.trim() || null;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  return entityDelegate(kind).update({ where: { id }, data });
}

export async function deleteEntity(
  kind: ManagedEntityKind,
  id: string,
) {
  return entityDelegate(kind).delete({ where: { id } });
}

export async function upsertEntityRelation(input: {
  fromKind: EntityKind;
  fromId: string;
  toKind: EntityKind;
  toId: string;
  relationType?: RelationType;
  weight?: number;
}) {
  return prisma.entityRelation.upsert({
    where: {
      fromKind_fromId_toKind_toId_relationType: {
        fromKind: input.fromKind,
        fromId: input.fromId,
        toKind: input.toKind,
        toId: input.toId,
        relationType: input.relationType ?? "RELATED_TO",
      },
    },
    create: {
      fromKind: input.fromKind,
      fromId: input.fromId,
      toKind: input.toKind,
      toId: input.toId,
      relationType: input.relationType ?? "RELATED_TO",
      weight: input.weight ?? 1,
    },
    update: {
      weight: input.weight ?? 1,
    },
  });
}

export async function seedCmsEntities() {
  const serviceIds = new Map<string, string>();

  let order = 0;
  for (const s of SEED_SERVICES) {
    const row = await prisma.service.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        name: s.name,
        summary: s.summary ?? null,
        sortOrder: order++,
      },
      update: {
        name: s.name,
        summary: s.summary ?? null,
      },
    });
    serviceIds.set(s.slug, row.id);
  }

  for (const s of SEED_SERVICES) {
    if (!s.parentSlug) continue;
    const parentId = serviceIds.get(s.parentSlug);
    const id = serviceIds.get(s.slug);
    if (parentId && id) {
      await prisma.service.update({ where: { id }, data: { parentId } });
    }
  }

  order = 0;
  for (const s of SEED_SOLUTIONS) {
    await prisma.solution.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        name: s.name,
        summary: s.summary ?? null,
        sortOrder: order++,
      },
      update: { name: s.name, summary: s.summary ?? null },
    });
  }

  order = 0;
  for (const s of SEED_INDUSTRIES) {
    await prisma.industry.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        name: s.name,
        summary: s.summary ?? null,
        sortOrder: order++,
      },
      update: { name: s.name, summary: s.summary ?? null },
    });
  }

  order = 0;
  for (const s of SEED_TECHNOLOGIES) {
    await prisma.technology.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        name: s.name,
        summary: s.summary ?? null,
        category: s.category ?? null,
        sortOrder: order++,
      },
      update: {
        name: s.name,
        summary: s.summary ?? null,
        category: s.category ?? null,
      },
    });
  }

  order = 0;
  for (const s of SEED_LOCATIONS) {
    await prisma.location.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        name: s.name,
        summary: s.summary ?? null,
        sortOrder: order++,
      },
      update: { name: s.name, summary: s.summary ?? null },
    });
  }

  return {
    services: SEED_SERVICES.length,
    solutions: SEED_SOLUTIONS.length,
    industries: SEED_INDUSTRIES.length,
    technologies: SEED_TECHNOLOGIES.length,
    locations: SEED_LOCATIONS.length,
  };
}

export async function ensureEntityPage(kind: ManagedEntityKind, slug: string) {
  const normalized = slugify(slug);
  let entity:
    | { id: string; name: string; summary: string | null; pageId: string | null }
    | null = null;

  if (kind === "SERVICE") {
    entity = await prisma.service.findUnique({ where: { slug: normalized } });
  } else if (kind === "SOLUTION") {
    entity = await prisma.solution.findUnique({ where: { slug: normalized } });
  } else if (kind === "INDUSTRY") {
    entity = await prisma.industry.findUnique({ where: { slug: normalized } });
  } else if (kind === "LOCATION") {
    entity = await prisma.location.findUnique({ where: { slug: normalized } });
  } else {
    entity = await prisma.technology.findUnique({ where: { slug: normalized } });
  }

  if (!entity) return null;
  if (entity.pageId) {
    return prisma.page.findUnique({
      where: { id: entity.pageId },
      include: { seo: true },
    });
  }

  const { createPage, pathFor } = await import("@/lib/cms/pages");
  const pageType =
    kind === "SERVICE"
      ? "SERVICE"
      : kind === "SOLUTION"
        ? "SOLUTION"
        : kind === "INDUSTRY"
          ? "INDUSTRY"
          : kind === "LOCATION"
            ? "LOCATION"
            : "TECHNOLOGY";

  const page = await createPage({
    title: entity.name,
    slug: normalized,
    type: pageType,
    status: "DRAFT",
    path: pathFor(pageType, normalized),
    excerpt: entity.summary,
    primaryEntityKind: kind,
    primaryEntityId: entity.id,
    blocks: [
      {
        type: "hero",
        id: `blk_hero_${normalized}`,
        eyebrow: kind,
        heading: entity.name,
        subheading: entity.summary ?? undefined,
        primaryCtaLabel: "Book a consultation",
        primaryCtaHref: "/contact",
      },
      {
        type: "cta",
        id: `blk_cta_${normalized}`,
        heading: `Talk to Torq Studio about ${entity.name}`,
        primaryCtaLabel: "Contact us",
        primaryCtaHref: "/contact",
        dark: true,
      },
    ],
    seo: {
      metaTitle: `${entity.name} | Torq Studio`,
      metaDescription: entity.summary,
      schemaKeys: kind === "SERVICE" ? ["Service"] : [],
      focusKeyword: entity.name.toLowerCase(),
    },
    brief: {
      targetKeyword: entity.name.toLowerCase(),
      searchIntent: "COMMERCIAL",
      buyerStage: "CONSIDERATION",
    },
  });

  if (kind === "SERVICE") {
    await prisma.service.update({ where: { id: entity.id }, data: { pageId: page.id } });
  } else if (kind === "SOLUTION") {
    await prisma.solution.update({ where: { id: entity.id }, data: { pageId: page.id } });
  } else if (kind === "INDUSTRY") {
    await prisma.industry.update({ where: { id: entity.id }, data: { pageId: page.id } });
  } else if (kind === "LOCATION") {
    await prisma.location.update({ where: { id: entity.id }, data: { pageId: page.id } });
  } else {
    await prisma.technology.update({ where: { id: entity.id }, data: { pageId: page.id } });
  }

  await prisma.pageEntity.create({
    data: {
      pageId: page.id,
      entityKind: kind,
      entityId: entity.id,
      isPrimary: true,
    },
  });

  return page;
}
