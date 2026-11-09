import { z } from "zod";
import {
  BUSINESS_TYPE_VALUES,
  TEAM_SIZE_VALUES,
  CURRENT_PROBLEM_VALUES,
  REQUESTED_SERVICE_VALUES,
  BUDGET_VALUES,
  TIMELINE_VALUES,
} from "./options";

export const MAX_MESSAGE_LENGTH = 2000;

/**
 * Authoritative server-side validation for POST /api/business-systems/audit. The client's
 * per-step validation is UX-only — this schema is what actually gates a DB write.
 * `website` field name is the honeypot (real "website" input is `companyWebsite`) — bots that
 * autofill every visible-looking field trip it; humans never see or fill it.
 */
export const auditLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(200),
  phone: z.string().trim().min(1, "Phone/WhatsApp is required").max(40),
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  companyWebsite: z.string().trim().max(300).optional().or(z.literal("")),

  businessType: z.enum(BUSINESS_TYPE_VALUES),
  teamSize: z.enum(TEAM_SIZE_VALUES),

  currentProblems: z.array(z.enum(CURRENT_PROBLEM_VALUES)).min(1, "Select at least one option"),
  requestedServices: z.array(z.enum(REQUESTED_SERVICE_VALUES)).min(1, "Select at least one option"),

  budget: z.enum(BUDGET_VALUES),
  timeline: z.enum(TIMELINE_VALUES),

  message: z.string().trim().max(MAX_MESSAGE_LENGTH).optional().or(z.literal("")),

  // Honeypot — must arrive empty. Named to look like a real field to naive bots.
  website: z.string().max(500).optional().or(z.literal("")),

  utmSource: z.string().trim().max(200).optional(),
  utmMedium: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
  utmTerm: z.string().trim().max(200).optional(),
  utmContent: z.string().trim().max(200).optional(),
  landingPage: z.string().trim().max(300).optional(),
});

export type AuditLeadInput = z.infer<typeof auditLeadSchema>;
