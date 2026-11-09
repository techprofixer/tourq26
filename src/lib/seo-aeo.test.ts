import { describe, expect, it } from "vitest";
import { AI_SEARCH_CRAWLERS, AI_TRAINING_CRAWLERS, buildRobotsRules } from "@/lib/crawlers";
import { buildIndexNowPayload } from "@/lib/indexnow";
import { isIndexablePage, normalizePagePath, pagePathError, pathFor } from "@/lib/cms/paths";
import { aeoChecks, analyzePageSeo, type PageSeoInput } from "@/lib/seo-analysis";
import { blocksToMarkdown } from "@/lib/llms-txt";
import { parseBlocks } from "@/lib/cms/blocks";
import { buildPageJsonLd, buildPageMetadata } from "@/lib/cms/metadata";
import type { PageWithSeo } from "@/lib/cms/pages";

const SITE = "https://torqstudio.com";

describe("buildRobotsRules", () => {
  it("blocks everything when noIndex is on", () => {
    expect(buildRobotsRules({ noIndex: true, blockAiTraining: false })).toEqual([
      { userAgent: "*", disallow: "/" },
    ]);
  });

  it("allows search and training crawlers by default, keeping private paths disallowed", () => {
    const rules = buildRobotsRules({ noIndex: false, blockAiTraining: false }) as {
      userAgent: string | string[];
      allow?: string;
      disallow?: string | string[];
    }[];
    for (const r of rules) {
      expect(r.allow).toBe("/");
      expect(r.disallow).toContain("/admin");
    }
  });

  it("blocks only training crawlers when opted out — AI search crawlers stay allowed", () => {
    const rules = buildRobotsRules({ noIndex: false, blockAiTraining: true }) as {
      userAgent: string[] | string;
      allow?: string;
      disallow?: string | string[];
    }[];
    const training = rules.find((r) => Array.isArray(r.userAgent) && r.userAgent.includes("GPTBot"));
    const search = rules.find((r) => Array.isArray(r.userAgent) && r.userAgent.includes("OAI-SearchBot"));
    expect(training?.disallow).toBe("/");
    expect(training?.allow).toBeUndefined();
    expect(search?.allow).toBe("/");
  });

  it("never lists a crawler as both search and training", () => {
    const overlap = AI_SEARCH_CRAWLERS.filter((b) => (AI_TRAINING_CRAWLERS as readonly string[]).includes(b));
    expect(overlap).toEqual([]);
  });
});

describe("buildIndexNowPayload", () => {
  const key = "abc123def456";

  it("builds absolute, de-duplicated URLs with the key location", () => {
    expect(buildIndexNowPayload(SITE, key, ["/blog/a", "/blog/a/", "/", "not-a-path"])).toEqual({
      host: "torqstudio.com",
      key,
      keyLocation: `${SITE}/indexnow-key.txt`,
      urlList: [`${SITE}/blog/a`, SITE],
    });
  });

  it("refuses non-https and local origins", () => {
    expect(buildIndexNowPayload("http://torqstudio.com", key, ["/a"])).toBeNull();
    expect(buildIndexNowPayload("https://localhost:3000", key, ["/a"])).toBeNull();
    expect(buildIndexNowPayload("not a url", key, ["/a"])).toBeNull();
  });

  it("returns null when there are no valid paths", () => {
    expect(buildIndexNowPayload(SITE, key, [])).toBeNull();
  });
});

describe("CMS paths", () => {
  it("maps page types to their route prefixes", () => {
    expect(pathFor("SERVICE", "Mobile Apps")).toBe("/services/mobile-apps");
    expect(pathFor("GUIDE", "x")).toBe("/resources/guides/x");
    expect(pathFor("LANDING", "Promo")).toBe("/promo");
  });

  it("normalises editor-entered paths", () => {
    expect(normalizePagePath("Compare/React VS Vue/?utm=1")).toBe("/compare/react-vs-vue");
    expect(normalizePagePath("")).toBe("/");
  });

  it("rejects paths owned by built-in routes, allows CMS-served ones", () => {
    expect(pagePathError("/blog/my-post")).toMatch(/built-in section/);
    expect(pagePathError("/admin")).not.toBeNull();
    expect(pagePathError("/")).not.toBeNull();
    expect(pagePathError("/solutions")).not.toBeNull();
    expect(pagePathError("/services")).toBeNull(); // hub renders a CMS override when present
    expect(pagePathError("/services/web")).toBeNull();
    expect(pagePathError("/compare/a-vs-b")).toBeNull();
  });

  it("treats only published, indexable, self-canonical pages as indexable", () => {
    const base = { status: "PUBLISHED", path: "/services/web", seo: { robotsIndex: true, canonical: null } };
    expect(isIndexablePage(base, SITE)).toBe(true);
    expect(isIndexablePage({ ...base, status: "DRAFT" }, SITE)).toBe(false);
    expect(isIndexablePage({ ...base, seo: { robotsIndex: false, canonical: null } }, SITE)).toBe(false);
    expect(isIndexablePage({ ...base, seo: { robotsIndex: true, canonical: `${SITE}/services/web/` } }, SITE)).toBe(true);
    expect(isIndexablePage({ ...base, seo: { robotsIndex: true, canonical: `${SITE}/other` } }, SITE)).toBe(false);
  });
});

describe("AEO analysis", () => {
  const input: PageSeoInput = {
    title: "Web development",
    slug: "web",
    metaTitle: "",
    metaDescription: "",
    focusKeyword: "",
    secondaryKeywords: [],
    bodyText: "",
    heroHeading: "",
    hasHeading: false,
    rawHtml: "",
    blockTypesPresent: [],
  };

  it("fails answer-engine checks on an empty page", () => {
    const byId = Object.fromEntries(aeoChecks(input).map((c) => [c.id, c.status]));
    expect(byId).toEqual({
      aeoSummary: "fail",
      aeoFaq: "fail",
      aeoQuestionHeadings: "warn",
      aeoSocialImage: "warn",
    });
  });

  it("passes when the page has a summary, FAQs, question headings and an image", () => {
    const checks = aeoChecks({ ...input, summaryItems: 3, faqCount: 4, questionHeadings: 1, hasSocialImage: true });
    expect(checks.every((c) => c.status === "pass")).toBe(true);
  });

  it("is included in the full analysis", () => {
    expect(analyzePageSeo(input).some((c) => c.category === "aeo")).toBe(true);
  });
});

describe("summary block + markdown export", () => {
  it("parses the summary block and drops invalid ones", () => {
    const blocks = parseBlocks([
      { type: "summary", id: "s1", items: ["One.", "Two."] },
      { type: "summary", id: "s2", items: [] },
    ]);
    expect(blocks.map((b) => b.id)).toEqual(["s1"]);
  });

  it("renders blocks as Markdown for llms-full.txt, skipping CTAs", () => {
    const md = blocksToMarkdown(
      parseBlocks([
        { type: "summary", id: "s", items: ["Fast answer."] },
        { type: "contentSection", id: "c", heading: "How it works", bodyHtml: "<p>Hello <strong>world</strong></p>" },
        { type: "faq", id: "f", items: [{ question: "Cost?", answer: "<p>Depends.</p>" }] },
        { type: "cta", id: "x", heading: "Buy now" },
      ]),
    );
    expect(md).toContain("- Fast answer.");
    expect(md).toContain("### How it works\n\nHello **world**");
    expect(md).toContain("**Cost?**\n\nDepends.");
    expect(md).not.toContain("Buy now");
  });
});

describe("CMS page metadata + JSON-LD", () => {
  const now = new Date("2026-01-02T00:00:00Z");
  const page = (overrides: Partial<PageWithSeo> = {}, seo: Partial<NonNullable<PageWithSeo["seo"]>> = {}) =>
    ({
      id: "p1",
      slug: "react-vs-vue",
      path: "/compare/react-vs-vue",
      title: "React vs Vue",
      type: "COMPARISON",
      status: "PUBLISHED",
      locale: "en",
      excerpt: "Which to pick.",
      primaryEntityKind: null,
      primaryEntityId: null,
      publishedAt: now,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      blocks: [{ type: "faq", id: "f", items: [{ question: "Which is faster?", answer: "<p>Both.</p>" }] }],
      brief: null,
      seo: {
        id: "s",
        pageId: "p1",
        metaTitle: null,
        metaDescription: "Compare React and Vue.",
        canonical: null,
        robotsIndex: true,
        robotsFollow: true,
        ogTitle: null,
        ogDescription: null,
        ogImageUrl: null,
        twitterTitle: null,
        twitterDescription: null,
        jsonLdCustom: [],
        breadcrumbLabel: null,
        focusKeyword: null,
        authorName: "Jane Doe",
        ...seo,
      },
      ...overrides,
    }) as PageWithSeo;

  it("emits article OG data, a custom image and generous snippet directives", () => {
    const meta = buildPageMetadata(page({}, { ogImageUrl: "https://cdn.example/x.png" }), SITE, "Torq Studio");
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.type).toBe("article");
    expect(og.publishedTime).toBe(now.toISOString());
    expect((og.images as { url: string }[])[0].url).toBe("https://cdn.example/x.png");
    expect((meta.robots as { googleBot: Record<string, unknown> }).googleBot["max-snippet"]).toBe(-1);
  });

  it("builds a linked graph: WebPage, Article with named author, breadcrumbs, FAQ, custom", () => {
    const ld = buildPageJsonLd(
      page({}, { jsonLdCustom: { "@type": "HowTo", name: "x" } }),
      SITE,
      "Torq Studio",
    );
    const types = ld.map((s) => s["@type"]);
    expect(types).toEqual(["WebPage", "Article", "BreadcrumbList", "FAQPage", "HowTo"]);
    expect(ld[0].isPartOf).toEqual({ "@id": `${SITE}/#website` });
    expect(ld[1].author).toEqual({ "@type": "Person", name: "Jane Doe" });
  });

  it("uses Service schema for service pages and ignores the empty custom sentinel", () => {
    const ld = buildPageJsonLd(page({ type: "SERVICE", path: "/services/web" }), SITE, "Torq Studio");
    expect(ld.map((s) => s["@type"])).toEqual(["WebPage", "Service", "BreadcrumbList", "FAQPage"]);
  });
});
