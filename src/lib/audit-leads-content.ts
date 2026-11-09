import { prisma, withDbTimeout } from "@/lib/db";
import { computeLeadScore, categorizeLeadScore, type LeadCategory } from "@/lib/business-systems/scoring";
import type { Budget, TeamSize, Timeline } from "@/lib/business-systems/options";

export type AuditLeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "CALL_SCHEDULED"
  | "CALL_COMPLETED"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export const AUDIT_LEAD_STATUSES: AuditLeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CALL_SCHEDULED",
  "CALL_COMPLETED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export type AuditLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  website: string;
  businessType: string;
  teamSize: string;
  currentProblems: string[];
  requestedServices: string[];
  budget: string;
  timeline: string;
  message: string;

  leadScore: number;
  leadCategory: LeadCategory;
  leadStatus: AuditLeadStatus;

  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  landingPage: string;

  createdAt: string;
  updatedAt: string;
};

type AuditLeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  website: string | null;
  businessType: string;
  teamSize: string;
  currentProblems: string[];
  requestedServices: string[];
  budget: string;
  timeline: string;
  message: string | null;
  leadScore: number;
  leadStatus: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  landingPage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toAuditLead(row: AuditLeadRow): AuditLead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    companyName: row.companyName,
    website: row.website ?? "",
    businessType: row.businessType,
    teamSize: row.teamSize,
    currentProblems: row.currentProblems,
    requestedServices: row.requestedServices,
    budget: row.budget,
    timeline: row.timeline,
    message: row.message ?? "",
    leadScore: row.leadScore,
    leadCategory: categorizeLeadScore(row.leadScore),
    leadStatus: row.leadStatus as AuditLeadStatus,
    source: row.source ?? "",
    medium: row.medium ?? "",
    campaign: row.campaign ?? "",
    term: row.term ?? "",
    content: row.content ?? "",
    landingPage: row.landingPage ?? "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type AuditLeadFilters = {
  status?: AuditLeadStatus;
  leadCategory?: LeadCategory;
  budget?: string;
  timeline?: string;
  service?: string;
  source?: string;
  from?: string; // ISO date (inclusive)
  to?: string; // ISO date (inclusive)
};

const CATEGORY_SCORE_RANGES: Record<LeadCategory, { gte: number; lte?: number }> = {
  LOW: { gte: 0, lte: 20 },
  MEDIUM: { gte: 21, lte: 40 },
  HIGH: { gte: 41, lte: 60 },
  HOT: { gte: 61 },
};

export async function readAuditLeads(filters: AuditLeadFilters = {}): Promise<AuditLead[]> {
  try {
    const where: Record<string, unknown> = {};
    if (filters.status) where.leadStatus = filters.status;
    if (filters.budget) where.budget = filters.budget;
    if (filters.timeline) where.timeline = filters.timeline;
    if (filters.service) where.requestedServices = { has: filters.service };
    if (filters.source) where.source = filters.source;
    if (filters.leadCategory) {
      const range = CATEGORY_SCORE_RANGES[filters.leadCategory];
      where.leadScore = { gte: range.gte, ...(range.lte !== undefined ? { lte: range.lte } : {}) };
    }
    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }

    const rows = await withDbTimeout(
      prisma.auditLead.findMany({ where, orderBy: { createdAt: "desc" } }),
    );
    return rows.map(toAuditLead);
  } catch {
    return [];
  }
}

export async function readAuditLeadById(id: string): Promise<AuditLead | null> {
  try {
    const row = await withDbTimeout(prisma.auditLead.findUnique({ where: { id } }));
    return row ? toAuditLead(row) : null;
  } catch {
    return null;
  }
}

export async function countNewAuditLeads(): Promise<number> {
  try {
    return await withDbTimeout(prisma.auditLead.count({ where: { leadStatus: "NEW" } }));
  } catch {
    return 0;
  }
}

/** Same email OR phone within the last 24h — used to silently drop resubmits without a DB write. */
export async function findRecentDuplicateAuditLead(email: string, phone: string): Promise<boolean> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await withDbTimeout(
      prisma.auditLead.findFirst({
        where: {
          createdAt: { gte: since },
          OR: [{ email }, { phone }],
        },
        select: { id: true },
      }),
    );
    return Boolean(existing);
  } catch {
    return false;
  }
}

export async function createAuditLead(input: {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  website?: string;
  businessType: string;
  teamSize: TeamSize;
  currentProblems: string[];
  requestedServices: string[];
  budget: Budget;
  timeline: Timeline;
  message?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  landingPage?: string;
}): Promise<AuditLead> {
  const leadScore = computeLeadScore({
    budget: input.budget,
    timeline: input.timeline,
    teamSize: input.teamSize,
  });

  const row = await prisma.auditLead.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      companyName: input.companyName,
      website: input.website || null,
      businessType: input.businessType,
      teamSize: input.teamSize,
      currentProblems: input.currentProblems,
      requestedServices: input.requestedServices,
      budget: input.budget,
      timeline: input.timeline,
      message: input.message || null,
      leadScore,
      source: input.source || null,
      medium: input.medium || null,
      campaign: input.campaign || null,
      term: input.term || null,
      content: input.content || null,
      landingPage: input.landingPage || null,
    },
  });
  return toAuditLead(row);
}

export async function updateAuditLeadStatus(id: string, status: AuditLeadStatus): Promise<AuditLead> {
  const row = await prisma.auditLead.update({
    where: { id },
    data: { leadStatus: status },
  });
  return toAuditLead(row);
}
