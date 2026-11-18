import { describe, expect, it } from "vitest";
import { AUTHORITY_SOURCES, pickAuthoritySources } from "@/lib/ai/authority-sources";

describe("pickAuthoritySources", () => {
  it("matches sources to the page topic", () => {
    const urls = pickAuthoritySources("Mobile app development for iOS and Android").map((s) => s.url);
    expect(urls.some((u) => u.includes("apple.com") || u.includes("android.com"))).toBe(true);
  });

  it("returns at most two and nothing for an unrelated topic", () => {
    expect(pickAuthoritySources("cloud ai security api web development seo").length).toBeLessThanOrEqual(2);
    expect(pickAuthoritySources("Best pizza in town")).toEqual([]);
  });

  it("only lists https URLs with no duplicates", () => {
    const urls = AUTHORITY_SOURCES.map((s) => s.url);
    expect(urls.every((u) => u.startsWith("https://"))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
