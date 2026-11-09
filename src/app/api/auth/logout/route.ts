import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return NextResponse.json({ ok: true });
}
