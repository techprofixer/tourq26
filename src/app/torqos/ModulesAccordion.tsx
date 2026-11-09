"use client";

import { useState } from "react";
import {
  CatalogIcon,
  CheckIcon,
  ChecklistIcon,
  ChevronDownIcon,
  ContactCardIcon,
  GlobeIcon,
  LayersIcon,
  MegaphoneIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  TechnicianIcon,
  TicketIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
} from "./icons";

/**
 * Icons are looked up here (by `short` code) rather than passed in as props —
 * component references from icons.tsx can't cross the server -> client
 * boundary, only the serializable module data (title/desc/bullets) can.
 */
const ICONS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  REPORTS: TrendingUpIcon,
  JOBS: ChecklistIcon,
  CATALOG: CatalogIcon,
  TECH: TechnicianIcon,
  TEAM: UsersIcon,
  QUOTES: ReceiptIcon,
  CRM: ContactCardIcon,
  CMS: LayersIcon,
  AMC: ShieldCheckIcon,
  FINANCE: WalletIcon,
  MARKET: MegaphoneIcon,
  WEBSITE: GlobeIcon,
  TICKETS: TicketIcon,
};

type Module = {
  title: string;
  short: string;
  desc: string;
  bullets: string[];
};

/** Click-to-expand module list (DESIGN.md -> ex-app-shell-row rhythm) replacing a static grid. */
export default function ModulesAccordion({ modules }: { modules: Module[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-10 border-t border-hairline">
      {modules.map(({ title, short, desc, bullets }, i) => {
        const isOpen = openIndex === i;
        const Icon = ICONS[short] ?? TrendingUpIcon;
        return (
          <div
            key={title}
            className={`border-b border-hairline transition-colors ${isOpen ? "bg-[var(--app-muted)]/40" : ""}`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 py-5 text-left sm:gap-5"
            >
              <span className="mono-label hidden w-7 shrink-0 text-muted-foreground/40 sm:inline">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border transition-colors ${
                  isOpen
                    ? "border-foreground bg-foreground text-background"
                    : "border-hairline bg-background text-foreground/70"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-medium text-foreground">{title}</span>
                <span className="mt-0.5 hidden text-[13px] leading-[1.4] text-muted-foreground sm:block">
                  {desc}
                </span>
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="pl-[52px] pb-4 text-[13px] leading-[1.5] text-muted-foreground sm:hidden">
                  {desc}
                </p>
                <ul className="grid gap-2.5 pb-6 pl-[52px] sm:grid-cols-3 sm:gap-4 sm:pl-[76px]">
                  {bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5 text-[13.5px] leading-[1.45] text-foreground/80">
                      <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/40" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
