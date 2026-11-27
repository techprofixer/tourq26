import { describe, expect, it } from "vitest";
import { isOfferBannerLive } from "@/lib/home-content";

const base = { offerBannerEnabled: true, offerBannerText: "Offer", offerBannerEndsAt: "" };

describe("isOfferBannerLive", () => {
  it("is live with no end date", () => {
    expect(isOfferBannerLive(base)).toBe(true);
  });
  it("is off when disabled or text is blank", () => {
    expect(isOfferBannerLive({ ...base, offerBannerEnabled: false })).toBe(false);
    expect(isOfferBannerLive({ ...base, offerBannerText: "  " })).toBe(false);
  });
  it("stays live through the end day and hides after it", () => {
    const home = { ...base, offerBannerEndsAt: "2026-11-30" };
    expect(isOfferBannerLive(home, new Date("2026-11-30T23:00:00Z"))).toBe(true);
    expect(isOfferBannerLive(home, new Date("2026-12-01T00:00:01Z"))).toBe(false);
  });
  it("ignores an unparsable end date", () => {
    expect(isOfferBannerLive({ ...base, offerBannerEndsAt: "soon" })).toBe(true);
  });
});

import {
  customHomeJsonLd,
  getDefaultHomeExtras,
  parseHomeExtras,
  validateJsonLdText,
} from "@/lib/home-content";

describe("parseHomeExtras", () => {
  it("returns defaults for missing / non-object input", () => {
    const d = getDefaultHomeExtras();
    expect(parseHomeExtras(null)).toEqual(d);
    expect(parseHomeExtras("nope")).toEqual(d);
    expect(parseHomeExtras([])).toEqual(d);
  });
  it("keeps valid stored values and falls back per-field on bad ones", () => {
    const out = parseHomeExtras({
      processHeading: "Our process",
      processEnabled: false,
      processSteps: "garbage",
      seoMetaTitle: "Custom title",
      faqItems: [{ question: "Q?", answer: "A." }],
    });
    expect(out.processHeading).toBe("Our process");
    expect(out.processEnabled).toBe(false);
    expect(out.processSteps).toEqual(getDefaultHomeExtras().processSteps);
    expect(out.seoMetaTitle).toBe("Custom title");
    expect(out.faqItems).toHaveLength(1);
  });
  it("treats blank headings as 'use default' but allows blank SEO overrides", () => {
    const out = parseHomeExtras({ processHeading: "  ", seoMetaTitle: "" });
    expect(out.processHeading).toBe(getDefaultHomeExtras().processHeading);
    expect(out.seoMetaTitle).toBe("");
  });
  it("an empty steps list falls back to defaults, but an empty FAQ list stays empty (auto mode)", () => {
    const out = parseHomeExtras({ processSteps: [], faqItems: [] });
    expect(out.processSteps).toEqual(getDefaultHomeExtras().processSteps);
    expect(out.faqItems).toEqual([]);
  });
});

describe("validateJsonLdText / customHomeJsonLd", () => {
  it("accepts blank, objects and arrays of objects", () => {
    expect(validateJsonLdText("")).toBeNull();
    expect(validateJsonLdText('{"@type":"Thing"}')).toBeNull();
    expect(validateJsonLdText('[{"@type":"Thing"},{"@type":"Other"}]')).toBeNull();
  });
  it("rejects malformed JSON and non-object payloads", () => {
    expect(validateJsonLdText("{oops")).toMatch(/Invalid JSON/);
    expect(validateJsonLdText("[1,2]")).toMatch(/object/);
    expect(validateJsonLdText('"str"')).toMatch(/object/);
    expect(validateJsonLdText("[]")).toMatch(/object/);
  });
  it("customHomeJsonLd never throws and returns objects only", () => {
    expect(customHomeJsonLd("{oops")).toEqual([]);
    expect(customHomeJsonLd('{"@type":"Thing"}')).toEqual([{ "@type": "Thing" }]);
  });
});
