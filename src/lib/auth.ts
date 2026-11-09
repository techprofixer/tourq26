import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { ADMIN_SESSION_MAX_AGE_SECONDS } from "@/lib/constants";

export const COOKIE_NAME = "admin_session";

/**
 * Admin auth is a single shared password (ADMIN_PASSWORD) exchanged for a signed, expiring
 * session cookie. There is deliberately no default password: if ADMIN_PASSWORD is unset,
 * every login attempt fails.
 *
 * Session tokens are `<expiresAtSeconds>.<nonce>.<signature>`, signed with ADMIN_SESSION_SECRET
 * (falls back to ADMIN_PASSWORD). Rotating either value invalidates every existing session.
 */
function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD?.trim();
  return value ? value : null;
}

function signingKey(): string | null {
  return process.env.ADMIN_SESSION_SECRET?.trim() || adminPassword();
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // Hash both sides first so the comparison is constant-time regardless of input length.
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** True when admin login is configured (ADMIN_PASSWORD is set). */
export function isAdminLoginConfigured(): boolean {
  return adminPassword() !== null;
}

/** Constant-time check of a submitted password against ADMIN_PASSWORD. */
export function verifyPassword(candidate: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

/** Issues a new signed session token valid for ADMIN_SESSION_MAX_AGE_SECONDS. */
export function createSessionToken(now: number = Date.now()): string {
  const key = signingKey();
  if (!key) throw new Error("Admin auth is not configured (ADMIN_PASSWORD missing)");
  const expiresAt = Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS;
  const payload = `${expiresAt}.${randomBytes(16).toString("base64url")}`;
  return `${payload}.${sign(payload, key)}`;
}

/** Validates signature and expiry of a session token. */
export function verifySession(token: string | undefined | null, now: number = Date.now()): boolean {
  const key = signingKey();
  if (!key || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expiresAt, nonce, signature] = parts;
  if (!safeEqual(signature, sign(`${expiresAt}.${nonce}`, key))) return false;
  const exp = Number(expiresAt);
  return Number.isFinite(exp) && exp > Math.floor(now / 1000);
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(COOKIE_NAME)?.value);
}

/** Cookie options shared by login (set) and logout (clear). */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};
