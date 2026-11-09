import { z } from "zod";
import { TITLE_MAX, DESC_MAX } from "@/lib/seo-generate";

const HOUSE_VOICE = `You are a principal SEO content strategist and copywriter for a software studio's marketing site and admin CMS. Write in a confident, concrete, no-fluff voice: specific outcomes over vague adjectives, active voice, no filler like "in today's fast-paced world". Optimize for search intent and readability: match the likely intent behind the focus keyword or topic, work the primary keyword and its natural variants in early and organically (never keyword-stuff), favor short sentences and scannable structure over dense paragraphs, and write for a human reader first — the SEO benefit follows from genuinely answering the query well. Never invent statistics, client names, or claims that aren't given in the context — if the context lacks a detail, write around it rather than fabricating one.`;

export const TASK_LABELS: Record<string, string> = {
  seoMetaPair: "SEO title & description",
  excerpt: "Excerpt",
  longFormBody: "Body copy",
  heroCopy: "Hero section",
  ctaCopy: "Call to action",
  itemCopy: "Card copy",
  faqItem: "FAQ entry",
  shortCopy: "Short copy",
  polishQuote: "Polish testimonial",
  keywordSuggestions: "Keyword suggestions",
  brandVoiceDraft: "Brand voice draft",
};

/** Human-readable names of the fields each task fills — shown in the modal, not sent to the model. */
export const TASK_FIELDS: Record<string, string[]> = {
  seoMetaPair: ["Meta title", "Meta description"],
  excerpt: ["Excerpt"],
  longFormBody: ["Body"],
  heroCopy: ["Eyebrow", "Heading", "Subheading"],
  ctaCopy: ["Heading", "Body", "Button label"],
  itemCopy: ["Title", "Description"],
  faqItem: ["Question", "Answer"],
  shortCopy: ["Text"],
  polishQuote: ["Quote", "Result tag"],
  keywordSuggestions: ["Keywords"],
  brandVoiceDraft: ["Voice description", "Guidelines"],
};

function ctx(context: Record<string, unknown>, key: string): string {
  const value = context[key];
  if (Array.isArray(value)) return value.join(", ");
  return typeof value === "string" ? value : "";
}

/** Matches zod's `safeParse` structurally, without depending on zod's (invariant) generic types. */
type ParsableSchema = {
  safeParse(data: unknown): { success: true; data: Record<string, unknown> } | { success: false };
};

export type TaskDef =
  | {
      mode: "text";
      system: string;
      /** Plain-language brief — shown to and editable by the admin. No output-format instructions here. */
      buildBrief(context: Record<string, unknown>): string;
      /** Fixed output-format contract, always appended server-side, never shown to the admin. */
      responseContract: string;
      maxOutputTokens?: number;
    }
  | {
      mode: "object";
      system: string;
      schema: ParsableSchema;
      buildBrief(context: Record<string, unknown>): string;
      responseContract: string;
      maxOutputTokens?: number;
    };

export type TaskName =
  | "seoMetaPair"
  | "excerpt"
  | "longFormBody"
  | "heroCopy"
  | "ctaCopy"
  | "itemCopy"
  | "faqItem"
  | "shortCopy"
  | "polishQuote"
  | "keywordSuggestions"
  | "brandVoiceDraft";

/** Full prompt sent to the model: the (possibly admin-edited) brief + the fixed, hidden format contract. */
export function buildFullPrompt(def: TaskDef, brief: string): string {
  return `${brief}\n\n${def.responseContract}\n\nFollow every length and format instruction above exactly — if a field asks for multiple sentences, write multiple full sentences, not one. Do not shortcut a field just because a shorter answer would also be valid English.`;
}

export const TASKS: Record<TaskName, TaskDef> = {
  seoMetaPair: {
    mode: "object",
    system: HOUSE_VOICE,
    schema: z.object({
      metaTitle: z.string(),
      metaDescription: z.string(),
    }),
    buildBrief: (context) =>
      `Write SEO meta for this content.\nTitle: ${ctx(context, "title")}\nFocus keyword: ${ctx(context, "focusKeyword") || "(none given)"}\nContent: ${ctx(context, "bodyText").slice(0, 3000)}`,
    responseContract: `Return JSON: { "metaTitle": string (<= ${TITLE_MAX} chars, includes the focus keyword naturally if one is given), "metaDescription": string (<= ${DESC_MAX} chars, promises a concrete outcome) }.`,
  },
  excerpt: {
    mode: "text",
    system: HOUSE_VOICE,
    buildBrief: (context) =>
      `Write a one- or two-sentence teaser excerpt (used on cards/listing pages, aim for ~${DESC_MAX} characters) for:\nTitle: ${ctx(context, "title")}\nContent: ${ctx(context, "bodyText").slice(0, 3000)}`,
    responseContract: `Return ONLY the excerpt text, no quotes, no preamble.`,
    maxOutputTokens: 200,
  },
  longFormBody: {
    mode: "text",
    system: `${HOUSE_VOICE}\nOutput clean HTML using only <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>, and <a> tags. Never include an <h1> — the page title already renders as the H1. Open with the takeaway, not a throat-clearing intro. Write at least 3-4 substantial paragraphs with section headings — a single short paragraph is not acceptable output for this task. If the brief specifies a paragraph count, target word count, a primary or secondary keyword, or things to avoid, treat those as hard requirements, not suggestions: hit the paragraph count exactly, work the primary keyword in naturally within the first paragraph and a few more times throughout, weave in secondary keywords where they fit naturally, and never include anything listed under "Avoid". A target word count is a floor, not a ceiling — if you're tempted to stop short of it, add another concrete example, detail, or elaboration to each paragraph instead of wrapping up early; running noticeably under the target is a bigger failure than running slightly over.`,
    buildBrief: (context) =>
      `Write the full body copy for a ${ctx(context, "contentType") || "page"} titled "${ctx(context, "title")}".\nBrief: ${ctx(context, "brief").slice(0, 3000)}`,
    responseContract: `Return ONLY the HTML body content (no <html>/<head>/<body> wrapper).`,
    maxOutputTokens: 2600,
  },
  heroCopy: {
    mode: "object",
    system: HOUSE_VOICE,
    schema: z.object({
      eyebrow: z.string(),
      heading: z.string(),
      subheading: z.string(),
    }),
    buildBrief: (context) =>
      `Write hero-banner copy for a page about: ${ctx(context, "topic")}.\nPurpose: ${ctx(context, "purpose") || "convert a first-time visitor"}`,
    responseContract: `Return JSON: { "eyebrow": string (2-4 words, a short label above the heading), "heading": string (one complete, natural sentence naming the outcome, up to ~12 words), "subheading": string (a short paragraph of 2-3 complete sentences, ~35-55 words total — not just one line, expand with a concrete detail or proof point) }.`,
  },
  ctaCopy: {
    mode: "object",
    system: HOUSE_VOICE,
    schema: z.object({
      heading: z.string(),
      body: z.string(),
      primaryCtaLabel: z.string(),
    }),
    buildBrief: (context) =>
      `Write a closing call-to-action section.\nPurpose: ${ctx(context, "purpose")}\nAudience: ${ctx(context, "audience") || "a prospective client"}`,
    responseContract: `Return JSON: { "heading": string (short, direct), "body": string (write exactly 2 to 4 complete sentences as one short paragraph — a single sentence is never acceptable here, expand with a concrete benefit or next step if needed), "primaryCtaLabel": string (2-4 word button label, verb-first) }.`,
  },
  itemCopy: {
    mode: "object",
    system: HOUSE_VOICE,
    schema: z.object({
      title: z.string(),
      description: z.string(),
    }),
    buildBrief: (context) =>
      `Write one ${ctx(context, "kind") || "feature"} card for the theme: ${ctx(context, "theme")}.`,
    responseContract: `Return JSON: { "title": string (2-5 words), "description": string (one sentence, ~15-25 words, concrete outcome not adjectives) }.`,
  },
  faqItem: {
    mode: "object",
    system: `${HOUSE_VOICE}\nThe answer may use <p>, <strong>, <em>, <ul>, <li> tags.`,
    schema: z.object({
      question: z.string(),
      answer: z.string(),
    }),
    buildBrief: (context) =>
      `Write one FAQ entry for a page about: ${ctx(context, "topic")}.\nPage context: ${ctx(context, "pageContext").slice(0, 1500)}`,
    responseContract: `Return JSON: { "question": string (phrased as a real visitor would ask it), "answer": string (HTML, 2-4 sentences, direct answer first) }.`,
  },
  shortCopy: {
    mode: "text",
    system: HOUSE_VOICE,
    buildBrief: (context) =>
      `Write short copy for: ${ctx(context, "purpose")}.\nSite context: ${ctx(context, "siteContext") || "(none given)"}`,
    responseContract: `Return ONLY the copy text, no quotes, no preamble. 1-2 sentences.`,
    maxOutputTokens: 150,
  },
  polishQuote: {
    mode: "object",
    system: `${HOUSE_VOICE}\nYou are polishing the WORDING of a real customer quote the admin has drafted — tighten grammar and flow only. Never add claims, numbers, names, or outcomes that are not already present in the given quote. If the input is empty or too vague to polish, return it unchanged.`,
    schema: z.object({
      quote: z.string(),
      result: z.string(),
    }),
    buildBrief: (context) =>
      `Polish this customer testimonial's wording without changing its meaning or adding new claims:\nDraft quote: ${ctx(context, "rawQuote")}\nResult tag (short phrase, e.g. "40% faster launch"): ${ctx(context, "result") || "(none given — leave as empty string)"}`,
    responseContract: `Return JSON: { "quote": string, "result": string }.`,
  },
  keywordSuggestions: {
    mode: "object",
    system: HOUSE_VOICE,
    schema: z.object({
      keywords: z.array(z.string()),
    }),
    buildBrief: (context) =>
      `Suggest 5-8 relevant SEO keywords/tags for:\nTitle: ${ctx(context, "title")}\nContent: ${ctx(context, "bodyText").slice(0, 3000)}`,
    responseContract: `Return JSON: { "keywords": string[] } — short (1-3 word) phrases, no duplicates, no hashtags.`,
  },
  brandVoiceDraft: {
    mode: "object",
    system: `${HOUSE_VOICE}\nYou are drafting a starting-point brand voice guide, not a final one — the admin will edit it. Keep both fields short and usable, not a marketing essay.`,
    schema: z.object({
      voiceDescription: z.string(),
      voiceGuidelines: z.string(),
    }),
    buildBrief: (context) => `Draft a brand voice guide for this business:\n${ctx(context, "businessDescription")}`,
    responseContract: `Return JSON: { "voiceDescription": string (2-3 sentences describing the tone, e.g. "confident, direct, technical but not jargon-heavy"), "voiceGuidelines": string (3-5 short do's/don'ts as a single newline-separated list, e.g. "Do: lead with outcomes.\\nDon't: use hype words like 'revolutionary'.") }.`,
  },
};
