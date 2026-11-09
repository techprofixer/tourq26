"use client";

import { useRouter, usePathname } from "next/navigation";
import { AUDIT_LEAD_STATUSES } from "@/lib/audit-leads-content";
import { BUDGET_OPTIONS, TIMELINE_OPTIONS, REQUESTED_SERVICE_OPTIONS } from "@/lib/business-systems/options";

type Filters = {
  status: string;
  category: string;
  budget: string;
  timeline: string;
  service: string;
  source: string;
  from: string;
  to: string;
};

const CATEGORIES = ["LOW", "MEDIUM", "HIGH", "HOT"];

export function AuditLeadFiltersBar({ current }: { current: Filters }) {
  const router = useRouter();
  const pathname = usePathname();

  const update = (key: keyof Filters, value: string) => {
    const next = { ...current, [key]: value };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select label="Status" value={current.status} onChange={(v) => update("status", v)}>
        <option value="">All</option>
        {AUDIT_LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll("_", " ")}
          </option>
        ))}
      </Select>
      <Select label="Score" value={current.category} onChange={(v) => update("category", v)}>
        <option value="">All</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <Select label="Budget" value={current.budget} onChange={(v) => update("budget", v)}>
        <option value="">All</option>
        {BUDGET_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <Select label="Timeline" value={current.timeline} onChange={(v) => update("timeline", v)}>
        <option value="">All</option>
        {TIMELINE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <Select label="Service" value={current.service} onChange={(v) => update("service", v)}>
        <option value="">All</option>
        {REQUESTED_SERVICE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <TextInput label="Source" value={current.source} onChange={(v) => update("source", v)} placeholder="facebook" />
      <TextInput label="From" type="date" value={current.from} onChange={(v) => update("from", v)} />
      <TextInput label="To" type="date" value={current.to} onChange={(v) => update("to", v)} />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="mono-label text-muted-foreground">{label.toUpperCase()}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-input min-h-[42px] w-[150px] text-[13.5px]"
      >
        {children}
      </select>
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="mono-label text-muted-foreground">{label.toUpperCase()}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="text-input min-h-[42px] w-[150px] text-[13.5px]"
      />
    </label>
  );
}
