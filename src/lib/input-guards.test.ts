import { afterEach, describe, expect, it, vi } from "vitest";
import { isSafeRedirectPath } from "@/lib/redirects";
import { isHexColor } from "@/lib/theme";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { validateMediaUpload } from "@/lib/media";

describe("isSafeRedirectPath", () => {
  it.each(["/", "/blog", "/services/web?x=1", "/a/b#c"])("allows %s", (p) => {
    expect(isSafeRedirectPath(p)).toBe(true);
  });
  it.each(["//evil.com", "/\\evil.com", "https://evil.com", "evil", "", "/ space", "/\\/x"])(
    "rejects %s",
    (p) => {
      expect(isSafeRedirectPath(p)).toBe(false);
    },
  );
});

describe("isHexColor (theme colors are injected into a <style> tag)", () => {
  it.each(["#fff", "#A1B2C3", "#a1b2c3"])("allows %s", (c) => expect(isHexColor(c)).toBe(true));
  it.each([
    "red}</style><script>alert(1)</script>",
    "#ggg",
    "#a1b2c3dd",
    "rgb(1, 2, 3)",
    "url(x)",
    "expression(alert(1))",
    "red;color:blue",
    "",
  ])("rejects %s", (c) => expect(isHexColor(c)).toBe(false));
});

describe("clientIp", () => {
  it("prefers x-real-ip over a spoofable x-forwarded-for", () => {
    const h = new Headers({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "9.9.9.9, 1.1.1.1" });
    expect(clientIp(h)).toBe("1.1.1.1");
  });
  it("falls back to the first forwarded hop, then 'unknown'", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe("2.2.2.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("rateLimit", () => {
  it("blocks after the limit within the window", () => {
    const key = `test:${Math.random()}`;
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
    const third = rateLimit(key, 2, 60_000);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe("validateMediaUpload", () => {
  const file = (name: string, type: string) => new File(["x"], name, { type });

  it("accepts allow-listed types with matching extensions", () => {
    expect(validateMediaUpload(file("a.png", "image/png"))).toBeNull();
    expect(validateMediaUpload(file("doc.pdf", "application/pdf"))).toBeNull();
  });
  it("rejects HTML, mismatched extensions and unknown types", () => {
    expect(validateMediaUpload(file("x.html", "text/html"))).not.toBeNull();
    expect(validateMediaUpload(file("x.html", "image/png"))).not.toBeNull();
    expect(validateMediaUpload(file("x.exe", "application/octet-stream"))).not.toBeNull();
  });
  afterEach(() => vi.unstubAllEnvs());
  const setCloudinary = (on: boolean) => {
    for (const k of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) vi.stubEnv(k, on ? "x" : "");
  };

  it("rejects SVG when it would be served from our own origin", () => {
    setCloudinary(false);
    expect(validateMediaUpload(file("logo.svg", "image/svg+xml"))).toMatch(/Cloudinary/);
  });
  it("allows SVG when it goes to Cloudinary", () => {
    setCloudinary(true);
    expect(validateMediaUpload(file("logo.svg", "image/svg+xml"))).toBeNull();
  });
  it("refuses local-disk storage in production", () => {
    setCloudinary(false);
    vi.stubEnv("NODE_ENV", "production");
    expect(validateMediaUpload(file("a.png", "image/png"))).toMatch(/not configured/);
  });
});
