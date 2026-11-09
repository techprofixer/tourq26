import { cache } from "react";
import { prisma, withDbTimeout, writeSingletonSetting, SINGLETON_KEY } from "@/lib/db";

/** Deduped per-request: readSiteContent() and readFeatureFlagsDocument() both read this same
 *  row — React's cache() collapses repeat calls within one render into a single DB query. */
const getSiteSettingsRow = cache(() =>
  withDbTimeout(prisma.siteSettings.findUnique({ where: { key: SINGLETON_KEY } })),
);

export type BlogStatus = "draft" | "published";

export type BlogPost = {
  slug: string;
  title: string;
  /** Shorter `<title>` / social title when `title` is long for on-page H1 */
  seoTitle?: string;
  /** Meta description (also used as default excerpt + social snippet) */
  description: string;
  /** Optional short excerpt for cards / RSS when description is too SEO-flavoured */
  excerpt?: string;
  date: string;
  /** Auto-stamped on every save (ISO). Powers `dateModified` JSON-LD. */
  dateUpdated?: string;
  readTime: string;
  body: string;
  /** Optional author display name for E-E-A-T / Article schema */
  authorName?: string;
  /** Draft posts are hidden from public listing, JSON-LD, and sitemap. */
  status?: BlogStatus;
  /** Public cover image URL (used as OG image + card visual when set). */
  coverImage?: string;
  /** Topic tags — also serialised into `keywords` + `articleSection`. */
  tags?: string[];
  /** Primary keyword used for content-score signals (not rendered). */
  focusKeyword?: string;
  /** Auto-computed word count of the sanitized body. */
  wordCount?: number;
};

/** Posts visible to the public — filters drafts and sorts newest first. */
export function publishedBlogPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts]
    .filter((p) => (p.status ?? "published") === "published")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export type Testimonial = {
  id: string;
  quote: string;
  result: string;
  name: string;
  role: string;
  company: string;
  rating: number;
};

export type SiteContent = {
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  titleTemplate: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  siteName: string;
  /** Social profile URLs for Organization sameAs (LinkedIn, X, etc.) */
  sameAs: string[];
  /** X/Twitter handle without @ (e.g. torqstudio) */
  twitterSite: string;
  /** Google Search Console HTML meta verification token (content value only, no tag) */
  googleSiteVerification: string;
  /** Bing Webmaster Tools meta verification token (content value only, no tag) */
  bingSiteVerification: string;
  /** When true, the whole site is blocked from indexing (robots meta + robots.txt) — for staging. */
  robotsNoIndex: boolean;
};

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  createdAt: string; // ISO
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  landingPage?: string;
};

export type ChatFeedback = {
  id: string;
  rating: "up" | "down";
  userQuery: string;
  assistantReply: string;
  createdAt: string; // ISO
};

export type ChatQueryLogEntry = {
  id: string;
  query: string;
  fromSuggestion: boolean;
  createdAt: string; // ISO
};

export type FeatureFlagsDocument = {
  values: Record<string, boolean>;
  updatedAt: string;
};

function toBlogPost(row: {
  slug: string;
  title: string;
  seoTitle: string | null;
  description: string;
  excerpt: string | null;
  date: string;
  dateUpdated: string | null;
  readTime: string;
  body: string;
  authorName: string | null;
  status: string;
  coverImage: string | null;
  tags: string[];
  focusKeyword: string | null;
  wordCount: number | null;
}): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    seoTitle: row.seoTitle ?? undefined,
    description: row.description,
    excerpt: row.excerpt ?? undefined,
    date: row.date,
    dateUpdated: row.dateUpdated ?? undefined,
    readTime: row.readTime,
    body: row.body,
    authorName: row.authorName ?? undefined,
    status: (row.status as BlogStatus) ?? "published",
    coverImage: row.coverImage ?? undefined,
    tags: row.tags,
    focusKeyword: row.focusKeyword ?? undefined,
    wordCount: row.wordCount ?? undefined,
  };
}

export async function readBlogPosts(): Promise<BlogPost[]> {
  try {
    const rows = await withDbTimeout(prisma.blogPost.findMany());
    return rows.map(toBlogPost);
  } catch {
    return [];
  }
}

export async function writeBlogPosts(posts: BlogPost[]): Promise<void> {
  const slugs = posts.map((p) => p.slug);
  await prisma.$transaction([
    prisma.blogPost.deleteMany({ where: { slug: { notIn: slugs } } }),
    ...posts.map((p) =>
      prisma.blogPost.upsert({
        where: { slug: p.slug },
        create: {
          slug: p.slug,
          title: p.title,
          seoTitle: p.seoTitle,
          description: p.description,
          excerpt: p.excerpt,
          date: p.date,
          dateUpdated: p.dateUpdated,
          readTime: p.readTime,
          body: p.body,
          authorName: p.authorName,
          status: p.status ?? "published",
          coverImage: p.coverImage,
          tags: p.tags ?? [],
          focusKeyword: p.focusKeyword,
          wordCount: p.wordCount,
        },
        update: {
          title: p.title,
          seoTitle: p.seoTitle,
          description: p.description,
          excerpt: p.excerpt,
          date: p.date,
          dateUpdated: p.dateUpdated,
          readTime: p.readTime,
          body: p.body,
          authorName: p.authorName,
          status: p.status ?? "published",
          coverImage: p.coverImage,
          tags: p.tags ?? [],
          focusKeyword: p.focusKeyword,
          wordCount: p.wordCount,
        },
      }),
    ),
  ]);
}

export async function readTestimonials(): Promise<Testimonial[]> {
  try {
    const rows = await withDbTimeout(prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } }));
    return rows.map((t) => ({
      id: t.id,
      quote: t.quote,
      result: t.result ?? "",
      name: t.name,
      role: t.role ?? "",
      company: t.company ?? "",
      rating: t.rating,
    }));
  } catch {
    return [];
  }
}

export async function writeTestimonials(items: Testimonial[]): Promise<void> {
  await prisma.$transaction([
    prisma.testimonial.deleteMany({}),
    ...items.map((t, i) =>
      prisma.testimonial.create({
        data: {
          quote: t.quote,
          result: t.result,
          name: t.name,
          role: t.role,
          company: t.company,
          rating: t.rating,
          sortOrder: i,
        },
      }),
    ),
  ]);
}

function getDefaultSiteContent(): SiteContent {
  return {
    siteUrl: "https://torqstudio.com",
    defaultTitle: "Torq Studio | Senior engineers · Mobile, web & AI",
    defaultDescription:
      "Senior software engineers for mobile apps, websites, and AI. Direct collaboration, production-quality delivery, and honest scoping for teams worldwide.",
    titleTemplate: "%s | Torq Studio",
    keywords: [
      "senior software engineer",
      "software consultant",
      "mobile app development",
      "web development",
      "website development",
      "AI integration",
      "technical consulting",
      "freelance developer",
      "remote developer",
      "Torq Studio",
    ],
    ogTitle: "Torq Studio | Senior engineers · Mobile, web & AI",
    ogDescription:
      "Mobile apps, web, AI, and consulting from senior engineers who ship. Clear scope and direct collaboration.",
    twitterTitle: "Torq Studio | Senior engineers · Mobile, web & AI",
    twitterDescription:
      "Senior engineers for mobile, web & AI. Direct collaboration and production-quality delivery.",
    siteName: "Torq Studio",
    sameAs: [],
    twitterSite: "",
    googleSiteVerification: "",
    bingSiteVerification: "",
    robotsNoIndex: false,
  };
}

export async function readSiteContent(): Promise<SiteContent> {
  const d = getDefaultSiteContent();
  let row;
  try {
    row = await getSiteSettingsRow();
  } catch {
    return d;
  }
  if (!row) return d;
  return {
    siteUrl: row.siteUrl || d.siteUrl,
    defaultTitle: row.defaultTitle || d.defaultTitle,
    defaultDescription: row.defaultDescription || d.defaultDescription,
    titleTemplate: row.titleTemplate || d.titleTemplate,
    keywords: row.keywords.length ? row.keywords : d.keywords,
    ogTitle: row.ogTitle || d.ogTitle,
    ogDescription: row.ogDescription || d.ogDescription,
    twitterTitle: row.twitterTitle || d.twitterTitle,
    twitterDescription: row.twitterDescription || d.twitterDescription,
    siteName: row.siteName || d.siteName,
    sameAs: row.socialProfiles,
    twitterSite: row.twitterHandle || d.twitterSite,
    googleSiteVerification: row.googleSiteVerification || d.googleSiteVerification,
    bingSiteVerification: row.bingSiteVerification || d.bingSiteVerification,
    robotsNoIndex: row.robotsNoIndex ?? d.robotsNoIndex,
  };
}

export async function writeSiteContent(data: SiteContent): Promise<void> {
  const payload = {
    siteUrl: data.siteUrl,
    defaultTitle: data.defaultTitle,
    defaultDescription: data.defaultDescription,
    titleTemplate: data.titleTemplate,
    keywords: data.keywords,
    ogTitle: data.ogTitle,
    ogDescription: data.ogDescription,
    twitterTitle: data.twitterTitle,
    twitterDescription: data.twitterDescription,
    siteName: data.siteName,
    socialProfiles: data.sameAs.map((u) => u.trim()).filter(Boolean),
    twitterHandle: data.twitterSite.replace(/^@/, "").trim(),
    googleSiteVerification: data.googleSiteVerification.trim(),
    bingSiteVerification: data.bingSiteVerification.trim(),
    robotsNoIndex: data.robotsNoIndex,
  };
  await writeSingletonSetting((args) => prisma.siteSettings.upsert(args), payload);
}

// --- Contact form submissions (append-only, admin view only) ---

export async function readContactSubmissions(): Promise<ContactSubmission[]> {
  try {
    const rows = await withDbTimeout(
      prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" } }),
    );
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      company: c.company ?? "",
      message: c.message,
      createdAt: c.createdAt.toISOString(),
      source: c.source ?? undefined,
      medium: c.medium ?? undefined,
      campaign: c.campaign ?? undefined,
      term: c.term ?? undefined,
      content: c.content ?? undefined,
      landingPage: c.landingPage ?? undefined,
    }));
  } catch {
    return [];
  }
}

export async function addContactSubmission(input: {
  name: string;
  email: string;
  company?: string;
  message: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  landingPage?: string;
}): Promise<ContactSubmission> {
  const row = await prisma.contactSubmission.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim(),
      company: (input.company ?? "").trim(),
      message: input.message.trim(),
      source: input.source,
      medium: input.medium,
      campaign: input.campaign,
      term: input.term,
      content: input.content,
      landingPage: input.landingPage,
    },
  });
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company ?? "",
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    source: row.source ?? undefined,
    medium: row.medium ?? undefined,
    campaign: row.campaign ?? undefined,
    term: row.term ?? undefined,
    content: row.content ?? undefined,
    landingPage: row.landingPage ?? undefined,
  };
}

// --- Chat feedback (thumbs up/down on assistant replies) ---

export async function readChatFeedback(): Promise<ChatFeedback[]> {
  try {
    const rows = await withDbTimeout(prisma.chatFeedback.findMany({ orderBy: { createdAt: "desc" } }));
    return rows.map((r) => ({
      id: r.id,
      rating: r.rating === "up" ? "up" : "down",
      userQuery: r.userQuery,
      assistantReply: r.assistantReply,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function addChatFeedback(input: {
  rating: "up" | "down";
  userQuery: string;
  assistantReply: string;
}): Promise<ChatFeedback> {
  const row = await prisma.chatFeedback.create({
    data: {
      rating: input.rating,
      userQuery: input.userQuery.trim(),
      assistantReply: input.assistantReply.trim(),
    },
  });
  return {
    id: row.id,
    rating: row.rating === "up" ? "up" : "down",
    userQuery: row.userQuery,
    assistantReply: row.assistantReply,
    createdAt: row.createdAt.toISOString(),
  };
}

// --- Chat query log (fire-and-forget; never breaks the caller's chat response) ---

export async function logChatQuery(params: { query: string; fromSuggestion: boolean }): Promise<void> {
  try {
    await prisma.chatQueryLog.create({
      data: { query: params.query, fromSuggestion: params.fromSuggestion },
    });
  } catch {
    /* noop — logging must never break the chat response */
  }
}

export async function listChatQueryLog(limit = 200): Promise<ChatQueryLogEntry[]> {
  try {
    const rows = await prisma.chatQueryLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    return rows.map((r) => ({
      id: r.id,
      query: r.query,
      fromSuggestion: r.fromSuggestion,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

// --- Feature flags ---

export async function readFeatureFlagsDocument(): Promise<FeatureFlagsDocument | null> {
  let row;
  try {
    row = await getSiteSettingsRow();
  } catch {
    return null;
  }
  const data = row?.featureFlags;
  return data && typeof data === "object" && "values" in data ? (data as FeatureFlagsDocument) : null;
}

export async function writeFeatureFlagsDocument(doc: FeatureFlagsDocument): Promise<void> {
  await writeSingletonSetting((args) => prisma.siteSettings.upsert(args), { featureFlags: doc });
}
