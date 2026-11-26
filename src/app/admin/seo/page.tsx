import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import {
  PAGE_KIND_LABEL,
  loadSeoHealth,
  summarize,
  type PageKind,
  type Severity,
  type SeoHealthData,
  type SeoPageReport,
} from "@/lib/seo-health";
import { AdminPageHeader } from "../AdminPageHeader";

export const dynamic = "force-dynamic";

const SEVERITY_FILTERS = ["all", "error", "warning"] as const;
type SeverityFilter = (typeof SEVERITY_FILTERS)[number];
const KINDS = Object.keys(PAGE_KIND_LABEL) as PageKind[];

const BADGE: Record<Severity, string> = {
  error: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400",
  info: "border-border/60 bg-muted text-muted-foreground",
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function href(severity: SeverityFilter, type: PageKind | "all") {
  const q = new URLSearchParams();
  if (severity !== "all") q.set("severity", severity);
  if (type !== "all") q.set("type", type);
  const s = q.toString();
  return `/admin/seo${s ? `?${s}` : ""}`;
}

function Pill({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      className={`mono-label rounded-full border px-3 py-1 transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-hairline text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function LengthChip({ len, min, max, hardMax }: { len: number; min: number; max: number; hardMax?: number }) {
  const tone: Severity =
    len === 0 || (hardMax !== undefined && len > hardMax) ? "error" : len < min || len > max ? "warning" : "info";
  const ok = tone === "info";
  return (
    <span
      className={`mono-label inline-block rounded border px-1.5 py-0.5 tabular-nums ${
        ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : BADGE[tone]
      }`}
    >
      {len}
    </span>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="card-flat p-4">
      <p className="mono-eyebrow text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

function Row({ r }: { r: SeoPageReport }) {
  return (
    <tr className="border-b border-border/40 align-top last:border-0">
      <td className="max-w-[300px] px-4 py-3">
        <p className="truncate font-medium text-foreground" title={r.title}>
          {r.name || r.title}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">{r.path}</p>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{PAGE_KIND_LABEL[r.kind]}</td>
      <td className="px-4 py-3">
        <LengthChip len={r.title.trim().length} min={20} max={60} hardMax={70} />
      </td>
      <td className="px-4 py-3">
        <LengthChip len={r.description.trim().length} min={70} max={160} />
      </td>
      <td className="px-4 py-3">
        {r.issues.length === 0 ? (
          <span className="mono-label text-emerald-700 dark:text-emerald-400">OK</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.issues.map((i) => (
              <span
                key={i.code + i.message}
                title={i.message}
                className={`rounded border px-1.5 py-0.5 text-xs ${BADGE[i.severity]}`}
              >
                {i.message}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {r.editHref ? (
          <Link href={r.editHref} className="btn-base btn-outline">
            Edit
          </Link>
        ) : (
          <span className="mono-label text-muted-foreground" title="Defined in code">
            Code
          </span>
        )}
      </td>
    </tr>
  );
}

export default async function AdminSeoHealthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isAdmin())) redirect("/admin");

  const sp = await searchParams;
  const sevParam = first(sp.severity);
  const severity: SeverityFilter = SEVERITY_FILTERS.find((s) => s === sevParam) ?? "all";
  const typeParam = first(sp.type);
  const type: PageKind | "all" = KINDS.find((k) => k === typeParam) ?? "all";

  let data: SeoHealthData = { reports: [], notices: [] };
  try {
    data = await loadSeoHealth();
  } catch (e) {
    data.notices.push(`SEO data could not be loaded (${e instanceof Error ? e.message : "unknown error"}).`);
  }

  const stats = summarize(data.reports);
  const rows = data.reports.filter(
    (r) =>
      (type === "all" || r.kind === type) &&
      (severity === "all" || (severity === "error" ? r.errors > 0 : r.warnings > 0)),
  );
  const scoreTone = stats.score >= 90 ? "text-emerald-600" : stats.score >= 70 ? "text-amber-600" : "text-red-600";

  return (
    <div>
      <AdminPageHeader
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "SEO health" }]}
        title="SEO health"
        description="Every public page with its title, description and content problems. Read-only: fix issues in each page's editor."
        actions={
          <div className="text-right">
            <p className="mono-eyebrow text-muted-foreground">HEALTH SCORE</p>
            <p className={`text-4xl font-semibold tabular-nums ${scoreTone}`}>{stats.score}%</p>
          </div>
        }
      />

      {data.notices.map((n) => (
        <p key={n} className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-300">
          {n} Showing what could be loaded.
        </p>
      ))}

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="PAGES CHECKED" value={stats.total} />
        <Tile label="ERRORS" value={stats.errors} tone={stats.errors ? "text-red-600" : undefined} />
        <Tile label="WARNINGS" value={stats.warnings} tone={stats.warnings ? "text-amber-600" : undefined} />
        <Tile label="CLEAN" value={stats.clean} tone="text-emerald-600" />
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono-eyebrow mr-1 text-muted-foreground">SEVERITY</span>
          {SEVERITY_FILTERS.map((s) => (
            <Pill key={s} to={href(s, type)} active={s === severity}>
              {s === "all" ? "All" : s === "error" ? "Errors" : "Warnings"}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono-eyebrow mr-1 text-muted-foreground">TYPE</span>
          <Pill to={href(severity, "all")} active={type === "all"}>
            All
          </Pill>
          {KINDS.map((k) => (
            <Pill key={k} to={href(severity, k)} active={k === type}>
              {PAGE_KIND_LABEL[k]}
            </Pill>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-hairline">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-medium">Page</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Desc.</th>
              <th className="px-4 py-3 font-medium">Issues</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-muted-foreground">
                  No pages match these filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => <Row key={r.id} r={r} />)
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Showing {rows.length} of {stats.total} pages. Title length includes the site-name suffix as rendered in search results.
      </p>
    </div>
  );
}
