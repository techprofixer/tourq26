import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getResolvedFeatureFlags } from "@/lib/feature-flags";
import { findActiveRedirect } from "@/lib/redirects";
import { isEnvFlagOn } from "@/lib/env";

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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Never run feature flags / maintenance / redirects on Next.js assets (chunks, CSS, fonts, Turbopack).
  // If these paths hit middleware, responses can break (wrong MIME, 500) and the app shell fails to load.
  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Content-team-managed redirects (DB-backed, editable at /admin/redirects). Static infra-level
  // rules (host canonicalization, deploy-time path renames) live in next.config.ts's redirects()
  // instead — add those there, not here.
  if (!isAdminOrPublicAuthPath(pathname)) {
    const redirectRule = await findActiveRedirect(pathname);
    if (redirectRule) {
      const url = request.nextUrl.clone();
      const target = new URL(redirectRule.toPath, url.origin);
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
  runtime: "nodejs",
  matcher: [
    // Exclude everything under /_next (static chunks, media, image optimizer) — matcher is a hint; guard above is authoritative.
    "/((?!_next/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
