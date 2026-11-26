import { describe, expect, it } from "vitest";
import { fitDescription, seoTitle } from "@/lib/seo";
import { sanitizeBlogHtml } from "@/lib/blog-sanitize";

describe("seoTitle", () => {
  it("leaves short titles to the layout template", () => {
    expect(seoTitle("Mobile App Development")).toBe("Mobile App Development");
  });
  it("strips a site-name suffix baked into the stored title (no double suffix)", () => {
    expect(seoTitle("Software Development | Torq Studio")).toBe("Software Development");
  });
  it("drops the template suffix when title + suffix would overflow a SERP", () => {
    const t = "Open-weight LLMs close the gap on closed APIs in pilots";
    expect(seoTitle(t)).toEqual({ absolute: t });
  });
  it("truncates at a word boundary as a last resort", () => {
    const r = seoTitle("Open-weight LLMs close the gap on closed APIs in enterprise pilots for everyone") as {
      absolute: string;
    };
    expect(r.absolute.length).toBeLessThanOrEqual(60);
    expect(r.absolute.endsWith("…")).toBe(true);
  });
});

describe("fitDescription", () => {
  it("returns undefined for empty input", () => {
    expect(fitDescription("  ")).toBeUndefined();
  });
  it("keeps short text and trims long text to <=160 chars", () => {
    expect(fitDescription("Short and sweet.")).toBe("Short and sweet.");
    expect(fitDescription("word ".repeat(80))!.length).toBeLessThanOrEqual(160);
  });
});

describe("sanitizeBlogHtml", () => {
  it("demotes <h1> to <h2> so pages keep a single H1", () => {
    expect(sanitizeBlogHtml("<h1>Title</h1><p>x</p>")).toBe("<h2>Title</h2><p>x</p>");
  });
});

import { organizationJsonLd } from "@/lib/seo";
import { getDefaultOrgProfile, parseOrgProfile } from "@/lib/content";

describe("organizationJsonLd", () => {
  const base = { siteUrl: "https://x.test/", siteName: "X", description: "d", logo: "https://x.test/l.png" };
  it("omits blank profile fields and never emits an empty contactPoint", () => {
    const ld = organizationJsonLd({
      ...base,
      org: { ...getDefaultOrgProfile(), email: "", phone: "", locality: "", country: "", knowsAbout: [] },
    }) as Record<string, unknown>;
    expect(ld.contactPoint).toBeUndefined();
    expect(ld.address).toBeUndefined();
    expect(ld.knowsAbout).toBeUndefined();
    expect(ld.url).toBe("https://x.test");
  });
  it("includes contact, address, founding date and sameAs when provided", () => {
    const ld = organizationJsonLd({
      ...base,
      sameAs: ["https://linkedin.com/company/x"],
      org: { ...getDefaultOrgProfile(), phone: "+91 98000 00000", foundingYear: "2019", region: "MH" },
    }) as unknown as {
      contactPoint: { telephone: string };
      address: { addressRegion: string };
      foundingDate: string;
      sameAs: string[];
    };
    expect(ld.contactPoint.telephone).toBe("+91 98000 00000");
    expect(ld.address.addressRegion).toBe("MH");
    expect(ld.foundingDate).toBe("2019");
    expect(ld.sameAs).toEqual(["https://linkedin.com/company/x"]);
  });
});

describe("parseOrgProfile", () => {
  it("falls back to defaults on bad input and trims strings", () => {
    expect(parseOrgProfile(null)).toEqual(getDefaultOrgProfile());
    expect(parseOrgProfile({ email: "  a@b.co  ", knowsAbout: ["  AI ", "", 3] }).knowsAbout).toEqual(["AI"]);
    expect(parseOrgProfile({ email: "  a@b.co  " }).email).toBe("a@b.co");
  });
});
