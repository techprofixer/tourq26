"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AUDIT_LEAD_STATUSES, type AuditLeadStatus } from "@/lib/audit-leads-content";

export function LeadStatusControl({ leadId, currentStatus }: { leadId: string; currentStatus: AuditLeadStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  const onChange = async (next: AuditLeadStatus) => {
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadStatus: next }),
      });
      if (res.ok) router.refresh();
      else setStatus(currentStatus);
    } catch {
      setStatus(currentStatus);
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={status}
      disabled={saving}
      onChange={(e) => onChange(e.target.value as AuditLeadStatus)}
      className="text-input min-h-[40px] w-[180px] text-[13.5px]"
    >
      {AUDIT_LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
