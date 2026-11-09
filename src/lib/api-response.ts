import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

/** Standard `{ error }` shape for API route error responses. */
export function jsonError(status: number, message: string, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ error: message }, { status, headers });
}

/**
 * Message safe to show a client for a caught error. Database/driver errors are logged and
 * replaced with `fallback` so schema details never reach the browser; validation errors and
 * our own thrown `Error`s keep their (intentionally user-facing) message.
 */
export function clientErrorMessage(e: unknown, fallback: string, logContext = "api"): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return "A record with that value already exists.";
  }
  if (e instanceof ZodError) return e.issues[0]?.message ?? fallback;
  if (
    e instanceof Prisma.PrismaClientKnownRequestError ||
    e instanceof Prisma.PrismaClientUnknownRequestError ||
    e instanceof Prisma.PrismaClientValidationError ||
    e instanceof Prisma.PrismaClientInitializationError ||
    e instanceof Prisma.PrismaClientRustPanicError
  ) {
    console.error(`[${logContext}]`, e);
    return fallback;
  }
  return e instanceof Error && e.message ? e.message : fallback;
}
