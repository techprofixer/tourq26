import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildCsp } from "@/lib/csp";
import { track } from "@/lib/analytics";

describe("CSP allows Google Analytics on public pages only", () => {
  const pub = buildCsp({ isDev: false });
  it("allows the gtag loader and GA4 collection endpoints", () => {
    expect(pub).toMatch(/script-src[^;]*https:\/\/www\.googletagmanager\.com/);
    expect(pub).toMatch(/connect-src[^;]*https:\/\/www\.google-analytics\.com/);
    expect(pub).toMatch(/connect-src[^;]*https:\/\/\*\.analytics\.google\.com/);
  });
  it("keeps the strict nonce policy for admin free of third-party script origins", () => {
    const admin = buildCsp({ isDev: false, nonce: "abc" });
    expect(admin).not.toContain("googletagmanager.com/");
    expect(admin).toMatch(/script-src[^;]*'strict-dynamic'/);
  });
});

describe("track()", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { dataLayer: undefined, gtag: undefined });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("forwards events to gtag when GA4 is loaded", () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;
    track("cta_click", { cta_id: "hero" });
    expect(gtag).toHaveBeenCalledWith("event", "cta_click", { cta_id: "hero" });
  });
  it("never forwards page_view (GA4 records it itself, avoiding double counts)", () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;
    track("page_view");
    expect(gtag).not.toHaveBeenCalled();
  });
  it("queues on dataLayer when gtag isn't present", () => {
    track("whatsapp_click", { page_path: "/x" });
    expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toEqual([
      { event: "whatsapp_click", page_path: "/x" },
    ]);
  });
});

describe("<GoogleAnalytics />", () => {
  let pathname = "/";
  beforeEach(() => {
    vi.resetModules();
    pathname = "/";
    vi.doMock("next/navigation", () => ({ usePathname: () => pathname }));
    vi.doMock("next/script", () => ({
      default: (p: { id?: string; src?: string; children?: string }) =>
        createElement("script", { id: p.id, src: p.src, dangerouslySetInnerHTML: { __html: p.children ?? "" } }),
    }));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("next/navigation");
    vi.doUnmock("next/script");
  });

  const render = async () => {
    const { default: GoogleAnalytics } = await import("@/components/GoogleAnalytics");
    return renderToStaticMarkup(createElement(GoogleAnalytics));
  };

  it("loads gtag.js and configures the measurement ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-9Z8670Y6M2");
    const html = await render();
    expect(html).toContain("https://www.googletagmanager.com/gtag/js?id=G-9Z8670Y6M2");
    expect(html).toContain("gtag('config', 'G-9Z8670Y6M2')");
  });
  it("renders nothing when unset, for a non-GA4 ID (e.g. GTM container), or on /admin", async () => {
    expect(await render()).toBe("");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "GTM-ABC123");
    vi.resetModules();
    expect(await render()).toBe("");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-9Z8670Y6M2");
    pathname = "/admin/home";
    vi.resetModules();
    expect(await render()).toBe("");
  });
});
