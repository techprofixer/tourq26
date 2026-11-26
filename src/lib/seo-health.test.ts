import { describe, expect, it } from "vitest";
import { analyzePages, checkPage, summarize, type SeoPageInput } from "@/lib/seo-health";

const ok: SeoPageInput = {
  id: "a",
  kind: "page",
  path: "/a",
  name: "Mobile App Development",
  title: "Mobile App Development Services | Torq Studio",
  description:
    "Native and cross-platform mobile apps for startups and enterprises, from discovery to store launch and long-term support.",
  editHref: null,
};
const codes = (p: Partial<SeoPageInput>) => checkPage({ ...ok, ...p }).map((i) => i.code);

describe("checkPage", () => {
  it("passes a healthy page", () => expect(checkPage(ok)).toEqual([]));
  it("flags missing / long / short titles with the right severity", () => {
    expect(checkPage({ ...ok, title: "" })[0]).toMatchObject({ code: "title-missing", severity: "error" });
    expect(checkPage({ ...ok, title: "x".repeat(65) }).find((i) => i.code === "title-long")?.severity).toBe("warning");
    expect(checkPage({ ...ok, title: "x".repeat(75) }).find((i) => i.code === "title-long")?.severity).toBe("error");
    expect(codes({ title: "Short title" })).toContain("title-short");
  });
  it("flags description problems", () => {
    expect(checkPage({ ...ok, description: "" }).find((i) => i.code === "desc-missing")?.severity).toBe("error");
    expect(codes({ description: "too short" })).toContain("desc-short");
    expect(codes({ description: "y".repeat(170) })).toContain("desc-long");
  });
  it("reports noindex, canonical, image, alt and keyword gaps", () => {
    const c = codes({ noindex: true, canonicalElsewhere: "https://x.com", hasImage: false, hasImageAlt: false, hasFocusKeyword: false });
    expect(c).toEqual(expect.arrayContaining(["noindex", "canonical", "no-image", "no-alt", "no-keyword"]));
  });
  it("detects placeholder titles/headings without matching 'latest' or 'testimonials'", () => {
    expect(codes({ title: "Test page for the whole thing" })).toContain("junk-title");
    expect(codes({ headings: ["Section heading"] })).toContain("junk-heading");
    expect(codes({ headings: ["New page heading"] })).toContain("junk-heading");
    expect(codes({ headings: ["Latest testimonials"], title: "Latest news and testimonials | Torq Studio" })).toEqual([]);
  });
  it("detects raw-slug names and thin content", () => {
    expect(codes({ name: "web-development" })).toContain("raw-slug-name");
    expect(codes({ wordCount: 40 })).toContain("thin-content");
    expect(codes({ wordCount: 400 })).toEqual([]);
  });
});

describe("analyzePages / summarize", () => {
  it("marks duplicate titles and descriptions as errors and sorts errors first", () => {
    const reports = analyzePages([
      { ...ok, id: "1", path: "/1" },
      { ...ok, id: "2", path: "/2" },
      { ...ok, id: "3", path: "/3", title: "A unique and sufficiently long title", description: "z".repeat(100) },
    ]);
    expect(reports[0].issues.map((i) => i.code)).toEqual(expect.arrayContaining(["dup-title", "dup-desc"]));
    expect(reports[2].errors).toBe(0);
    const s = summarize(reports);
    expect(s).toMatchObject({ total: 3, withErrors: 2, clean: 1, score: 33 });
  });
});
