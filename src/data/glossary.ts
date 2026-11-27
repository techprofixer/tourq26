export type GlossaryTerm = { slug: string; term: string; def: string };

/** Plain-language definitions buyers ask about. Rendered at /resources/glossary. */
export const glossaryTerms: GlossaryTerm[] = [
  {
    slug: "mvp",
    term: "MVP (minimum viable product)",
    def: "The smallest version that proves value to users and stakeholders, with explicit out-of-scope items so the timeline is defensible.",
  },
  {
    slug: "technical-debt",
    term: "Technical debt",
    def: "Shortcuts taken under time pressure; we help you decide when to pay it down versus when it is acceptable risk for a learning phase.",
  },
  {
    slug: "api-versioning",
    term: "API versioning",
    def: "A strategy so mobile apps and partners can migrate without surprise breaking changes — often paired with documentation and sunset timelines.",
  },
  {
    slug: "retrieval-augmented-ai",
    term: "Retrieval-augmented AI",
    def: "Patterns where a model is grounded in your approved content or tools instead of hallucinating policies or live data it cannot see.",
  },
  {
    slug: "embedded-team",
    term: "Embedded team",
    def: "Engineers who work inside your rituals and systems with shared ownership, as opposed to throwing specs over a wall every sprint.",
  },
  {
    slug: "production-readiness",
    term: "Production readiness",
    def: "Checklist-style concerns: backups, secrets handling, rate limits, monitoring, rollback paths, and support expectations after launch.",
  },
];
