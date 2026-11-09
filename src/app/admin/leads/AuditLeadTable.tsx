import Link from "next/link";
import type { AuditLead } from "@/lib/audit-leads-content";
import { labelFor, BUDGET_OPTIONS, TIMELINE_OPTIONS } from "@/lib/business-systems/options";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

const CATEGORY_COLOR: Record<string, string> = {
  HOT: "var(--app-destructive)",
  HIGH: "var(--app-primary)",
  MEDIUM: "var(--app-muted-fg)",
  LOW: "var(--app-hairline)",
};

export function AuditLeadTable({ leads }: { leads: AuditLead[] }) {
  return (
    <div className="overflow-x-auto rounded-[4px] border border-hairline">
      <table className="w-full min-w-[840px] text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-hairline bg-muted/30 text-muted-foreground">
            <th className="px-4 py-3 font-normal">Lead</th>
            <th className="px-4 py-3 font-normal">Company</th>
            <th className="px-4 py-3 font-normal">Score</th>
            <th className="px-4 py-3 font-normal">Status</th>
            <th className="px-4 py-3 font-normal">Budget</th>
            <th className="px-4 py-3 font-normal">Timeline</th>
            <th className="px-4 py-3 font-normal">Source</th>
            <th className="px-4 py-3 font-normal">Date</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-hairline last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3">
                <Link href={`/admin/leads/${lead.id}`} className="font-medium text-foreground underline-offset-2 hover:underline">
                  {lead.name}
                </Link>
                <p className="text-muted-foreground">{lead.email}</p>
              </td>
              <td className="px-4 py-3 text-foreground/90">{lead.companyName}</td>
              <td className="px-4 py-3">
                <span
                  className="mono-label rounded-full px-2 py-0.5"
                  style={{ color: CATEGORY_COLOR[lead.leadCategory], border: `1px solid ${CATEGORY_COLOR[lead.leadCategory]}` }}
                >
                  {lead.leadScore} · {lead.leadCategory}
                </span>
              </td>
              <td className="px-4 py-3 text-foreground/90">{lead.leadStatus.replaceAll("_", " ")}</td>
              <td className="px-4 py-3 text-foreground/90">{labelFor(BUDGET_OPTIONS, lead.budget)}</td>
              <td className="px-4 py-3 text-foreground/90">{labelFor(TIMELINE_OPTIONS, lead.timeline)}</td>
              <td className="px-4 py-3 text-foreground/90">{lead.source || "—"}</td>
              <td className="px-4 py-3 whitespace-nowrap font-mono text-[12px] text-muted-foreground">
                {formatDate(lead.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
