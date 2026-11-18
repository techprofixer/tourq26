import { describe, expect, it } from "vitest";
import { blockSchema } from "@/lib/cms/blocks";
import {
  buildFixBrief,
  cleanDraft,
  fullPageSchema,
  fullPageToBlocks,
  lintDraft,
  refineAudit,
  ensureSourceLink,
  missingWords,
  buildExpandBrief,
  mergeExpansion,
  sanitizeLinks,
} from "@/lib/ai/full-page";

const draft = fullPageSchema.parse({
  seo: {
    metaTitle: "Custom CRM Development Services for Growing Sales Teams Worldwide Today",
    metaDescription: "x".repeat(200),
    excerpt: "A short excerpt.",
  },
  hero: { eyebrow: "CRM", heading: "CRM development that fits how you sell", subheading: "Sub." },
  takeaways: ["Torq Studio builds CRMs.", "CRMs fit workflows."],
  sections: [
    { heading: "What is CRM development?", bodyHtml: "<p>CRM development is X.</p>" },
    { heading: "How does it work", bodyHtml: "<p>See <a href='/services/crm-development'>CRM</a>.</p>" },
    { heading: "Pricing", bodyHtml: "<p>Costs vary.</p>" },
  ],
  features: { heading: "What you get", items: [{ title: "Pipelines", description: "Custom stages." }] },
  faqs: [
    { question: "How long?", answer: "<p>Months.</p>" },
    { question: "Cost?", answer: "<p>Varies.</p>" },
    { question: "Own code?", answer: "<p>Yes.</p>" },
  ],
  cta: { heading: "Talk to us", body: "Book a call.", primaryCtaLabel: "Book a call" },
});

describe("sanitizeLinks", () => {
  it("keeps allowed internal links and normalises them", () => {
    const out = sanitizeLinks("<a href='/services/crm/?x=1'>CRM</a>", ["/services/crm"]);
    expect(out).toBe('<a href="/services/crm">CRM</a>');
  });

  it("unwraps invented internal paths and external links to plain text", () => {
    const out = sanitizeLinks(
      "<p><a href='/made-up'>one</a> and <a href=\"https://example.com\">two</a></p>",
      [],
    );
    expect(out).toBe("<p>one and two</p>");
  });

  it("always allows the contact page and hubs", () => {
    expect(sanitizeLinks("<a href='/contact'>Hi</a>", [])).toContain('href="/contact"');
    expect(sanitizeLinks("<a href='/services'>Hi</a>", [])).toContain('href="/services"');
  });
});

describe("cleanDraft", () => {
  it("clamps meta lengths and vets links", () => {
    const cleaned = cleanDraft(draft, []);
    expect(cleaned.seo.metaTitle.length).toBeLessThanOrEqual(60);
    expect(cleaned.seo.metaDescription.length).toBeLessThanOrEqual(155);
    // /services/crm-development wasn't passed as allowed, so the link is unwrapped.
    expect(cleaned.sections[1].bodyHtml).not.toContain("<a");
  });
});

describe("fullPageToBlocks", () => {
  it("produces blocks that all satisfy the CMS block schema", () => {
    const blocks = fullPageToBlocks(cleanDraft(draft, []));
    for (const b of blocks) expect(blockSchema.safeParse(b).success).toBe(true);
    expect(new Set(blocks.map((b) => b.id)).size).toBe(blocks.length);
  });

  it("orders hero → summary → sections → faq → cta, with the feature grid after section two", () => {
    const types = fullPageToBlocks(draft).map((b) => b.type);
    expect(types).toEqual([
      "hero",
      "summary",
      "contentSection",
      "contentSection",
      "featureGrid",
      "contentSection",
      "faq",
      "cta",
    ]);
  });

  it("omits the feature grid when there are no feature items", () => {
    const types = fullPageToBlocks({ ...draft, features: { heading: "", items: [] } }).map((b) => b.type);
    expect(types).not.toContain("featureGrid");
  });
});

describe("lintDraft", () => {
  it("flags filler and unsourced figures", () => {
    const codes = lintDraft({
      ...draft,
      takeaways: ["Our cutting-edge platform boosts conversion by 40%.", "Second."],
    }).map((w) => w.code);
    expect(codes).toEqual(expect.arrayContaining(["filler", "unsourced-stats"]));
  });

  it("is quiet on clean copy", () => {
    expect(lintDraft(draft)).toEqual([]);
  });
});

describe("sanitizeLinks with external sources", () => {
  it("keeps only external URLs the editor supplied", () => {
    const html = "<a href='https://good.example/doc/'>ok</a> <a href='https://bad.example'>no</a>";
    expect(sanitizeLinks(html, [], ["https://good.example/doc"])).toBe(
      '<a href="https://good.example/doc">ok</a> no',
    );
  });
});

describe("SEO audit (same analyzer as the editor sidebar)", () => {
  const ctx = {
    title: "CRM Development",
    slug: "crm-development",
    focusKeyword: "crm development",
    secondaryKeywords: ["custom crm"],
  };

  it("finds the failures the sidebar would show", () => {
    const audit = refineAudit(cleanDraft(draft, ["/services/crm-development"]), ctx);
    const issues = audit.issues.join("\n");
    // Meta description is junk with no keyword; copy is far under the length floor.
    expect(issues).toMatch(/Keyword in meta description/);
    expect(issues).toMatch(/Content length/);
    expect(audit.total).toBeGreaterThan(audit.passed);
  });

  it("separates what the AI can fix from what needs a human", () => {
    const audit = refineAudit(draft, ctx);
    // No images and no share image: reported as remaining, but never sent to the model to "fix".
    expect(audit.remaining.map((r) => r.id)).toEqual(expect.arrayContaining(["imageAlt", "aeoSocialImage"]));
    expect(audit.issues.join("\n")).not.toMatch(/Image alt text|Social share image/);
  });

  it("never spends a model pass on outbound links — they are added locally", () => {
    expect(refineAudit(draft, ctx).issues.join("\n")).not.toMatch(/Outbound links/);
    const linked = ensureSourceLink(draft, [{ url: "https://owasp.org/www-project-top-ten/", label: "OWASP Top 10" }]);
    const html = linked.sections.map((x) => x.bodyHtml).join(" ");
    expect(html).toContain("<a href='https://owasp.org/www-project-top-ten/'>OWASP Top 10</a>");
    // Already cited: left alone.
    expect(ensureSourceLink(linked, [{ url: "https://x.dev/", label: "X" }])).toBe(linked);
  });

  it("scores higher once the keyword is in the meta description", () => {
    const better = {
      ...draft,
      seo: { ...draft.seo, metaDescription: "Custom CRM development for sales teams that have outgrown spreadsheets. Book a call." },
    };
    expect(refineAudit(better, ctx).passed).toBeGreaterThan(refineAudit(draft, ctx).passed);
  });

  it("builds a fix brief carrying the brief, the draft and every issue", () => {
    const brief = buildFixBrief(draft, ["Content length: too short"], "Primary keyword: crm development");
    expect(brief).toContain("Primary keyword: crm development");
    expect(brief).toContain("Content length: too short");
    expect(brief).toContain('"heading":"CRM development that fits how you sell"');
  });
});

describe("keyword stuffing guidance", () => {
  it("gives the fix pass a concrete mention count when density is too high", () => {
    const stuffed = {
      ...draft,
      seo: { ...draft.seo, focusKeyword: "crm" },
      sections: draft.sections.map((s) => ({ ...s, bodyHtml: `<p>${"crm ".repeat(60)}</p>` })),
    };
    const { issues } = refineAudit(stuffed, { title: "CRM", focusKeyword: "crm" });
    expect(issues.some((i) => i.startsWith("Keyword density") && /about \d+ mentions/.test(i))).toBe(true);
  });
});

describe("1,000-word minimum", () => {
  const ctx = { title: "CRM Development", slug: "crm-development", focusKeyword: "crm development", secondaryKeywords: ["custom crm"] };
  const long = (words: number) => ({
    ...draft,
    sections: [{ heading: "Long section", bodyHtml: `<p>${"word ".repeat(words)}</p>` }],
  });

  it("the editor's length check warns below 1,000 words and passes at 1,000+", () => {
    const status = (d: typeof draft) => refineAudit(d, ctx).remaining.find((r) => r.id === "contentLength");
    expect(status(long(650))?.detail).toMatch(/below the 1,000-word minimum/);
    expect(status(long(1100))).toBeUndefined();
  });

  it("reports how many words to add, with a margin, and nothing once long enough", () => {
    expect(missingWords(long(1100))).toBe(0);
    expect(missingWords(long(500))).toBeGreaterThan(400);
  });

  it("builds an expand brief that avoids existing headings, and merges the new sections in", () => {
    const brief = buildExpandBrief(draft, 450, "Primary keyword: crm development");
    expect(brief).toContain(`- ${draft.sections[0].heading}`);
    expect(brief).toMatch(/at least 450 words/);
    const merged = mergeExpansion(draft, { sections: [{ heading: "New", bodyHtml: "<p>x</p>" }] });
    expect(merged.sections.at(-1)?.heading).toBe("New");
    expect(merged.sections.length).toBe(draft.sections.length + 1);
  });
});
