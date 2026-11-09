export type SeoCheckStatus = "pass" | "warn" | "fail";

export type SeoCheckCategory = "keyword" | "content" | "media" | "links" | "structure";

export type SeoCheck = {
  id: string;
  label: string;
  status: SeoCheckStatus;
  detail: string;
  category: SeoCheckCategory;
};

export type ImageAudit = {
  total: number;
  missingAlt: number;
};

export type LinkAudit = {
  internal: number;
  external: number;
};

const RECOMMENDED_BLOCKS: { key: string; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "contentSection", label: "Content section" },
  { key: "faq", label: "FAQ" },
  { key: "cta", label: "CTA" },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(haystack: string, needle: string): number {
  const term = needle.trim();
  if (!term) return 0;
  const re = new RegExp(escapeRegExp(term), "gi");
  return (haystack.match(re) ?? []).length;
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function check(
  id: string,
  label: string,
  status: SeoCheckStatus,
  detail: string,
  category: SeoCheckCategory,
): SeoCheck {
  return { id, label, status, detail, category };
}

/** Scans raw block HTML for <img> tags and flags missing/empty alt attributes. */
export function auditImages(html: string): ImageAudit {
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];
  let missingAlt = 0;
  for (const tag of tags) {
    const altMatch = tag.match(/\balt\s*=\s*(["'])(.*?)\1/i);
    const altValue = altMatch ? altMatch[2].trim() : "";
    if (!altValue) missingAlt += 1;
  }
  return { total: tags.length, missingAlt };
}

/** Scans raw block HTML for <a href> tags and splits them into internal vs. external. */
export function auditLinks(html: string, siteUrl?: string): LinkAudit {
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)].map((m) => m[2].trim());
  let origin = "";
  if (siteUrl) {
    try {
      origin = new URL(siteUrl).origin;
    } catch {
      origin = "";
    }
  }
  let internal = 0;
  let external = 0;
  for (const href of hrefs) {
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    const isAbsolute = /^https?:\/\//i.test(href);
    if (!isAbsolute) {
      internal += 1;
      continue;
    }
    if (origin && href.startsWith(origin)) internal += 1;
    else external += 1;
  }
  return { internal, external };
}

function contentLengthCheck(bodyWords: number): SeoCheck {
  if (bodyWords === 0) {
    return check("contentLength", "Content length", "fail", "No body content yet.", "content");
  }
  if (bodyWords < 300) {
    return check(
      "contentLength",
      "Content length",
      "fail",
      `${bodyWords} words — under the ~300-word floor search engines treat as thin content.`,
      "content",
    );
  }
  if (bodyWords < 600) {
    return check(
      "contentLength",
      "Content length",
      "warn",
      `${bodyWords} words — meets the bare minimum; competitive top-ranking pages average 1,000+.`,
      "content",
    );
  }
  if (bodyWords <= 2500) {
    return check(
      "contentLength",
      "Content length",
      "pass",
      `${bodyWords} words — within the 600-2,500 range typical of comprehensive, top-ranking pages.`,
      "content",
    );
  }
  return check(
    "contentLength",
    "Content length",
    "warn",
    `${bodyWords} words — long-form; make sure headings keep it scannable.`,
    "content",
  );
}

function imageCheck(audit: ImageAudit): SeoCheck {
  if (audit.total === 0) {
    return check(
      "imageAlt",
      "Image alt text",
      "warn",
      "No images yet — add one with descriptive alt text for accessibility and image search.",
      "media",
    );
  }
  if (audit.missingAlt === 0) {
    return check(
      "imageAlt",
      "Image alt text",
      "pass",
      `All ${audit.total} image${audit.total === 1 ? "" : "s"} have alt text.`,
      "media",
    );
  }
  return check(
    "imageAlt",
    "Image alt text",
    "fail",
    `${audit.missingAlt} of ${audit.total} image${audit.total === 1 ? "" : "s"} missing alt text.`,
    "media",
  );
}

function linkChecks(audit: LinkAudit): SeoCheck[] {
  const internalStatus: SeoCheckStatus = audit.internal === 0 ? "fail" : audit.internal === 1 ? "warn" : "pass";
  const internal = check(
    "internalLinks",
    "Internal links",
    internalStatus,
    audit.internal === 0
      ? "No internal links — link to 2-3 related pages to spread authority and help crawlers."
      : audit.internal === 1
        ? "1 internal link found — add one or two more to related pages."
        : `${audit.internal} internal links found.`,
    "links",
  );
  const external = check(
    "externalLinks",
    "Outbound links",
    audit.external === 0 ? "warn" : "pass",
    audit.external === 0
      ? "No outbound links to authoritative sources."
      : `${audit.external} outbound link${audit.external === 1 ? "" : "s"} found.`,
    "links",
  );
  return [internal, external];
}

function blockCoverageCheck(blockTypesPresent: string[]): SeoCheck {
  const missing = RECOMMENDED_BLOCKS.filter((b) => !blockTypesPresent.includes(b.key));
  const status: SeoCheckStatus = missing.length === 0 ? "pass" : missing.length === 1 ? "warn" : "fail";
  return check(
    "blockCoverage",
    "Recommended blocks",
    status,
    missing.length === 0
      ? "Hero, content, FAQ, and CTA blocks are all present."
      : `Missing: ${missing.map((b) => b.label).join(", ")}.`,
    "structure",
  );
}

export function analyzePageSeo(input: {
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
}): SeoCheck[] {
  const focusKeyword = input.focusKeyword.trim();
  const metaTitle = (input.metaTitle || input.title).trim();
  const metaDescription = input.metaDescription.trim();
  const bodyWords = wordCount(input.bodyText);
  const secondaryKeywords = input.secondaryKeywords.map((k) => k.trim()).filter(Boolean);
  const imageAudit = auditImages(input.rawHtml);
  const linkAudit = auditLinks(input.rawHtml, input.siteUrl);

  const checks: SeoCheck[] = [];

  if (!focusKeyword) {
    checks.push(
      check(
        "focusKeyword",
        "Focus keyword",
        "fail",
        "No focus keyword set — every other keyword check below is skipped until you add one.",
        "keyword",
      ),
    );
    checks.push(
      check(
        "metaTitleLength",
        "Meta title length",
        metaTitle.length === 0 ? "fail" : metaTitle.length > 60 ? "warn" : "pass",
        `${metaTitle.length} chars (aim for 40-60).`,
        "keyword",
      ),
    );
    checks.push(
      check(
        "metaDescLength",
        "Meta description length",
        metaDescription.length === 0 ? "fail" : metaDescription.length > 160 ? "warn" : metaDescription.length < 80 ? "warn" : "pass",
        `${metaDescription.length} chars (aim for 120-160).`,
        "keyword",
      ),
    );
    checks.push(contentLengthCheck(bodyWords));
    checks.push(
      check(
        "heading",
        "Has a subheading (H2/H3)",
        input.hasHeading ? "pass" : "warn",
        input.hasHeading ? "At least one section heading found." : "No content section headings found — add at least one H2.",
        "structure",
      ),
    );
    checks.push(blockCoverageCheck(input.blockTypesPresent));
    checks.push(imageCheck(imageAudit));
    checks.push(...linkChecks(linkAudit));
    return checks;
  }

  checks.push(check("focusKeyword", "Focus keyword", "pass", `"${focusKeyword}"`, "keyword"));

  checks.push(
    check(
      "keywordInTitle",
      "Keyword in meta title",
      metaTitle.toLowerCase().includes(focusKeyword.toLowerCase()) ? "pass" : "fail",
      metaTitle.toLowerCase().includes(focusKeyword.toLowerCase())
        ? "Meta title contains the focus keyword."
        : "Meta title does not contain the focus keyword.",
      "keyword",
    ),
  );

  checks.push(
    check(
      "metaTitleLength",
      "Meta title length",
      metaTitle.length === 0 ? "fail" : metaTitle.length > 60 ? "warn" : metaTitle.length < 30 ? "warn" : "pass",
      `${metaTitle.length} chars (aim for 40-60, Google truncates past ~60).`,
      "keyword",
    ),
  );

  checks.push(
    check(
      "keywordInMetaDesc",
      "Keyword in meta description",
      metaDescription.toLowerCase().includes(focusKeyword.toLowerCase()) ? "pass" : "fail",
      metaDescription.toLowerCase().includes(focusKeyword.toLowerCase())
        ? "Meta description contains the focus keyword."
        : "Meta description does not contain the focus keyword.",
      "keyword",
    ),
  );

  checks.push(
    check(
      "metaDescLength",
      "Meta description length",
      metaDescription.length === 0 ? "fail" : metaDescription.length > 160 ? "warn" : metaDescription.length < 80 ? "warn" : "pass",
      `${metaDescription.length} chars (aim for 120-160).`,
      "keyword",
    ),
  );

  const slugHasKeyword = input.slug.toLowerCase().includes(focusKeyword.toLowerCase().replace(/\s+/g, "-"));
  checks.push(
    check(
      "keywordInSlug",
      "Keyword in URL slug",
      slugHasKeyword ? "pass" : "warn",
      slugHasKeyword ? "Slug contains the focus keyword." : "Slug does not obviously contain the focus keyword.",
      "keyword",
    ),
  );

  if (input.heroHeading.trim()) {
    const inHeading = input.heroHeading.toLowerCase().includes(focusKeyword.toLowerCase());
    checks.push(
      check(
        "keywordInH1",
        "Keyword in H1 (hero heading)",
        inHeading ? "pass" : "warn",
        inHeading ? "Hero heading contains the focus keyword." : "Hero heading does not contain the focus keyword.",
        "keyword",
      ),
    );
  }

  const first100 = input.bodyText.trim().split(/\s+/).slice(0, 100).join(" ");
  const inOpening = first100.toLowerCase().includes(focusKeyword.toLowerCase());
  checks.push(
    check(
      "keywordEarly",
      "Keyword in the opening ~100 words",
      bodyWords === 0 ? "fail" : inOpening ? "pass" : "warn",
      bodyWords === 0 ? "No body content yet." : inOpening ? "Found early in the content." : "Not found in the first 100 words — readers and crawlers weight the opening most.",
      "keyword",
    ),
  );

  const occurrences = countOccurrences(input.bodyText, focusKeyword);
  const density = bodyWords > 0 ? (occurrences / bodyWords) * 100 : 0;
  checks.push(
    check(
      "keywordDensity",
      "Keyword density",
      bodyWords === 0 ? "fail" : density === 0 ? "fail" : density > 3 ? "warn" : "pass",
      bodyWords === 0
        ? "No body content yet."
        : `${occurrences} occurrence${occurrences === 1 ? "" : "s"} in ${bodyWords} words (${density.toFixed(1)}%). Aim for 0.5-2.5%; above ~3% reads as keyword stuffing.`,
      "keyword",
    ),
  );

  if (secondaryKeywords.length > 0) {
    const combined = `${input.title} ${metaTitle} ${metaDescription} ${input.bodyText}`.toLowerCase();
    const used = secondaryKeywords.filter((k) => combined.includes(k.toLowerCase()));
    checks.push(
      check(
        "secondaryKeywords",
        "Secondary keywords used",
        used.length === 0 ? "warn" : used.length < secondaryKeywords.length ? "warn" : "pass",
        `${used.length}/${secondaryKeywords.length} used${used.length > 0 ? `: ${used.join(", ")}` : ""}.`,
        "keyword",
      ),
    );
  }

  checks.push(contentLengthCheck(bodyWords));

  checks.push(
    check(
      "heading",
      "Has a subheading (H2/H3)",
      input.hasHeading ? "pass" : "warn",
      input.hasHeading ? "At least one section heading found." : "No content section headings found — add at least one H2.",
      "structure",
    ),
  );

  checks.push(blockCoverageCheck(input.blockTypesPresent));
  checks.push(imageCheck(imageAudit));
  checks.push(...linkChecks(linkAudit));

  return checks;
}

export function summarizeSeoChecks(checks: SeoCheck[]): { passed: number; total: number; status: SeoCheckStatus } {
  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const status: SeoCheckStatus = failed > 0 ? "fail" : passed === checks.length ? "pass" : "warn";
  return { passed, total: checks.length, status };
}
