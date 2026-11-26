/**
 * SEO health: per-page metadata checks (pure, unit-tested) plus a read-only loader that gathers
 * every public page's *effective* metadata exactly as the public site computes it.
 */
import type { CmsBlock } from "@/lib/cms/blocks";

export type Severity = "error" | "warning" | "info";
export type PageKind = "home" | "page" | "service" | "blog" | "case-study" | "tech-news";

export const PAGE_KIND_LABEL: Record<PageKind, string> = {
  home: "Home",
  page: "Page",
  service: "Service",
  blog: "Blog",
  "case-study": "Case study",
  "tech-news": "Tech news",
};

export type SeoIssue = { code: string; severity: Severity; message: string };

/** Effective (as-rendered) metadata for one page. `undefined` on an optional field = "not applicable". */
export type SeoPageInput = {
  id: string;
  kind: PageKind;
  path: string;
  /** Human name of the page (entity title / H1) — checked for raw-slug names. */
  name: string;
  /** Final `<title>` (template applied). */
  title: string;
  description: string;
  /** On-page headings to scan for placeholder text. */
  headings?: string[];
  /** Body word count; only set where thin content is meaningful (CMS pages). */
  wordCount?: number;
  noindex?: boolean;
  /** Canonical URL if it points somewhere other than the page itself. */
  canonicalElsewhere?: string | null;
  /** false = model supports an OG/cover image but none is set; undefined = n/a. */
  hasImage?: boolean;
  /** false = cover image set but no alt text; undefined = n/a. */
  hasImageAlt?: boolean;
  /** false = model has a focus keyword field and it's empty; undefined = n/a. */
  hasFocusKeyword?: boolean;
  /** Admin editor URL, or null when the page is code-defined. */
  editHref: string | null;
};

export type SeoPageReport = SeoPageInput & {
  issues: SeoIssue[];
  errors: number;
  warnings: number;
  infos: number;
};

export const THIN_WORDS = 150;
const JUNK_RE = /\b(test|lorem|untitled)\b|section heading|new page heading/i;
const RAW_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)+$/;

export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Per-page checks (everything except cross-page duplicates). */
export function checkPage(p: SeoPageInput): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const add = (code: string, severity: Severity, message: string) => issues.push({ code, severity, message });

  const title = p.title.trim();
  const desc = p.description.trim();

  if (!title) add("title-missing", "error", "Title is missing");
  else if (title.length > 70) add("title-long", "error", `Title is ${title.length} chars (max 60, hard limit 70)`);
  else if (title.length > 60) add("title-long", "warning", `Title is ${title.length} chars (max 60)`);
  else if (title.length < 20) add("title-short", "warning", `Title is only ${title.length} chars (min 20)`);

  if (!desc) add("desc-missing", "error", "Meta description is missing");
  else if (desc.length < 70) add("desc-short", "warning", `Description is ${desc.length} chars (min 70)`);
  else if (desc.length > 160) add("desc-long", "warning", `Description is ${desc.length} chars (max 160)`);

  if (p.noindex) add("noindex", "info", "Page is set to noindex");
  if (p.canonicalElsewhere) add("canonical", "info", `Canonical points elsewhere: ${p.canonicalElsewhere}`);
  if (p.hasImage === false) add("no-image", "info", "No OG / cover image set");
  if (p.hasImageAlt === false) add("no-alt", "warning", "Cover image has no alt text");
  if (p.hasFocusKeyword === false) add("no-keyword", "info", "No focus keyword set");

  if (title && JUNK_RE.test(title)) add("junk-title", "error", "Title looks like placeholder text");
  const junkHeading = (p.headings ?? []).find((h) => JUNK_RE.test(h));
  if (junkHeading) add("junk-heading", "warning", `Placeholder heading: "${junkHeading}"`);
  if (RAW_SLUG_RE.test(p.name.trim())) add("raw-slug-name", "error", `Name is a raw slug: "${p.name.trim()}"`);
  if (p.wordCount !== undefined && p.wordCount < THIN_WORDS) {
    add("thin-content", "warning", `Thin content: ${p.wordCount} words (min ${THIN_WORDS})`);
  }
  return issues;
}

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/** Runs all checks (incl. duplicate title/description detection) and sorts worst pages first. */
export function analyzePages(inputs: SeoPageInput[]): SeoPageReport[] {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const group = (pick: (p: SeoPageInput) => string) => {
    const m = new Map<string, number>();
    for (const p of inputs) {
      const k = norm(pick(p));
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  const titles = group((p) => p.title);
  const descs = group((p) => p.description);

  const reports = inputs.map((p): SeoPageReport => {
    const issues = checkPage(p);
    const tc = titles.get(norm(p.title)) ?? 0;
    const dc = descs.get(norm(p.description)) ?? 0;
    if (tc > 1) issues.push({ code: "dup-title", severity: "error", message: `Title duplicated on ${tc - 1} other page(s)` });
    if (dc > 1) issues.push({ code: "dup-desc", severity: "error", message: `Description duplicated on ${dc - 1} other page(s)` });
    issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    const count = (s: Severity) => issues.filter((i) => i.severity === s).length;
    return { ...p, issues, errors: count("error"), warnings: count("warning"), infos: count("info") };
  });

  return reports.sort(
    (a, b) => b.errors - a.errors || b.warnings - a.warnings || b.infos - a.infos || a.path.localeCompare(b.path),
  );
}

export function summarize(reports: SeoPageReport[]) {
  const total = reports.length;
  const withErrors = reports.filter((r) => r.errors > 0).length;
  const withWarnings = reports.filter((r) => r.errors === 0 && r.warnings > 0).length;
  const clean = reports.filter((r) => r.errors === 0 && r.warnings === 0).length;
  const errors = reports.reduce((n, r) => n + r.errors, 0);
  const warnings = reports.reduce((n, r) => n + r.warnings, 0);
  const score = total ? Math.round(((total - withErrors) / total) * 100) : 100;
  return { total, withErrors, withWarnings, clean, errors, warnings, score };
}

// ---------------------------------------------------------------------------------------------
// Loader (read-only). Heavy imports are dynamic so the pure functions above stay test-friendly.
// ---------------------------------------------------------------------------------------------

function renderedTitle(t: unknown, siteName: string): string {
  if (typeof t === "string") return `${t} | ${siteName}`;
  if (t && typeof t === "object" && "absolute" in t) return String((t as { absolute: string }).absolute);
  return "";
}

function blockHeadings(blocks: CmsBlock[]): string[] {
  return blocks.flatMap((b) => ("heading" in b && typeof b.heading === "string" && b.heading ? [b.heading] : []));
}

export type SeoHealthData = {
  reports: SeoPageReport[];
  /** Non-fatal problems (e.g. the CMS database was unreachable). */
  notices: string[];
};

export async function loadSeoHealth(): Promise<SeoHealthData> {
  const [{ readBlogPosts, publishedBlogPosts, readSiteContent }, { readCaseStudies }, tn, { servicePages }] =
    await Promise.all([
      import("@/lib/content"),
      import("@/lib/case-studies-content"),
      import("@/lib/tech-news-content"),
      import("@/data/services-content"),
    ]);
  const { seoTitle, fitDescription } = await import("@/lib/seo");
  const notices: string[] = [];
  const inputs: SeoPageInput[] = [];

  const site = await readSiteContent();
  const siteUrl = site.siteUrl.replace(/\/$/, "");
  const siteName = site.siteName;
  const t = (raw: string) => renderedTitle(seoTitle(raw, siteName), siteName);

  // The homepage can override the site defaults (Admin → Homepage → SEO & schema).
  const { readHomeContent } = await import("@/lib/home-content");
  const home = await readHomeContent();
  const homeTitle = home.seoMetaTitle.trim() || site.defaultTitle;
  const homeDescription = home.seoMetaDescription.trim() || site.defaultDescription;
  inputs.push({
    id: "home",
    kind: "home",
    path: "/",
    name: homeTitle,
    title: homeTitle,
    description: homeDescription,
    noindex: site.robotsNoIndex || !home.seoRobotsIndex || undefined,
    editHref: "/admin/home#section-seo",
  });

  // CMS pages: reuse the public metadata builder so title/description match what search engines see.
  const cmsPaths = new Set<string>();
  try {
    const [{ prisma, withDbTimeout }, { buildPageMetadata }, { getPageBlocks }, { extractTextFromCmsBlocks }] =
      await Promise.all([
        import("@/lib/db"),
        import("@/lib/cms/metadata"),
        import("@/lib/cms/pages"),
        import("@/lib/seo-generate"),
      ]);
    const pages = await withDbTimeout(
      prisma.page.findMany({ where: { status: "PUBLISHED" }, include: { seo: true, brief: true }, take: 10000 }),
    );
    for (const page of pages) {
      if (!page.path || page.path === "/") continue;
      cmsPaths.add(page.path);
      const md = buildPageMetadata(page, siteUrl, siteName);
      const blocks = getPageBlocks(page);
      const canonical = typeof md.alternates?.canonical === "string" ? md.alternates.canonical : null;
      const self = `${siteUrl}${page.path}`;
      inputs.push({
        id: `cms:${page.id}`,
        kind: page.type === "SERVICE" ? "service" : "page",
        path: page.path,
        name: page.title,
        title: renderedTitle(md.title, siteName),
        description: typeof md.description === "string" ? md.description : "",
        headings: blockHeadings(blocks),
        wordCount: wordCount(extractTextFromCmsBlocks(blocks)),
        noindex: page.seo?.robotsIndex === false || undefined,
        canonicalElsewhere: canonical && canonical.replace(/\/$/, "") !== self ? canonical : null,
        hasImage: !!page.seo?.ogImageUrl?.trim(),
        editHref: `/admin/cms/pages/${page.id}`,
      });
    }
  } catch (e) {
    notices.push(`CMS pages could not be read (${e instanceof Error ? e.message : "database unavailable"}).`);
  }

  // Legacy static services only when no CMS page owns the path (same rule as the sitemap).
  for (const s of servicePages) {
    if (cmsPaths.has(`/services/${s.slug}`)) continue;
    inputs.push({
      id: `service:${s.slug}`,
      kind: "service",
      path: `/services/${s.slug}`,
      name: s.title,
      title: t(s.title),
      description: fitDescription(s.description) ?? "",
      headings: [s.h1, ...s.sections.map((x) => x.heading)],
      editHref: null,
    });
  }

  try {
    const posts = publishedBlogPosts(await readBlogPosts());
    for (const p of posts) {
      inputs.push({
        id: `blog:${p.slug}`,
        kind: "blog",
        path: `/blog/${p.slug}`,
        name: p.title,
        title: t(p.seoTitle?.trim() || p.title),
        description: fitDescription(p.description) ?? "",
        hasImage: !!p.coverImage?.trim(),
        hasImageAlt: p.coverImage?.trim() ? !!p.coverAlt?.trim() : undefined,
        hasFocusKeyword: !!p.focusKeyword?.trim(),
        editHref: `/admin/blog/${p.slug}/edit`,
      });
    }
    for (const c of await readCaseStudies()) {
      inputs.push({
        id: `case:${c.slug}`,
        kind: "case-study",
        path: `/case-studies/${c.slug}`,
        name: c.title,
        title: t(c.seoTitle?.trim() || c.title),
        description: fitDescription(c.description) ?? "",
        hasImage: !!c.coverImage?.trim(),
        hasImageAlt: c.coverImage?.trim() ? !!c.coverAlt?.trim() : undefined,
        editHref: `/admin/case-studies/${c.slug}/edit`,
      });
    }
    for (const n of tn.publishedTechNewsPosts(await tn.readTechNewsPosts())) {
      inputs.push({
        id: `news:${n.slug}`,
        kind: "tech-news",
        path: `/tech-news/${n.slug}`,
        name: n.title,
        title: t(n.seoTitle?.trim() || n.title),
        description: fitDescription(n.description) ?? "",
        hasImage: !!n.coverImage?.trim(),
        hasFocusKeyword: !!n.focusKeyword?.trim(),
        editHref: `/admin/tech-news/${n.slug}/edit`,
      });
    }
  } catch (e) {
    notices.push(`Blog / case study / tech news content could not be read (${e instanceof Error ? e.message : "database unavailable"}).`);
  }

  return { reports: analyzePages(inputs), notices };
}
