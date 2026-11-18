import type { AuthoritySource } from "@/lib/ai/authority-sources";
import { z } from "zod";
import { TITLE_MAX, DESC_MAX, clampAtWord } from "@/lib/seo-generate";
import {
  buildFixBrief,
  cleanDraft,
  missingWords,
  expansionSchema,
  EXPANSION_CONTRACT,
  buildExpandBrief,
  mergeExpansion,
  ensureSourceLink,
  fullPageSchema,
  refineAudit,
  type FullPageDraft,
  type RefineAudit,
  type SeoAuditContext,
} from "@/lib/ai/full-page";

const HOUSE_VOICE = `You are a principal SEO content strategist and copywriter for a software studio's marketing site and admin CMS. Write in a confident, concrete, no-fluff voice: specific outcomes over vague adjectives, active voice, no filler like "in today's fast-paced world". Optimize for search intent and readability: match the likely intent behind the focus keyword or topic, work the primary keyword and its natural variants in early and organically (never keyword-stuff), favor short sentences and scannable structure over dense paragraphs, and write for a human reader first — the SEO benefit follows from genuinely answering the query well. Never invent statistics, client names, or claims that aren't given in the context — if the context lacks a detail, write around it rather than fabricating one.`;

/** Label of the "target length" control on long-form generation. Shared with the modal so the
 *  server can read the requested length back out of the brief and size the output budget. */
export const TARGET_WORDS_LABEL = "Target length (words)";

const LONG_FORM_BASE_TOKENS = 2600;
const LONG_FORM_MAX_TOKENS = 8000;

/** Persona + ranking rules for whole-page generation. Layered on HOUSE_VOICE: a senior engineer
 *  who has shipped this kind of work, writing so that both Google and answer engines (AI Overviews,
 *  ChatGPT, Perplexity, Claude) can lift accurate, self-contained statements from the page. */
const SENIOR_ENGINEER_PAGE_WRITER = `${HOUSE_VOICE}

You are also a senior software engineer and technical lead with 15+ years of shipping production systems, writing the way you would explain the topic to a smart buyer in a scoping call: concrete, opinionated where experience justifies it, honest about trade-offs and about when NOT to buy the service. Demonstrate experience through specifics — failure modes, sequencing, what you check first, what is usually underestimated — rather than claims of being "best" or "leading". Never invent a statistic, client, award, certification, price or timeline; if you lack a fact, describe the principle or process instead.

Write for ranking in Google AND for citation by answer engines:
- Answer first. The first sentence of every section and every FAQ answer directly states the answer; supporting detail follows. Each takeaway and FAQ answer must make sense when quoted on its own, naming the subject explicitly (no "it", "this", "that").
- Use the exact entity and category names consistently (the company name, the service name, the place). Define the topic in one clear sentence early on.
- Shape section headings around what people search and ask — at least two headings must be real questions ("How long does X take?", "When should you build custom instead of buying?"), the rest descriptive and keyword-aware.
- Cover the buyer's full decision: what it is, who it is for, how it works, process and deliverables, cost drivers and timeline factors (qualitative, no invented numbers), risks and trade-offs, how to choose, and what to do next.
- Prefer lists for steps and criteria, short paragraphs for reasoning. No paragraph over ~90 words.
- Internal links: link only to paths from the provided "Internal pages" list, using descriptive anchor text, 4-8 links spread across sections. Never invent a URL.
- Outbound links: ONLY when the brief gives "Authoritative sources to cite" or "Suggested authoritative sources". Then cite one or two with <a href='EXACT_URL'> using the URL exactly as given. Otherwise include no external links at all.

SEO SCORECARD — the finished page is machine-audited by an automated analyzer on exactly these rules, and each one must pass. Write to them deliberately:
1. The primary keyword appears verbatim (same words, same order) in: metaTitle, metaDescription, hero.heading (the H1), and the first 100 words of the page (hero.subheading counts).
2. metaTitle is 40-60 characters. metaDescription is 120-155 characters. Count them.
3. Keyword density is 0.8%-2% of the total words: about once per 80-120 words, spread across sections, headings and FAQs. Zero mentions fails; above 2.5% fails as stuffing — so NEVER repeat the exact phrase more than once per ~60 words. After the first mention in a section, switch to variants ('this service', pronouns, a reworded or shorter phrase) rather than repeating the phrase verbatim.
4. Every secondary keyword appears verbatim at least once in the body or meta description.
5. Total copy (hero + takeaways + sections + features + FAQs + CTA) is 1,000-2,200 words. Under 600 fails.
6. At least 3 internal links, from the allowed list. At least one section heading ends with a question mark (aim for two or three).
7. 3-5 takeaways and 6-8 FAQs. Section headings are real headings, never empty.
Also set seo.focusKeyword to the primary keyword you used.
- Banned: "in today's fast-paced world", "cutting-edge", "state-of-the-art", "game-changer", "revolutionary", "unlock the power", "seamless", "world-class", "best-in-class", "ever-evolving", and any marketing superlative you cannot prove.

HTML rules for every bodyHtml and FAQ answer: allowed tags are <p>, <ul>, <ol>, <li>, <strong>, <em>, <a>, <h3> only. Use SINGLE quotes for attributes (<a href='/contact'>) so the surrounding JSON stays valid. No <h1>/<h2> inside bodies — the section heading is a separate field.`;

/** ~2.2 tokens per word covers the prose plus its HTML tags; the base budget handles ≤ ~1,000 words. */
function longFormTokenBudget(brief: string): number {
  const match = brief.match(/Target length \(words\):\s*(\d+)/);
  const words = match ? Number(match[1]) : 0;
  return Math.min(LONG_FORM_MAX_TOKENS, Math.max(LONG_FORM_BASE_TOKENS, Math.round(words * 2.2) + 400));
}

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
  fullPage: "Whole page (SEO + AI-search optimised)",
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
  fullPage: [
    "Hero",
    "Key takeaways",
    "4–6 content sections",
    "Feature cards",
    "FAQs (schema-ready)",
    "Call to action",
    "Meta title, description and excerpt",
  ],
};

function ctx(context: Record<string, unknown>, key: string): string {
  const value = context[key];
  if (Array.isArray(value)) return value.join(", ");
  return typeof value === "string" ? value : "";
}

/** Same as `ctx`, but an empty value reads as "(none given)" instead of leaving a dangling label. */
function ctxOrNone(context: Record<string, unknown>, key: string, max = 3000): string {
  return ctx(context, key).trim().slice(0, max) || "(none given)";
}

/** Label of the extra field listing URLs the model may cite as outbound links. Last in the form, so
 *  everything after it in the brief is the editor's source list. */
export const SOURCES_LABEL = "Authoritative sources to cite (full URLs)";

/** The route passes the final (editor-edited) brief to hooks as `__brief`. */
function sourceUrls(context: Record<string, unknown>): string[] {
  const brief = ctx(context, "__brief");
  const at = brief.indexOf(SOURCES_LABEL);
  const fromEditor = at < 0 ? [] : (brief.slice(at).match(/https?:\/\/[^\s,;)<>"']+/g) ?? []);
  // Curated sources the route matched to the page topic (see authority-sources.ts).
  const auto = Array.isArray(context.autoSources) ? (context.autoSources as AuthoritySource[]).map((s) => s.url) : [];
  return [...new Set([...fromEditor, ...auto])];
}

/** Brief line listing the auto-picked sources; empty when none matched the topic. */
function autoSourcesLine(context: Record<string, unknown>): string {
  const auto = Array.isArray(context.autoSources) ? (context.autoSources as AuthoritySource[]) : [];
  if (auto.length === 0) return "";
  return `Suggested authoritative sources (cite one or two where they genuinely support a point, using the exact URL):\n${auto.map((s) => `- ${s.label}: ${s.url}`).join("\n")}`;
}

/** What the SEO analyzer needs to know about the page being written, taken from editor context. */
function auditContext(context: Record<string, unknown>): SeoAuditContext {
  const path = ctx(context, "path");
  return {
    title: ctx(context, "title"),
    slug: ctx(context, "slug") || path.split("/").filter(Boolean).pop(),
    focusKeyword: ctx(context, "focusKeyword"),
    secondaryKeywords: ctx(context, "secondaryKeywords")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

/** "Don't repeat the sibling cards / questions" line — empty when the item has no siblings. */
function avoidRepeating(context: Record<string, unknown>): string {
  const existing = ctx(context, "existing").trim();
  return existing ? `\nAlready on the page — write something different from these: ${existing.slice(0, 800)}` : "";
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
      /** Output budget derived from the (admin-edited) brief; wins over `maxOutputTokens`. */
      maxOutputTokensFor?(brief: string): number;
    }
  | {
      mode: "object";
      system: string;
      schema: ParsableSchema;
      buildBrief(context: Record<string, unknown>): string;
      responseContract: string;
      maxOutputTokens?: number;
      /** Enforces limits the model can't be trusted to count (e.g. character caps). `context` is the
       *  same (enriched) context the brief was built from. */
      postProcess?(result: Record<string, unknown>, context: Record<string, unknown>): Record<string, unknown>;
      /** Optional audit-and-fix loop: score the (post-processed) result, and when fixable problems
       *  remain the route runs ONE more model pass built from `buildFixBrief`, keeping whichever
       *  draft scores higher. Never makes the result worse. */
      refine?: {
        audit(result: Record<string, unknown>, context: Record<string, unknown>): RefineAudit;
        buildFixBrief(result: Record<string, unknown>, issues: string[], brief: string): string;
        /** Cheap fix for a draft that is too short: ask for ONLY the missing sections and merge them,
         *  instead of paying for a full rewrite. */
        expand?: {
          missingWords(result: Record<string, unknown>): number;
          schema: ParsableSchema;
          responseContract: string;
          buildBrief(result: Record<string, unknown>, missing: number, brief: string): string;
          merge(result: Record<string, unknown>, extra: Record<string, unknown>, context: Record<string, unknown>): Record<string, unknown>;
        };
      };
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
  | "brandVoiceDraft"
  | "fullPage";

/** Hard output cap and a best-guess real length for a task — the progress bar and ETA are scaled
 *  against `expected`, so a 150-token excerpt and a 6,000-token page both fill the bar sensibly. */
export function tokenPlan(def: TaskDef, brief: string): { max: number; expected: number } {
  const max = (def.mode === "text" ? def.maxOutputTokensFor?.(brief) : undefined) ?? def.maxOutputTokens ?? 700;
  const words = brief.match(/Target length \(words\):\s*(\d+)/);
  // ~2 tokens per word covers prose + HTML tags + JSON scaffolding; +500 for hero/meta/FAQ framing.
  const expected = words ? Number(words[1]) * 2 + 500 : Math.round(max * 0.5);
  return { max, expected: Math.max(50, Math.min(max, expected)) };
}

/** Full prompt sent to the model: the (possibly admin-edited) brief + the fixed, hidden format contract. */
export function buildFullPrompt(def: TaskDef, brief: string): string {
  return `${brief}\n\n${def.responseContract}\n\nFollow every length and format instruction above exactly — if a field asks for multiple sentences, write multiple full sentences, not one. Do not shortcut a field just because a shorter answer would also be valid English.`;
}

/** Vets links and caps lists on a whole-page draft, then guarantees an outbound source link. */
function postProcessFullPage(result: Record<string, unknown>, context: Record<string, unknown>): Record<string, unknown> {
  const links = ctx(context, "internalLinks")
    .split(/[\s,]+/)
    .filter((p) => p.startsWith("/"));
  const urls = sourceUrls(context);
  const labelled = urls.map((url) => ({
    url,
    label: (context.autoSources as AuthoritySource[] | undefined)?.find((a) => a.url === url)?.label ?? url,
  }));
  const cleaned = cleanDraft(result as FullPageDraft, links, urls);
  return ensureSourceLink(cleaned, labelled) as unknown as Record<string, unknown>;
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
      `Write SEO meta for this content.\nTitle: ${ctx(context, "title")}\nFocus keyword: ${ctx(context, "focusKeyword") || "(none given)"}\nContent: ${ctxOrNone(context, "bodyText")}`,
    responseContract: `Return JSON: { "metaTitle": string (<= ${TITLE_MAX} chars, includes the focus keyword naturally if one is given, no site name suffix), "metaDescription": string (<= ${DESC_MAX} chars, promises a concrete outcome) }.`,
    // Local models overshoot character limits routinely — clamp instead of trusting the count.
    postProcess: (r) => ({
      ...r,
      metaTitle: clampAtWord(String(r.metaTitle ?? ""), TITLE_MAX),
      metaDescription: clampAtWord(String(r.metaDescription ?? ""), DESC_MAX),
    }),
  },
  excerpt: {
    mode: "text",
    system: HOUSE_VOICE,
    buildBrief: (context) =>
      `Write a one- or two-sentence teaser excerpt (used on cards/listing pages, aim for ~${DESC_MAX} characters) for:\nTitle: ${ctx(context, "title")}\nContent: ${ctxOrNone(context, "bodyText")}`,
    responseContract: `Return ONLY the excerpt text, no quotes, no preamble.`,
    maxOutputTokens: 200,
  },
  longFormBody: {
    mode: "text",
    system: `${HOUSE_VOICE}\nOutput clean HTML using only <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, and <a> tags. Never include an <h1> — the page title already renders as the H1. Open with the takeaway, not a throat-clearing intro. Write at least 3-4 substantial paragraphs with section headings — a single short paragraph is not acceptable output for this task. If the brief specifies a paragraph count, target word count, a primary or secondary keyword, or things to avoid, treat those as hard requirements, not suggestions: hit the paragraph count exactly, work the primary keyword in naturally within the first paragraph and a few more times throughout, weave in secondary keywords where they fit naturally, and never include anything listed under "Avoid". A target word count is a floor, not a ceiling — if you're tempted to stop short of it, add another concrete example, detail, or elaboration to each paragraph instead of wrapping up early; running noticeably under the target is a bigger failure than running slightly over.`,
    buildBrief: (context) =>
      `Write the full body copy for a ${ctx(context, "contentType") || "page"} titled "${ctx(context, "title")}".\nBrief: ${ctxOrNone(context, "brief")}`,
    responseContract: `Return ONLY the HTML body content (no <html>/<head>/<body> wrapper, no markdown, no code fences).`,
    maxOutputTokens: LONG_FORM_BASE_TOKENS,
    maxOutputTokensFor: longFormTokenBudget,
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
      `Write a closing call-to-action section.\nPurpose: ${ctx(context, "purpose") || "get the visitor to take the next step"}\nAudience: ${ctx(context, "audience") || "a prospective client"}`,
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
      `Write one ${ctx(context, "kind") || "feature"} card for the theme: ${ctxOrNone(context, "theme")}.${avoidRepeating(context)}`,
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
      `Write one FAQ entry for a page about: ${ctxOrNone(context, "topic")}.\nPage context: ${ctxOrNone(context, "pageContext", 1500)}${avoidRepeating(context)}`,
    responseContract: `Return JSON: { "question": string (phrased as a real visitor would ask it), "answer": string (HTML, 2-4 sentences, direct answer first) }.`,
  },
  shortCopy: {
    mode: "text",
    system: HOUSE_VOICE,
    buildBrief: (context) =>
      `Write short copy for: ${ctx(context, "purpose")}.\nCurrent text (improve on it, keep any facts it states): ${ctx(context, "siteContext") || "(none yet)"}`,
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
      `Suggest 5-8 ${ctx(context, "what") || "relevant SEO keywords/tags"} for:\nTitle: ${ctx(context, "title")}\nContent: ${ctxOrNone(context, "bodyText")}`,
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
  fullPage: {
    mode: "object",
    system: SENIOR_ENGINEER_PAGE_WRITER,
    schema: fullPageSchema,
    // The editor can't know real URLs; the API route injects `internalLinks` (published page paths).
    buildBrief: (context) =>
      [
        `Write a complete, publish-ready ${ctx(context, "pageType") || "marketing"} page.`,
        `Page title: ${ctxOrNone(context, "title")}`,
        `URL path: ${ctx(context, "path") || "(not set)"}`,
        `Primary keyword: ${ctx(context, "focusKeyword") || "(infer the best one from the title)"}`,
        `Secondary keywords: ${ctx(context, "secondaryKeywords") || "(none given)"}`,
        `Audience and search intent: ${ctx(context, "audience") || "a buyer comparing providers, ready to evaluate"}`,
        `Internal pages you may link to (use ONLY these paths):\n${ctxOrNone(context, "internalLinks", 2500)}`,
        autoSourcesLine(context),
        ctx(context, "existingText").trim()
          ? `Existing copy to improve on (keep any true facts it states):\n${ctx(context, "existingText").slice(0, 3500)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    responseContract: `Return ONE JSON object with exactly these keys:
{
  "seo": { "metaTitle": string (40-${TITLE_MAX} chars, contains the primary keyword verbatim near the start, no site name), "metaDescription": string (120-${DESC_MAX} chars, contains the primary keyword verbatim, concrete benefit plus a soft call to action), "excerpt": string (1-2 sentences for cards and link previews), "focusKeyword": string (the primary keyword, verbatim) },
  "hero": { "eyebrow": string (2-4 words), "heading": string (the H1: includes the primary keyword, states the outcome, <= 14 words), "subheading": string (2-3 sentences, ~40-60 words, defines what the page offers and for whom) },
  "takeaways": string[] (3-5 standalone, quotable, factual statements — each names the subject explicitly),
  "sections": [ { "eyebrow": string (2-3 word label), "heading": string, "bodyHtml": string } ] (5-6 sections, ~120-220 words each, answer-first; at least two headings are questions; include one section on trade-offs or when NOT to choose this, and one on process or how it works),
  "features": { "heading": string, "items": [ { "title": string (2-5 words), "description": string (one concrete sentence, 15-25 words) } ] (4-6 items) },
  "faqs": [ { "question": string (as a buyer would type it), "answer": string (HTML, 2-4 sentences, direct answer in the first sentence) } ] (6-8 items covering cost drivers, timeline, process, risks, ownership, and how to start),
  "cta": { "heading": string, "body": string (2-3 sentences with a concrete next step), "primaryCtaLabel": string (2-4 words, verb first) }
}
Meet the target length given in the brief across sections and FAQs combined; a short page is a failure. Use single quotes inside HTML attributes.`,
    maxOutputTokens: LONG_FORM_MAX_TOKENS,
    postProcess: postProcessFullPage,
    // Same analyzer as the editor's SEO sidebar; one targeted rewrite when fixable checks fail.
    refine: {
      audit: (result, context) => refineAudit(result as FullPageDraft, auditContext(context)),
      buildFixBrief: (result, issues, brief) => buildFixBrief(result as FullPageDraft, issues, brief),
      expand: {
        missingWords: (result) => missingWords(result as FullPageDraft),
        schema: expansionSchema,
        responseContract: EXPANSION_CONTRACT,
        buildBrief: (result, missing, brief) => buildExpandBrief(result as FullPageDraft, missing, brief),
        merge: (result, extra, context) =>
          // Re-run the normal post-processing so new sections are link-vetted and capped like the rest.
          postProcessFullPage(
            mergeExpansion(result as FullPageDraft, extra as { sections: FullPageDraft["sections"] }) as unknown as Record<string, unknown>,
            context,
          ),
      },
    },
  },
};
