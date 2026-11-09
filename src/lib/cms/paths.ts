import type { PageType } from "@prisma/client";
import { slugify } from "@/lib/slug";

/**
 * Pure CMS URL rules — shared by the server (src/lib/cms/pages.ts, sitemap, llms.txt) and the
 * admin editor's live URL preview. No DB access here so client components can import it.
 */

export function pathFor(type: PageType, slug: string): string {
  const s = slugify(slug);
  switch (type) {
    case "HOME":
      return "/";
    case "SERVICE":
      return `/services/${s}`;
    case "SOLUTION":
      return `/solutions/${s}`;
    case "INDUSTRY":
      return `/industries/${s}`;
    case "TECHNOLOGY":
      return `/technologies/${s}`;
    case "LOCATION":
      return `/locations/${s}`;
    case "PRICING":
      return `/pricing/${s}`;
    case "CASE_STUDY":
      return `/case-studies/${s}`;
    case "BLOG":
      return `/blog/${s}`;
    case "COMPANY":
      return `/company/${s}`;
    case "CONTACT":
      return "/contact";
    case "GUIDE":
      return `/resources/guides/${s}`;
    case "COMPARISON":
      return `/compare/${s}`;
    case "GLOSSARY":
      return `/resources/glossary/${s}`;
    default:
      return `/${s}`;
  }
}

/** Top-level segments owned by hard-coded routes in src/app. A CMS page placed under one of these
 *  would never render (the static route wins) yet would still be listed in the sitemap. */
const RESERVED_PREFIXES = [
  "admin",
  "api",
  "about",
  "blog",
  "business-systems",
  "case-studies",
  "contact",
  "feature-unavailable",
  "freebies",
  "maintenance",
  "privacy",
  "tech-news",
  "terms",
  "torqos",
  "_next",
];

/** Exact paths served by hub / metadata routes (the entity *detail* paths below them are fine).
 *  "/services" is deliberately absent: that hub renders a published CMS page at "/services" if one exists. */
const RESERVED_EXACT = new Set([
  "/",
  "/solutions",
  "/industries",
  "/technologies",
  "/locations",
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt",
  "/llms-full.txt",
  "/ads.txt",
  "/manifest.webmanifest",
  "/opengraph-image",
  "/indexnow-key.txt",
]);

/** Normalises an editor-entered path to `/a/b` form (lowercase slug segments, no trailing slash). */
export function normalizePagePath(raw: string): string {
  const segments = raw
    .split(/[?#]/)[0]
    .split("/")
    .map((seg) => slugify(seg))
    .filter(Boolean);
  return `/${segments.join("/")}`;
}

/** Returns an error message when `path` can't be served by the CMS catch-all, else null. */
export function pagePathError(path: string): string | null {
  if (RESERVED_EXACT.has(path)) return `"${path}" is served by a built-in page — choose another path.`;
  const first = path.split("/").filter(Boolean)[0] ?? "";
  if (RESERVED_PREFIXES.includes(first)) {
    return `Paths under "/${first}" are owned by a built-in section — choose another path.`;
  }
  return null;
}

/** Pages that should appear in the sitemap, llms.txt and IndexNow pings: published, indexable,
 *  and either self-canonical or with no canonical override. */
export function isIndexablePage(
  page: { status: string; path: string; seo: { robotsIndex: boolean; canonical: string | null } | null },
  siteUrl: string,
): boolean {
  if (page.status !== "PUBLISHED" || !page.path || page.path === "/") return false;
  if (page.seo?.robotsIndex === false) return false;
  const canonical = page.seo?.canonical?.trim();
  if (canonical) {
    const self = `${siteUrl.replace(/\/$/, "")}${page.path}`;
    if (canonical.replace(/\/$/, "") !== self) return false;
  }
  return true;
}
