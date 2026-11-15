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
