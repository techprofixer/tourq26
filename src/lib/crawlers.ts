import type { MetadataRoute } from "next";

/**
 * Crawler policy for robots.txt.
 *
 * robots.txt groups don't inherit: a bot that matches a named group ignores `User-agent: *`
 * entirely, so every named group below repeats the private-path disallows.
 */

/** Paths no crawler should fetch. */
export const PRIVATE_PATHS = ["/admin", "/api/"];

/** Search & answer-engine crawlers — they fetch pages to cite/link them in results. Always allowed:
 *  blocking these removes the site from AI answers (ChatGPT Search, Perplexity, Claude, Copilot). */
export const AI_SEARCH_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "DuckAssistBot",
  "MistralAI-User",
] as const;

/** Training-only crawlers / opt-out tokens — content goes into model training corpora. */
export const AI_TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Meta-ExternalAgent",
  "Bytespider",
  "cohere-training-data-crawler",
  "Amazonbot",
] as const;

export function buildRobotsRules(opts: {
  /** Staging / preview: disallow everything. */
  noIndex: boolean;
  /** Disallow training-only crawlers; search/answer crawlers stay allowed. */
  blockAiTraining: boolean;
}): MetadataRoute.Robots["rules"] {
  if (opts.noIndex) return [{ userAgent: "*", disallow: "/" }];

  const allowGroup = { allow: "/", disallow: PRIVATE_PATHS };
  return [
    { userAgent: "*", ...allowGroup },
    // Named explicitly so a future blanket rule can't silently drop the site from AI answers.
    { userAgent: [...AI_SEARCH_CRAWLERS], ...allowGroup },
    opts.blockAiTraining
      ? { userAgent: [...AI_TRAINING_CRAWLERS], disallow: "/" }
      : { userAgent: [...AI_TRAINING_CRAWLERS], ...allowGroup },
  ];
}
