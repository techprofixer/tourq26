import { z } from "zod";

export const heroBlockSchema = z.object({
  type: z.literal("hero"),
  id: z.string().min(1),
  eyebrow: z.string().optional(),
  heading: z.string().min(1),
  subheading: z.string().optional(),
  primaryCtaLabel: z.string().optional(),
  primaryCtaHref: z.string().optional(),
  secondaryCtaLabel: z.string().optional(),
  secondaryCtaHref: z.string().optional(),
});

export const contentSectionBlockSchema = z.object({
  type: z.literal("contentSection"),
  id: z.string().min(1),
  eyebrow: z.string().optional(),
  heading: z.string().optional(),
  bodyHtml: z.string().min(1),
  image: z
    .object({
      url: z.string().min(1),
      alt: z.string().optional(),
      /** Tooltip / `title` attribute. */
      title: z.string().optional(),
    })
    .optional(),
});

/** Answer-first "key takeaways" list. Placed near the top of a page, it gives answer engines
 *  (Google AI Overviews, ChatGPT, Perplexity) short, self-contained statements to quote. */
export const summaryBlockSchema = z.object({
  type: z.literal("summary"),
  id: z.string().min(1),
  heading: z.string().optional(),
  items: z.array(z.string().min(1)).min(1),
});

export const faqBlockSchema = z.object({
  type: z.literal("faq"),
  id: z.string().min(1),
  heading: z.string().optional(),
  items: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .min(1),
});

export const ctaBlockSchema = z.object({
  type: z.literal("cta"),
  id: z.string().min(1),
  eyebrow: z.string().optional(),
  heading: z.string().min(1),
  body: z.string().optional(),
  primaryCtaLabel: z.string().optional(),
  primaryCtaHref: z.string().optional(),
  secondaryCtaLabel: z.string().optional(),
  secondaryCtaHref: z.string().optional(),
  dark: z.boolean().optional(),
});

export const featureGridBlockSchema = z.object({
  type: z.literal("featureGrid"),
  id: z.string().min(1),
  heading: z.string().optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .min(1),
});

export const entityGridBlockSchema = z.object({
  type: z.literal("entityGrid"),
  id: z.string().min(1),
  /// Which taxonomy table to list — cards are pulled live from Admin → CMS → Entities.
  kind: z.enum(["SERVICE", "SOLUTION", "INDUSTRY", "TECHNOLOGY"]),
  eyebrow: z.string().optional(),
  heading: z.string().optional(),
});

export const blockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  summaryBlockSchema,
  contentSectionBlockSchema,
  faqBlockSchema,
  ctaBlockSchema,
  featureGridBlockSchema,
  entityGridBlockSchema,
]);

export type CmsBlock = z.infer<typeof blockSchema>;
export type BlockTypeKey = CmsBlock["type"];

export const BLOCK_TYPE_OPTIONS: { type: BlockTypeKey; label: string; description: string }[] = [
  { type: "hero", label: "Hero", description: "Page H1, intro line and primary call to action." },
  {
    type: "summary",
    label: "Key takeaways",
    description: "2–5 quotable answers — what AI Overviews and ChatGPT cite.",
  },
  { type: "contentSection", label: "Content section", description: "Heading, rich text and an optional image." },
  { type: "featureGrid", label: "Feature grid", description: "Cards for capabilities, steps or benefits." },
  { type: "entityGrid", label: "Catalogue grid", description: "Live cards for services, solutions, industries…" },
  { type: "faq", label: "FAQ", description: "Questions and answers, emitted as FAQPage schema." },
  { type: "cta", label: "Call to action", description: "Closing band with buttons." },
];

/** Blocks offered in the blog post editor — no hero, because a post already renders its own H1. */
export const BLOG_BLOCK_TYPES: readonly BlockTypeKey[] = [
  "summary",
  "contentSection",
  "featureGrid",
  "entityGrid",
  "faq",
  "cta",
];

export function createDefaultBlock(type: BlockTypeKey, existingBlocks: CmsBlock[] = []): CmsBlock {
  const id = `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  switch (type) {
    case "hero":
      return {
        type,
        id,
        eyebrow: "SERVICE",
        heading: "New page heading",
        subheading: "Supporting sentence for search intent and conversion.",
        primaryCtaLabel: "Book a consultation",
        primaryCtaHref: "/contact",
        secondaryCtaLabel: "Case studies",
        secondaryCtaHref: "/case-studies",
      };
    case "summary":
      return {
        type,
        id,
        heading: "Key takeaways",
        items: [
          "State the direct answer to the page's main question in one sentence.",
          "Add a concrete fact, number, or timeframe a reader could quote.",
        ],
      };
    case "contentSection": {
      const sectionNumber =
        existingBlocks.filter((b) => b.type === "contentSection").length + 1;
      return {
        type,
        id,
        eyebrow: `${String(sectionNumber).padStart(2, "0")} · SECTION`,
        heading: "Section heading",
        bodyHtml: "<p>Write the body copy here.</p>",
      };
    }
    case "featureGrid":
      return {
        type,
        id,
        heading: "What you get",
        items: [
          { title: "Discovery", description: "Scope, risks, and sequencing before build." },
          { title: "Delivery", description: "Incremental releases with clear ownership." },
          { title: "Support", description: "Optional maintenance after launch." },
        ],
      };
    case "faq":
      return {
        type,
        id,
        heading: "Questions buyers ask",
        items: [
          {
            question: "How do engagements start?",
            answer: "With a short discovery call to confirm fit, scope, and timeline.",
          },
        ],
      };
    case "cta":
      return {
        type,
        id,
        eyebrow: "NEXT STEP",
        heading: "Ready to scope this engagement?",
        primaryCtaLabel: "Book a free consultation",
        primaryCtaHref: "/contact",
        dark: true,
      };
    case "entityGrid":
      return {
        type,
        id,
        kind: "SERVICE",
        eyebrow: "CATALOGUE",
        heading: "Explore more",
      };
  }
}

export function parseBlocks(raw: unknown): CmsBlock[] {
  if (!Array.isArray(raw)) return [];
  const out: CmsBlock[] = [];
  for (const item of raw) {
    const parsed = blockSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}
