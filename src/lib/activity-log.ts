import { prisma } from "@/lib/db";

export type ActivityAction = "created" | "updated" | "deleted" | "published";

export type ActivityLogEntry = {
  id: string;
  entityType: string;
  entityId: string | null;
  action: ActivityAction;
  summary: string;
  createdAt: string;
};

/**
 * Fire-and-forget activity log write. Never throws — a logging failure must
 * never fail the save it's describing. Callers use `void logActivity(...)`.
 */
export async function logActivity(params: {
  entityType: string;
  entityId?: string;
  action: ActivityAction;
  summary: string;
}): Promise<void> {
  try {
    await prisma.activityLogEntry.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        summary: params.summary,
      },
    });
  } catch {
    /* noop — logging must never break the caller's actual save */
  }
}

export async function listRecentActivity(limit = 200): Promise<ActivityLogEntry[]> {
  try {
    const rows = await prisma.activityLogEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action as ActivityAction,
      summary: r.summary,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}
