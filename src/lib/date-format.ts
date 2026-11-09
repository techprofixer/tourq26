/** Short display date used across admin list tables, e.g. "14 Aug 2026". Falls back to the raw string on parse failure. */
export function formatShortDate(s?: string): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
