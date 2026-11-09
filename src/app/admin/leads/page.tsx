import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readAuditLeads, AUDIT_LEAD_STATUSES, type AuditLeadStatus } from "@/lib/audit-leads-content";
import type { LeadCategory } from "@/lib/business-systems/scoring";
import { AdminPageHeader } from "../AdminPageHeader";
import { AuditLeadFiltersBar } from "./AuditLeadFiltersBar";
import { AuditLeadTable } from "./AuditLeadTable";

type SearchParams = Promise<{
  status?: string;
  category?: string;
  budget?: string;
  timeline?: string;
  service?: string;
  source?: string;
  from?: string;
  to?: string;
}>;

const LEAD_CATEGORIES: LeadCategory[] = ["LOW", "MEDIUM", "HIGH", "HOT"];

export default async function AdminLeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const params = await searchParams;
  const status = AUDIT_LEAD_STATUSES.includes(params.status as AuditLeadStatus)
    ? (params.status as AuditLeadStatus)
    : undefined;
  const category = LEAD_CATEGORIES.includes(params.category as LeadCategory)
    ? (params.category as LeadCategory)
    : undefined;

  const leads = await readAuditLeads({
    status,
    leadCategory: category,
    budget: params.budget || undefined,
    timeline: params.timeline || undefined,
    service: params.service || undefined,
    source: params.source || undefined,
    from: params.from || undefined,
    to: params.to || undefined,
  });

  return (
    <div>
      <AdminPageHeader
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Leads" }]}
        title="Business Systems leads"
        description="Qualification submissions from /business-systems/audit. Newest first."
      />
      <div className="mt-8">
        <AuditLeadFiltersBar
          current={{
            status: params.status ?? "",
            category: params.category ?? "",
            budget: params.budget ?? "",
            timeline: params.timeline ?? "",
            service: params.service ?? "",
            source: params.source ?? "",
            from: params.from ?? "",
            to: params.to ?? "",
          }}
        />
      </div>
      <div className="mt-6">
        {leads.length === 0 ? (
          <p className="text-muted-foreground">No leads match these filters.</p>
        ) : (
          <AuditLeadTable leads={leads} />
        )}
      </div>
    </div>
  );
}
