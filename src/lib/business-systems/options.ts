/**
 * Single source of truth for every multi-choice question on the /business-systems/audit
 * form. Shared by the client form (labels), the zod schema (validation), and the scoring
 * config (points) — add/rename an option here only, never duplicate the list elsewhere.
 */

export type Option<V extends string = string> = { value: V; label: string };

export const BUSINESS_TYPE_OPTIONS = [
  { value: "service_business", label: "Service Business" },
  { value: "agency", label: "Agency" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "distributor_trading", label: "Distributor / Trading" },
  { value: "saas_technology", label: "SaaS / Technology" },
  { value: "professional_services", label: "Professional Services" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const TEAM_SIZE_OPTIONS = [
  { value: "1-5", label: "1–5" },
  { value: "6-20", label: "6–20" },
  { value: "21-50", label: "21–50" },
  { value: "51-100", label: "51–100" },
  { value: "100+", label: "100+" },
] as const satisfies readonly Option[];

export const CURRENT_PROBLEM_OPTIONS = [
  { value: "whatsapp_scattered", label: "Leads are scattered across WhatsApp" },
  { value: "excel_sheets", label: "We're managing data in Excel / Google Sheets" },
  { value: "missed_followups", label: "Follow-ups are being missed" },
  { value: "manual_processes", label: "Too many manual processes" },
  { value: "crm_doesnt_fit", label: "Existing CRM doesn't fit our workflow" },
  { value: "tools_dont_communicate", label: "Tools don't communicate with each other" },
  { value: "need_reporting", label: "Need better reporting/dashboards" },
  { value: "want_automation", label: "Want to automate repetitive work" },
  { value: "want_ai", label: "Want to use AI in operations" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const REQUESTED_SERVICE_OPTIONS = [
  { value: "crm_lead_management", label: "CRM / Lead Management" },
  { value: "business_automation", label: "Business Automation" },
  { value: "custom_software", label: "Custom Business Software" },
  { value: "ai_automation", label: "AI Automation" },
  { value: "dashboard_analytics", label: "Dashboard / Analytics" },
  { value: "mobile_web_app", label: "Mobile / Web Application" },
  { value: "integrations", label: "Integrations" },
  { value: "not_sure", label: "Not sure yet" },
] as const satisfies readonly Option[];

export const BUDGET_OPTIONS = [
  { value: "50k-1l", label: "₹50K–₹1L" },
  { value: "1l-3l", label: "₹1L–₹3L" },
  { value: "3l-5l", label: "₹3L–₹5L" },
  { value: "5l-plus", label: "₹5L+" },
  { value: "not-sure", label: "Not sure yet" },
] as const satisfies readonly Option[];

export const TIMELINE_OPTIONS = [
  { value: "immediately", label: "Immediately" },
  { value: "within-30-days", label: "Within 30 days" },
  { value: "1-3-months", label: "1–3 months" },
  { value: "3-6-months", label: "3–6 months" },
  { value: "exploring", label: "Just exploring" },
] as const satisfies readonly Option[];

export type BusinessType = (typeof BUSINESS_TYPE_OPTIONS)[number]["value"];
export type TeamSize = (typeof TEAM_SIZE_OPTIONS)[number]["value"];
export type CurrentProblem = (typeof CURRENT_PROBLEM_OPTIONS)[number]["value"];
export type RequestedService = (typeof REQUESTED_SERVICE_OPTIONS)[number]["value"];
export type Budget = (typeof BUDGET_OPTIONS)[number]["value"];
export type Timeline = (typeof TIMELINE_OPTIONS)[number]["value"];

function values<V extends string>(options: readonly Option<V>[]): [V, ...V[]] {
  return options.map((o) => o.value) as [V, ...V[]];
}

export const BUSINESS_TYPE_VALUES = values(BUSINESS_TYPE_OPTIONS);
export const TEAM_SIZE_VALUES = values(TEAM_SIZE_OPTIONS);
export const CURRENT_PROBLEM_VALUES = values(CURRENT_PROBLEM_OPTIONS);
export const REQUESTED_SERVICE_VALUES = values(REQUESTED_SERVICE_OPTIONS);
export const BUDGET_VALUES = values(BUDGET_OPTIONS);
export const TIMELINE_VALUES = values(TIMELINE_OPTIONS);

export function labelFor(options: readonly Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
