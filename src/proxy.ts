import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getResolvedFeatureFlags } from "@/lib/feature-flags";
import { findActiveRedirect, isSafeRedirectPath } from "@/lib/redirects";
import { isEnvFlagOn } from "@/lib/env";
import { COOKIE_NAME, verifySession } from "@/lib/auth";
import { buildCsp } from "@/lib/csp";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Admin areas must never be indexed or cached by shared caches. */
function withAdminHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Defense in depth for /api/admin/*: every route also calls `withAdmin`, but rejecting here
 * means a new route that forgets the wrapper still can't leak data. Mutations must also come
 * from our own origin (CSRF guard on top of the SameSite=Strict cookie).
 */
function guardAdminApi(request: NextRequest): NextResponse | null {
  if (!verifySession(request.cookies.get(COOKIE_NAME)?.value)) {
    return withAdminHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }
  if (MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (origin && (!host || safeHost(origin) !== host)) {
      return withAdminHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
    }
  }
  return null;
}

function isAdminOrPublicAuthPath(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return true;
  if (pathname === "/api/auth/login") return true;
  if (pathname === "/api/auth/logout") return true;
  if (pathname === "/api/auth/session") return true;
  if (pathname.startsWith("/api/admin")) return true;
  return false;
}

function envMaintenanceOn(): boolean {
  return isEnvFlagOn(process.env.MAINTENANCE_MODE, false);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Never run feature flags / maintenance / redirects on Next.js assets (chunks, CSS, fonts, Turbopack).
  // If these paths hit middleware, responses can break (wrong MIME, 500) and the app shell fails to load.
  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    return guardAdminApi(request) ?? withAdminHeaders(NextResponse.next());
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Strict per-request nonce CSP. Next.js reads the nonce from the *request* CSP header and
    // stamps it onto its own scripts; the response header is what the browser enforces.
    const csp = buildCsp({
      nonce: Buffer.from(crypto.randomUUID()).toString("base64"),
      isDev: process.env.NODE_ENV === "development",
    });
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("Content-Security-Policy", csp);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", csp);
    return withAdminHeaders(response);
  }

  // Content-team-managed redirects (DB-backed, editable at /admin/redirects). Static infra-level
  // rules (host canonicalization, deploy-time path renames) live in next.config.ts's redirects()
  // instead — add those there, not here.
  if (!isAdminOrPublicAuthPath(pathname)) {
    const redirectRule = await findActiveRedirect(pathname);
    // Re-validate at serve time: rows saved before path validation existed could point off-site.
    if (redirectRule && isSafeRedirectPath(redirectRule.toPath)) {
      const target = new URL(redirectRule.toPath, request.nextUrl.origin);
      return NextResponse.redirect(target, redirectRule.permanent ? 301 : 302);
    }
  }

  const flags = await getResolvedFeatureFlags().catch(() => null);
  const maintenanceActive = envMaintenanceOn() || (flags?.maintenance_mode === true);

  if (maintenanceActive) {
    if (pathname === "/maintenance") return NextResponse.next();
    if (isAdminOrPublicAuthPath(pathname)) return NextResponse.next();
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "maintenance", message: "Site is in maintenance mode." },
        { status: 503 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.redirect(url);
  }

  if (!flags) {
    return NextResponse.next();
  }

  if (!flags.marketing_contact_form) {
    if (pathname === "/contact" || pathname.startsWith("/contact/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/feature-unavailable";
      url.searchParams.set("k", "marketing_contact_form");
      return NextResponse.redirect(url);
    }
    if (pathname === "/api/contact" && method === "POST") {
      return NextResponse.json(
        { error: "feature_disabled", message: "Contact form is temporarily disabled." },
        { status: 503 },
      );
    }
  }

  if (!flags.business_systems_audit) {
    if (pathname === "/business-systems" || pathname.startsWith("/business-systems/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/feature-unavailable";
      url.searchParams.set("k", "business_systems_audit");
      return NextResponse.redirect(url);
    }
    if (pathname === "/api/business-systems/audit" && method === "POST") {
      return NextResponse.json(
        { error: "feature_disabled", message: "The audit form is temporarily disabled." },
        { status: 503 },
      );
    }
  }

  if (!flags.marketing_blog && (pathname === "/blog" || pathname.startsWith("/blog/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/feature-unavailable";
    url.searchParams.set("k", "marketing_blog");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude everything under /_next (static chunks, media, image optimizer) — matcher is a hint; guard above is authoritative.
    "/((?!_next/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
