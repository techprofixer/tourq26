"use client";

import { useState } from "react";
import DemoCta from "./DemoCta";
import {
  ChecklistIcon,
  ContactCardIcon,
  TicketIcon,
  TrendingUpIcon,
  WalletIcon,
} from "./icons";

/**
 * Interactive "Platform Modules" band — a tab rail that swaps both the copy
 * and a stylized dashboard-panel mockup on the right. Every panel is an
 * illustrative UI mock (fictional names/numbers), matching the hero mockup's
 * convention — never a claim about real customer data.
 */

type Tone = "orange" | "mint" | "white";

const TONE_CLASSES: Record<Tone, string> = {
  orange: "border-[var(--brand-orange)]/40 text-[var(--brand-orange)]",
  mint: "border-[var(--brand-mint)]/50 text-[var(--brand-mint)]",
  white: "border-white/20 text-white/60",
};

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`mono-label shrink-0 rounded-full border px-2 py-1 text-[9px] ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}

function Row({
  title,
  subtitle,
  tone,
  tag,
}: {
  title: string;
  subtitle: string;
  tone: Tone;
  tag: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[4px] border border-white/10 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] text-white/80">{title}</p>
        <p className="mono-label mt-1 truncate text-white/35">{subtitle}</p>
      </div>
      <Chip tone={tone}>{tag}</Chip>
    </div>
  );
}

const TABS = [
  {
    key: "overview",
    label: "Overview",
    Icon: TrendingUpIcon,
    path: "torqos.app/overview",
    headline: "One dashboard for the whole business.",
    body: "Revenue, orders, and pipeline in one place — every team looks at the same live numbers instead of a spreadsheet someone updated last week.",
    panel: (
      <div className="space-y-3 p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "REVENUE", value: "$148,320" },
            { label: "OPEN DEALS", value: "37" },
            { label: "CONV. RATE", value: "3.4%" },
          ].map((s) => (
            <div key={s.label} className="rounded-[4px] border border-white/10 p-2.5 sm:p-3">
              <p className="mono-label text-[9px] text-white/35 sm:text-[10px]">{s.label}</p>
              <p className="mt-2 text-[15px] font-medium text-white sm:text-[17px]">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Row title="Meridian Logistics" subtitle="New lead · assigned to Sara" tone="orange" tag="NEW" />
          <Row title="Quotation #1188" subtitle="Sent to Acme Retail Group" tone="mint" tag="SENT" />
          <Row title="Job #341 — Pump Service" subtitle="Closed by field team" tone="white" tag="DONE" />
        </div>
      </div>
    ),
  },
  {
    key: "jobs",
    label: "Job Management",
    Icon: ChecklistIcon,
    path: "torqos.app/jobs",
    headline: "Every job tracked from assignment to sign-off.",
    body: "Dispatch, track, and close jobs with full visibility for schedulers, technicians, and customers — no more status updates over the phone.",
    panel: (
      <div className="space-y-2 p-3 sm:p-4">
        <Row title="#3021 — AC Installation" subtitle="Technician: R. Fernandez" tone="orange" tag="IN PROGRESS" />
        <Row title="#3020 — Generator Service" subtitle="Technician: D. Okafor" tone="mint" tag="SCHEDULED" />
        <Row title="#3018 — Pipe Repair" subtitle="Technician: A. Haddad" tone="white" tag="DONE" />
        <Row title="#3017 — Site Inspection" subtitle="Technician: Unassigned" tone="orange" tag="PENDING" />
      </div>
    ),
  },
  {
    key: "crm",
    label: "CRM",
    Icon: ContactCardIcon,
    path: "torqos.app/crm",
    headline: "Every lead and deal, in one shared pipeline.",
    body: "No more leads sitting in someone's inbox. Every conversation, quote, and deal stage is visible to the whole team, in real time.",
    panel: (
      <div className="space-y-2 p-3 sm:p-4">
        <Row title="Northbay Distributors" subtitle="$18,400 · Proposal sent" tone="orange" tag="QUALIFIED" />
        <Row title="Vantage Property Group" subtitle="$9,200 · Follow-up due" tone="mint" tag="NEGOTIATION" />
        <Row title="Acme Retail Group" subtitle="$24,000 · Contract signed" tone="white" tag="WON" />
      </div>
    ),
  },
  {
    key: "finance",
    label: "Finance",
    Icon: WalletIcon,
    path: "torqos.app/finance",
    headline: "Real-time visibility into revenue and cash flow.",
    body: "Invoices, costs, and margins update the moment a job closes — so finance stops waiting on the rest of the business to send numbers over.",
    panel: (
      <div className="space-y-2 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {[
            { label: "COLLECTED", value: "$92,140" },
            { label: "OUTSTANDING", value: "$14,900" },
          ].map((s) => (
            <div key={s.label} className="rounded-[4px] border border-white/10 p-2.5 sm:p-3">
              <p className="mono-label text-[9px] text-white/35 sm:text-[10px]">{s.label}</p>
              <p className="mt-2 text-[15px] font-medium text-white sm:text-[17px]">{s.value}</p>
            </div>
          ))}
        </div>
        <Row title="Invoice #INV-2291" subtitle="Meridian Logistics" tone="mint" tag="PAID" />
        <Row title="Invoice #INV-2294" subtitle="Vantage Property Group" tone="orange" tag="DUE IN 3 DAYS" />
      </div>
    ),
  },
  {
    key: "tickets",
    label: "Ticket Manager",
    Icon: TicketIcon,
    path: "torqos.app/tickets",
    headline: "Support tickets, logged and resolved end to end.",
    body: "Every customer issue gets tracked from first message to resolution — with the same visibility your ops and CRM teams already have.",
    panel: (
      <div className="space-y-2 p-3 sm:p-4">
        <Row title="#T-514 — Delayed delivery" subtitle="Northbay Distributors" tone="orange" tag="HIGH" />
        <Row title="#T-512 — Invoice question" subtitle="Acme Retail Group" tone="white" tag="LOW" />
        <Row title="#T-509 — Warranty claim" subtitle="Vantage Property Group" tone="mint" tag="RESOLVED" />
      </div>
    ),
  },
] as const;

export default function PlatformExplorer() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <div className="mt-8">
      <div
        role="tablist"
        aria-label="Platform modules"
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto border-b border-white/10 pb-px sm:gap-8"
      >
        {TABS.map((t, i) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`mono-label flex shrink-0 snap-start items-center gap-2 border-b-2 px-0.5 pb-4 transition-colors ${
              i === active
                ? "border-white text-white"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            <t.Icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="lg:col-span-5">
          <h3 className="display-lg max-w-md text-white">{tab.headline}</h3>
          <p className="mt-5 max-w-md text-[15px] leading-[1.6] text-white/65">{tab.body}</p>
          <DemoCta ctaId={`explorer-${tab.key}`} className="btn-base btn-outline mt-8">
            Explore the Dashboard
          </DemoCta>
        </div>

        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[#0b0b0b] shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="mono-label ml-3 truncate text-white/35">{tab.path}</span>
            </div>
            {tab.panel}
          </div>
        </div>
      </div>
    </div>
  );
}
