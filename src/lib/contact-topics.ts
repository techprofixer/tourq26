/**
 * Shared contact vocabulary: project topics (the contact form's chips), site categories (each gets
 * its own contact block at the bottom of its pages) and the WhatsApp message builder. No server
 * imports — used by both client and server components.
 */

export const CONTACT_EMAIL = "connect@torqstudio.com";

export const PROJECT_TOPICS = [
  { key: "mobile", label: "Mobile app" },
  { key: "web", label: "Web / API" },
  { key: "ai", label: "AI solution" },
  { key: "crm-erp", label: "CRM / ERP" },
  { key: "remote", label: "Remote engineers" },
  { key: "consulting", label: "Consulting / CTO" },
  { key: "other", label: "Something else" },
] as const;

export type TopicKey = (typeof PROJECT_TOPICS)[number]["key"];

export function topicLabel(key: string | null | undefined): string | undefined {
  return PROJECT_TOPICS.find((t) => t.key === key)?.label;
}

/** Maps a service slug to the matching form topic so "Contact us" on a service page preselects it. */
export function topicForSlug(slug: string | undefined): TopicKey | undefined {
  if (!slug) return undefined;
  if (slug.includes("mobile")) return "mobile";
  if (slug.includes("web")) return "web";
  if (slug.includes("ai")) return "ai";
  if (slug.includes("crm") || slug.includes("erp")) return "crm-erp";
  if (slug.includes("remote")) return "remote";
  if (slug.includes("consult") || slug.includes("cto")) return "consulting";
  return undefined;
}

export type CategoryKey =
  | "services"
  | "solutions"
  | "industries"
  | "technologies"
  | "locations"
  | "case-studies"
  | "blog"
  | "tech-news";

export const CONTACT_CATEGORIES: Record<
  CategoryKey,
  { label: string; eyebrow: string; headline: string; blurb: string }
> = {
  services: {
    label: "Services",
    eyebrow: "TALK TO OUR SERVICES TEAM",
    headline: "Not sure which service fits? Ask an engineer.",
    blurb: "Describe the problem. We'll tell you whether it's a build, a team, or an advisory block — and what it should cost.",
  },
  solutions: {
    label: "Solutions",
    eyebrow: "TALK TO OUR SOLUTIONS TEAM",
    headline: "Have this problem? Let's scope the fix.",
    blurb: "Share your current setup and constraints. You'll get a written next step, not a generic pitch.",
  },
  industries: {
    label: "Industries",
    eyebrow: "TALK TO A DOMAIN SPECIALIST",
    headline: "Building in your sector? Start with someone who knows it.",
    blurb: "Tell us about your compliance, integrations and users. We'll show how we've handled similar constraints.",
  },
  technologies: {
    label: "Technologies",
    eyebrow: "TALK TO A STACK EXPERT",
    headline: "Choosing or migrating a stack? Get a straight answer.",
    blurb: "Senior engineers who work in this stack daily will review your plan and flag the risks up front.",
  },
  locations: {
    label: "Locations",
    eyebrow: "TALK TO US IN YOUR TIME ZONE",
    headline: "Working near you, or fully remote — your call.",
    blurb: "Tell us where your team sits. We'll agree overlap hours, meeting cadence and on-site options.",
  },
  "case-studies": {
    label: "Case studies",
    eyebrow: "WANT RESULTS LIKE THESE?",
    headline: "Let's talk about your version of this project.",
    blurb: "Share your goal and timeline. We'll map what a comparable engagement would look like for you.",
  },
  blog: {
    label: "Blog",
    eyebrow: "QUESTIONS ABOUT THIS TOPIC?",
    headline: "Got a question this article didn't answer?",
    blurb: "Ask the engineers who wrote it. Short questions are welcome — no sales call required.",
  },
  "tech-news": {
    label: "Tech news",
    eyebrow: "HOW DOES THIS AFFECT YOUR STACK?",
    headline: "Wondering what this means for your product?",
    blurb: "Send us the context and we'll give you a practical read on risks and opportunities.",
  },
};

const PATH_PREFIX_TO_CATEGORY: Record<string, CategoryKey> = {
  services: "services",
  solutions: "solutions",
  industries: "industries",
  technologies: "technologies",
  locations: "locations",
  "case-studies": "case-studies",
  blog: "blog",
  "tech-news": "tech-news",
};

/** "/industries/healthcare" → "industries"; null for pages outside a category. */
export function categoryFromPath(path: string): CategoryKey | null {
  const first = path.split("/").filter(Boolean)[0];
  return (first && PATH_PREFIX_TO_CATEGORY[first]) || null;
}

/** Pre-filled WhatsApp opener. Shared by the contact form and the per-category CTAs. */
export function buildWhatsAppMessage(opts: {
  name?: string;
  company?: string;
  topic?: string;
  category?: string;
  from?: string;
  email?: string;
  phone?: string;
  message?: string;
}): string {
  const who = opts.name ? `Hi Torq Studio, I'm ${opts.name}${opts.company ? ` from ${opts.company}` : ""}.` : "Hi Torq Studio,";
  const lines = [who];
  if (opts.topic) lines.push(`Interested in: ${opts.topic}`);
  if (opts.category) lines.push(`Page: ${opts.category}${opts.from ? ` (${opts.from})` : ""}`);
  if (opts.message) lines.push("", opts.message.trim());
  const contact = [opts.email && `Email: ${opts.email}`, opts.phone && `Phone: ${opts.phone}`].filter(Boolean);
  if (contact.length) lines.push("", ...(contact as string[]));
  return lines.join("\n");
}
