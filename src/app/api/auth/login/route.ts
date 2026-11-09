import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionToken, ADMIN_PASSWORD, COOKIE_NAME } from "@/lib/auth";
import { jsonError } from "@/lib/api-response";
import { ADMIN_SESSION_MAX_AGE_SECONDS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (password !== ADMIN_PASSWORD) {
    return jsonError(401, "Invalid password");
  }

  const token = getSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
