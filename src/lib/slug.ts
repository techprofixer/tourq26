/**
 * The one slug function for the whole app (blog, tech news, case studies, CMS pages, entities,
 * pricing plans, heading anchors). Accents fold to ASCII ("café" → "cafe"), quotes are dropped
 * ("don't" → "dont"), everything else outside [a-z0-9] becomes a single hyphen, max 80 chars.
 * Already-clean slugs pass through unchanged, so re-slugifying stored values is always safe.
 */
export function slugify(value: string, fallback = ""): string {
  const slug = (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['"`’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
  return slug || fallback;
}
