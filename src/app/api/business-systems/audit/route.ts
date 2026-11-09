import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { jsonError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { auditLeadSchema } from "@/lib/business-systems/schema";
import { createAuditLead, findRecentDuplicateAuditLead } from "@/lib/audit-leads-content";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function stripTags(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  if (!(await isFeatureEnabled("business_systems_audit"))) {
    return jsonError(503, "The audit form is temporarily disabled.");
  }

  const ip = clientIp(request);
  const { allowed, retryAfterSeconds } = rateLimit(`audit-lead:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!allowed) {
    return jsonError(429, "Too many submissions. Please try again later.", {
      "Retry-After": String(retryAfterSeconds),
    });
  }

  try {
    const body = await request.json();
    const parsed = auditLeadSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid submission.");
    }
    const data = parsed.data;

    // Honeypot — bots that autofill every field trip this; humans never see it. Fail silently
    // (fake success) rather than a 400, so scrapers can't use the error to detect the trap.
    if (data.website) {
      return NextResponse.json({ ok: true });
    }

    const name = stripTags(data.name);
    const email = stripTags(data.email).toLowerCase();
    const phone = stripTags(data.phone);
    const companyName = stripTags(data.companyName);
    const companyWebsite = data.companyWebsite ? stripTags(data.companyWebsite) : undefined;
    const message = data.message ? stripTags(data.message) : undefined;

    // Resubmit / back-button double-click — pretend success without a second DB write.
    const isDuplicate = await findRecentDuplicateAuditLead(email, phone);
    if (isDuplicate) {
      return NextResponse.json({ ok: true });
    }

    const lead = await createAuditLead({
      name,
      email,
      phone,
      companyName,
      website: companyWebsite,
      businessType: data.businessType,
      teamSize: data.teamSize,
      currentProblems: data.currentProblems,
      requestedServices: data.requestedServices,
      budget: data.budget,
      timeline: data.timeline,
      message,
      source: data.utmSource,
      medium: data.utmMedium,
      campaign: data.utmCampaign,
      term: data.utmTerm,
      content: data.utmContent,
      landingPage: data.landingPage,
    });

    return NextResponse.json({ ok: true, leadId: lead.id });
  } catch (e) {
    console.error("Business systems audit submission error:", e);
    return jsonError(500, "Something went wrong. Please try again or email connect@torqstudio.com.");
  }
}
