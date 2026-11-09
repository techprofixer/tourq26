/** Short display date used across admin list tables, e.g. "14 Aug 2026". Falls back to the raw string on parse failure. */
export function formatShortDate(s?: string): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function parseDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Public-facing article date, e.g. "14 August 2026". */
export function formatLongDate(s: string): string {
  const d = parseDate(s);
  return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : s;
}

/** Admin timestamp, e.g. "14 Aug 2026, 10:32". */
export function formatDateTime(s: string): string {
  const d = parseDate(s);
  return d ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : s;
}

/** Admin date without time, e.g. "14 Aug 2026". */
export function formatMediumDate(s: string): string {
  const d = parseDate(s);
  return d ? d.toLocaleDateString(undefined, { dateStyle: "medium" }) : s;
}
