import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/with-admin";
import { jsonError } from "@/lib/api-response";
import { AUDIT_LEAD_STATUSES, updateAuditLeadStatus, type AuditLeadStatus } from "@/lib/audit-leads-content";
import { logActivity } from "@/lib/activity-log";

export const PATCH = withAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { leadStatus?: string };

  if (!AUDIT_LEAD_STATUSES.includes(body.leadStatus as AuditLeadStatus)) {
    return jsonError(400, "Invalid lead status.");
  }

  const lead = await updateAuditLeadStatus(id, body.leadStatus as AuditLeadStatus);
  void logActivity({
    entityType: "audit_lead",
    entityId: id,
    action: "updated",
    summary: `${lead.name} (${lead.companyName}) marked ${lead.leadStatus.replaceAll("_", " ")}`,
  });
  return NextResponse.json(lead);
});
