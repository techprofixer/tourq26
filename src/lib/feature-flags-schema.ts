export const FEATURE_FLAG_KEYS = [
  "maintenance_mode",
  "marketing_contact_form",
  "marketing_blog",
  "floating_whatsapp",
  "floating_chat_assistant",
  "dev_tools_code_playground",
  "business_systems_audit",
  "torqos_landing",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlagDefinition = {
  key: FeatureFlagKey;
  label: string;
  description: string;
  category: "Site" | "Marketing";
  defaultEnabled: boolean;
  envOverride?: string;
};

export const FEATURE_FLAG_DEFINITIONS: readonly FeatureFlagDefinition[] = [
  {
    key: "maintenance_mode",
    label: "Maintenance mode",
    description:
      "Public site shows a maintenance page. Admin (/admin) stays reachable. With Vercel KV, this applies at the edge; with files only, also set MAINTENANCE_MODE=true in .env for local testing.",
    category: "Site",
    defaultEnabled: false,
    envOverride: "MAINTENANCE_MODE",
  },
  {
    key: "marketing_contact_form",
    label: "Contact form & page",
    description: "Contact page and POST /api/contact submissions.",
    category: "Marketing",
    defaultEnabled: true,
    envOverride: "FF_MARKETING_CONTACT_FORM",
  },
  {
    key: "marketing_blog",
    label: "Blog",
    description: "All routes under /blog.",
    category: "Marketing",
    defaultEnabled: true,
    envOverride: "FF_MARKETING_BLOG",
  },
  {
    key: "floating_whatsapp",
    label: "Floating WhatsApp button",
    description: "Global floating chat button (requires NEXT_PUBLIC_WHATSAPP_NUMBER).",
    category: "Marketing",
    defaultEnabled: true,
    envOverride: "FF_FLOATING_WHATSAPP",
  },
  {
    key: "floating_chat_assistant",
    label: "Floating AI chat assistant",
    description:
      "Global floating chat widget answering visitor questions from site content (RAG over services, FAQs, blog, case studies). Requires GEMINI_API_KEY.",
    category: "Marketing",
    defaultEnabled: false,
    envOverride: "FF_FLOATING_CHAT_ASSISTANT",
  },
  {
    key: "dev_tools_code_playground",
    label: "API: Playground runs on /api/run",
    description:
      "When off, POST /api/run with source=playground returns 403 (legacy clients). Non-playground runs are unchanged. The public playground lives on the standalone Torq DevTools deployment.",
    category: "Site",
    defaultEnabled: true,
    envOverride: "FF_DEV_TOOLS_CODE_PLAYGROUND",
  },
  {
    key: "business_systems_audit",
    label: "Business Systems Audit (Meta Ads landing page)",
    description:
      "/business-systems, /business-systems/audit, and POST /api/business-systems/audit. Turn off between ad flights to stop accepting submissions without deleting the pages.",
    category: "Marketing",
    defaultEnabled: true,
    envOverride: "FF_BUSINESS_SYSTEMS_AUDIT",
  },
  {
    key: "torqos_landing",
    label: "torqOS product landing page",
    description: "/torqos — the torqOS business operating system product page.",
    category: "Marketing",
    defaultEnabled: true,
    envOverride: "FF_TORQOS_LANDING",
  },
] as const;

function parseEnvOverride(envName: string | undefined): boolean | undefined {
  if (!envName) return undefined;
  const raw = process.env[envName];
  if (raw === undefined || raw === "") return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes" || v === "on") return true;
  if (v === "false" || v === "0" || v === "no" || v === "off") return false;
  return undefined;
}

export function resolveFeatureFlagsFromStored(
  stored: Record<string, boolean>,
): Record<FeatureFlagKey, boolean> {
  const out = {} as Record<FeatureFlagKey, boolean>;
  for (const def of FEATURE_FLAG_DEFINITIONS) {
    const fromEnv = parseEnvOverride(def.envOverride);
    if (fromEnv !== undefined) {
      out[def.key] = fromEnv;
      continue;
    }
    if (typeof stored[def.key] === "boolean") {
      out[def.key] = stored[def.key] as boolean;
      continue;
    }
    out[def.key] = def.defaultEnabled;
  }
  return out;
}
