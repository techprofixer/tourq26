import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addContactSubmission } from "@/lib/content";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { jsonError } from "@/lib/api-response";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { MAX_CONTACT_MESSAGE_LENGTH } from "@/lib/constants";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.slice(0, max) : undefined));

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  email: z.string().trim().max(320).email("Enter a valid email address."),
  company: optionalText(200),
  message: z.string().trim().min(1, "Message is required.").max(MAX_CONTACT_MESSAGE_LENGTH, "Message is too long."),
  /** Honeypot — real users never see this field. */
  website: z.string().optional(),
  utmSource: optionalText(200),
  utmMedium: optionalText(200),
  utmCampaign: optionalText(200),
  utmTerm: optionalText(200),
  utmContent: optionalText(200),
  landingPage: optionalText(300),
});

export async function POST(request: NextRequest) {
  if (!(await isFeatureEnabled("marketing_contact_form"))) {
    return jsonError(503, "Contact form is temporarily disabled.");
  }

  const { allowed, retryAfterSeconds } = rateLimit(
    `contact:${clientIp(request.headers)}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS,
  );
  if (!allowed) {
    return jsonError(429, "Too many submissions. Please try again later.", {
      "Retry-After": String(retryAfterSeconds),
    });
  }

  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid submission.");
  }
  const { website, ...input } = parsed.data;
  // Bots fill the honeypot: pretend success so they don't retry, but store nothing.
  if (website) return NextResponse.json({ ok: true });

  try {
    await addContactSubmission({
      name: input.name,
      email: input.email,
      company: input.company ?? "",
      message: input.message,
      source: input.utmSource,
      medium: input.utmMedium,
      campaign: input.utmCampaign,
      term: input.utmTerm,
      content: input.utmContent,
      landingPage: input.landingPage,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Contact submission error:", e);
    return jsonError(500, "Something went wrong. Please try again or email us at contact@torqstudio.com.");
  }
}
