import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readAuditLeadById } from "@/lib/audit-leads-content";
import {
  labelFor,
  BUSINESS_TYPE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  CURRENT_PROBLEM_OPTIONS,
  REQUESTED_SERVICE_OPTIONS,
  BUDGET_OPTIONS,
  TIMELINE_OPTIONS,
} from "@/lib/business-systems/options";
import { AdminPageHeader } from "../../AdminPageHeader";
import { LeadStatusControl } from "./LeadStatusControl";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-hairline py-2.5 last:border-0">
      <dt className="mono-label text-muted-foreground">{label}</dt>
      <dd className="text-right text-[14px] text-foreground">{value}</dd>
    </div>
  );
}

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const { id } = await params;
  const lead = await readAuditLeadById(id);
  if (!lead) notFound();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Leads", href: "/admin/leads" },
          { label: lead.name },
        ]}
        title={lead.name}
        description={`${lead.companyName} · Submitted ${formatDate(lead.createdAt)}`}
        actions={<LeadStatusControl leadId={lead.id} currentStatus={lead.leadStatus} />}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card-flat">
            <p className="mono-eyebrow text-muted-foreground">CONTACT</p>
            <dl className="mt-3">
              <InfoRow label="Name" value={lead.name} />
              <InfoRow label="Email" value={<a href={`mailto:${lead.email}`} className="underline underline-offset-2">{lead.email}</a>} />
              <InfoRow label="Phone / WhatsApp" value={lead.phone} />
              <InfoRow label="Company" value={lead.companyName} />
              {lead.website ? (
                <InfoRow
                  label="Website"
                  value={
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      {lead.website}
                    </a>
                  }
                />
              ) : null}
            </dl>
          </section>

          <section className="card-flat">
            <p className="mono-eyebrow text-muted-foreground">QUALIFICATION</p>
            <dl className="mt-3">
              <InfoRow label="Business type" value={labelFor(BUSINESS_TYPE_OPTIONS, lead.businessType)} />
              <InfoRow label="Team size" value={labelFor(TEAM_SIZE_OPTIONS, lead.teamSize)} />
              <InfoRow label="Budget" value={labelFor(BUDGET_OPTIONS, lead.budget)} />
              <InfoRow label="Timeline" value={labelFor(TIMELINE_OPTIONS, lead.timeline)} />
            </dl>
            <div className="mt-4">
              <p className="mono-label text-muted-foreground">CURRENT PROBLEMS</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {lead.currentProblems.map((p) => (
                  <li key={p} className="rounded-full border border-hairline px-3 py-1 text-[13px] text-foreground/90">
                    {labelFor(CURRENT_PROBLEM_OPTIONS, p)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <p className="mono-label text-muted-foreground">REQUESTED SERVICES</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {lead.requestedServices.map((s) => (
                  <li key={s} className="rounded-full border border-hairline px-3 py-1 text-[13px] text-foreground/90">
                    {labelFor(REQUESTED_SERVICE_OPTIONS, s)}
                  </li>
                ))}
              </ul>
            </div>
            {lead.message ? (
              <div className="mt-4">
                <p className="mono-label text-muted-foreground">BIGGEST OPERATIONAL PROBLEM</p>
                <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90">{lead.message}</p>
              </div>
            ) : null}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card-flat">
            <p className="mono-eyebrow text-muted-foreground">SCORE</p>
            <p className="display-lg mt-2 text-foreground">
              {lead.leadScore} <span className="text-muted-foreground">· {lead.leadCategory}</span>
            </p>
          </section>

          <section className="card-flat">
            <p className="mono-eyebrow text-muted-foreground">ATTRIBUTION</p>
            <dl className="mt-3">
              <InfoRow label="Source" value={lead.source || "—"} />
              <InfoRow label="Medium" value={lead.medium || "—"} />
              <InfoRow label="Campaign" value={lead.campaign || "—"} />
              <InfoRow label="Content" value={lead.content || "—"} />
              <InfoRow label="Landing page" value={lead.landingPage || "—"} />
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
