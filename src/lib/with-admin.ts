import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/api-response";

/** Wraps an admin route handler with the standard `isAdmin()` → 401 check. */
export function withAdmin<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse> | NextResponse,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    const ok = await isAdmin();
    if (!ok) return jsonError(401, "Unauthorized");
    return handler(...args);
  };
}
