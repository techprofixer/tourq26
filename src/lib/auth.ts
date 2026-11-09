import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export const COOKIE_NAME = "admin_session";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin";

export function getSessionToken(): string {
  return createHmac("sha256", ADMIN_PASSWORD).update("admin").digest("hex");
}

export function verifySession(token: string): boolean {
  const expected = getSessionToken();
  try {
    return token.length === expected.length && timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return !!token && verifySession(token);
}

export async function requireAdmin(): Promise<boolean> {
  const ok = await isAdmin();
  if (!ok) return false;
  return true;
}
