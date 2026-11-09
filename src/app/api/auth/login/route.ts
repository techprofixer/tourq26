import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  isAdminLoginConfigured,
  verifyPassword,
} from "@/lib/auth";
import { jsonError } from "@/lib/api-response";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ADMIN_SESSION_MAX_AGE_SECONDS } from "@/lib/constants";

const LOGIN_ATTEMPTS_PER_WINDOW = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const limit = rateLimit(`login:${clientIp(request.headers)}`, LOGIN_ATTEMPTS_PER_WINDOW, LOGIN_WINDOW_MS);
  if (!limit.allowed) {
    return jsonError(429, "Too many attempts. Try again later.", {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  if (!isAdminLoginConfigured()) {
    console.error("[auth] ADMIN_PASSWORD is not set — admin login is disabled.");
    return jsonError(503, "Admin login is not configured");
  }

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password.slice(0, 256) : "";

  if (!verifyPassword(password)) {
    return jsonError(401, "Invalid password");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionToken(), {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ ok: true });
}
