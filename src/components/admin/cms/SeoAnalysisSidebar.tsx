"use client";

import {
  analyzePageSeo,
  summarizeSeoChecks,
  type SeoCheck,
  type SeoCheckCategory,
  type SeoCheckStatus,
} from "@/lib/seo-analysis";

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
  );
}

function AlertTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.6 3.6 2.9 17a1.8 1.8 0 0 0 1.55 2.7h15.1A1.8 1.8 0 0 0 21.1 17L13.4 3.6a1.8 1.8 0 0 0-3.1 0Z" />
      <path d="M12 9.5v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function XCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

function ImageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 16-5.5-5.5L4 21" />
    </svg>
  );
}

function LinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.4 5.1a3.5 3.5 0 0 1 5 5L16 11.5" />
      <path d="M13 17.5 11.6 18.9a3.5 3.5 0 0 1-5-5L8 12.5" />
    </svg>
  );
}

function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3 8.5 4.5L12 12 3.5 7.5Z" />
      <path d="m3.5 12 8.5 4.5 8.5-4.5" />
      <path d="m3.5 16.5 8.5 4.5 8.5-4.5" />
    </svg>
  );
}

function KeyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="7.5" cy="14.5" r="4" />
      <path d="M10.5 11.5 19 3M15 5l2.5 2.5M18 2l2.5 2.5" />
    </svg>
  );
}

function TextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

const STATUS_STYLE: Record<
  SeoCheckStatus,
  { icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement; text: string; bg: string; border: string; dot: string }
> = {
  pass: { icon: CheckCircleIcon, text: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/25", dot: "bg-emerald-500" },
  warn: { icon: AlertTriangleIcon, text: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/25", dot: "bg-amber-500" },
  fail: { icon: XCircleIcon, text: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/25", dot: "bg-red-500" },
};

const STATUS_LABEL: Record<SeoCheckStatus, string> = {
  pass: "Good",
  warn: "Needs work",
  fail: "Missing",
};

const CATEGORY_META: Record<SeoCheckCategory, { label: string; icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement }> = {
  keyword: { label: "Keyword", icon: KeyIcon },
  content: { label: "Content", icon: TextIcon },
  media: { label: "Media", icon: ImageIcon },
  links: { label: "Links", icon: LinkIcon },
  structure: { label: "Structure", icon: LayersIcon },
};

const CATEGORY_ORDER: SeoCheckCategory[] = ["keyword", "content", "media", "links", "structure"];

const RECOMMENDED_BLOCKS: { key: string; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "contentSection", label: "Content" },
  { key: "faq", label: "FAQ" },
  { key: "cta", label: "CTA" },
];

function CheckRow({ check }: { check: SeoCheck }) {
  const style = STATUS_STYLE[check.status];
  const Icon = style.icon;
  return (
    <li className={`flex gap-2.5 rounded-lg border px-3 py-2.5 ${style.bg} ${style.border}`}>
      <Icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${style.text}`} aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{check.label}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{check.detail}</p>
      </div>
    </li>
  );
}

export function SeoAnalysisSidebar({
  title,
  slug,
  metaTitle,
  metaDescription,
  focusKeyword,
  secondaryKeywords,
  bodyText,
  heroHeading,
  hasHeading,
  rawHtml,
  siteUrl,
  blockTypesPresent,
}: {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  bodyText: string;
  heroHeading: string;
  hasHeading: boolean;
  rawHtml: string;
  siteUrl?: string;
  blockTypesPresent: string[];
}) {
  const checks = analyzePageSeo({
    title,
    slug,
    metaTitle,
    metaDescription,
    focusKeyword,
    secondaryKeywords,
    bodyText,
    heroHeading,
    hasHeading,
    rawHtml,
    siteUrl,
    blockTypesPresent,
  });
  const summary = summarizeSeoChecks(checks);
  const summaryStyle = STATUS_STYLE[summary.status];
  const SummaryIcon = summaryStyle.icon;

  return (
    <div className="card-flat space-y-5">
      <div>
        <h2 className="display-sm text-foreground">SEO analysis</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live, rule-based checks against your focus keyword — recalculates as you edit.
        </p>
      </div>

      <div className={`flex items-center gap-3 rounded-md border px-3 py-2.5 ${summaryStyle.bg} ${summaryStyle.border}`}>
        <SummaryIcon className={`h-5 w-5 shrink-0 ${summaryStyle.text}`} aria-hidden />
        <span className="text-sm font-medium text-foreground">
          {summary.passed}/{summary.total} checks passing
        </span>
        <span className={`mono-label ml-auto ${summaryStyle.text}`}>{STATUS_LABEL[summary.status]}</span>
      </div>

      <div>
        <p className="mono-label mb-2 flex items-center gap-1.5 text-muted-foreground">
          <LayersIcon className="h-3.5 w-3.5" aria-hidden /> Blocks
        </p>
        <div className="flex flex-wrap gap-1.5">
          {RECOMMENDED_BLOCKS.map((b) => {
            const present = blockTypesPresent.includes(b.key);
            return (
              <span
                key={b.key}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[12px] font-medium ${
                  present
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600"
                    : "border-red-500/25 bg-red-500/10 text-red-600"
                }`}
              >
                {present ? <CheckCircleIcon className="h-3 w-3" aria-hidden /> : <XCircleIcon className="h-3 w-3" aria-hidden />}
                {b.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = checks.filter((c) => c.category === cat);
          if (items.length === 0) return null;
          const meta = CATEGORY_META[cat];
          const CatIcon = meta.icon;
          return (
            <div key={cat}>
              <p className="mono-label mb-2 flex items-center gap-1.5 text-muted-foreground">
                <CatIcon className="h-3.5 w-3.5" aria-hidden /> {meta.label}
              </p>
              <ul className="space-y-2">
                {items.map((c) => (
                  <CheckRow key={c.id} check={c} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
