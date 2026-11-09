import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, isAdminLoginConfigured, verifyPassword, verifySession } from "@/lib/auth";
import { ADMIN_SESSION_MAX_AGE_SECONDS } from "@/lib/constants";

describe("admin auth", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_PASSWORD", "correct horse battery staple");
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("has no default password when ADMIN_PASSWORD is unset", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(isAdminLoginConfigured()).toBe(false);
    expect(verifyPassword("")).toBe(false);
    expect(verifyPassword("admin")).toBe(false);
    expect(() => createSessionToken()).toThrow();
  });

  it("verifies the configured password only", () => {
    expect(verifyPassword("correct horse battery staple")).toBe(true);
    expect(verifyPassword("correct horse battery stapl")).toBe(false);
    expect(verifyPassword("")).toBe(false);
  });

  it("accepts a fresh token and rejects it after expiry", () => {
    const now = Date.now();
    const token = createSessionToken(now);
    expect(verifySession(token, now)).toBe(true);
    expect(verifySession(token, now + (ADMIN_SESSION_MAX_AGE_SECONDS + 1) * 1000)).toBe(false);
  });

  it("issues unique tokens", () => {
    expect(createSessionToken()).not.toBe(createSessionToken());
  });

  it("rejects tampered, malformed and empty tokens", () => {
    const token = createSessionToken();
    const [exp, nonce, sig] = token.split(".");
    const farFuture = String(Number(exp) + 10 ** 6);
    expect(verifySession(`${farFuture}.${nonce}.${sig}`)).toBe(false);
    expect(verifySession(`${exp}.${nonce}.${sig.slice(0, -2)}xx`)).toBe(false);
    expect(verifySession("garbage")).toBe(false);
    expect(verifySession("")).toBe(false);
    expect(verifySession(undefined)).toBe(false);
  });

  it("invalidates sessions when the password or secret rotates", () => {
    const token = createSessionToken();
    vi.stubEnv("ADMIN_PASSWORD", "new password");
    expect(verifySession(token)).toBe(false);

    vi.stubEnv("ADMIN_SESSION_SECRET", "secret-a");
    const withSecret = createSessionToken();
    expect(verifySession(withSecret)).toBe(true);
    vi.stubEnv("ADMIN_SESSION_SECRET", "secret-b");
    expect(verifySession(withSecret)).toBe(false);
  });
});
