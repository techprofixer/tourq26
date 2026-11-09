import { readBlogPosts, writeBlogPosts, type BlogPost } from "@/lib/content";
import { normaliseBlogInput } from "@/lib/blog-server";
import { slugify } from "@/lib/slug";
import { readTechNewsPosts, writeTechNewsPosts, type TechNewsPost } from "@/lib/tech-news-content";
import { normaliseTechNewsInput } from "@/lib/tech-news-server";
import { readCaseStudies, writeCaseStudies, type CaseStudy } from "@/lib/case-studies-content";
import { createSlugCollectionRoutes } from "@/lib/slug-collection-routes";

/** Sanitises an untrusted case-study body; unknown or mistyped fields fall back to `prev`/defaults. */
export function normaliseCaseStudyInput(
  raw: Record<string, unknown>,
  prev?: CaseStudy,
): Omit<CaseStudy, "slug"> & { slug?: string } {
  const str = (key: keyof CaseStudy, fallback = ""): string => {
    const v = raw[key];
    return typeof v === "string" ? v : ((prev?.[key] as string | undefined) ?? fallback);
  };
  const optStr = (key: "seoTitle" | "icon"): string | undefined => {
    const v = raw[key];
    return typeof v === "string" ? v.trim() || undefined : prev?.[key];
  };
  const strList = (key: "industries" | "services"): string[] => {
    const v = raw[key];
    if (!Array.isArray(v)) return prev?.[key] ?? [];
    return v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean);
  };

  return {
    slug: typeof raw.slug === "string" && raw.slug.trim() ? slugify(raw.slug) : prev?.slug,
    title: str("title"),
    seoTitle: optStr("seoTitle"),
    client: str("client"),
    industry: str("industry"),
    industries: strList("industries"),
    challenge: str("challenge"),
    outcome: str("outcome"),
    metric: str("metric"),
    metricLabel: str("metricLabel"),
    icon: optStr("icon"),
    coverImage: str("coverImage"),
    coverAlt: str("coverAlt"),
    description: str("description"),
    date: str("date", new Date().toISOString().slice(0, 10)),
    readTime: str("readTime", "5 min read"),
    services: strList("services"),
    body: str("body"),
  };
}

export const blogRoutes = createSlugCollectionRoutes<BlogPost>({
  read: readBlogPosts,
  write: writeBlogPosts,
  normalise: normaliseBlogInput,
  entityType: "blog",
  label: "blog post",
  publicBase: "/blog",
  fallbackSlugPrefix: "post",
});

export const techNewsRoutes = createSlugCollectionRoutes<TechNewsPost>({
  read: readTechNewsPosts,
  write: writeTechNewsPosts,
  normalise: normaliseTechNewsInput,
  entityType: "tech-news",
  label: "tech news story",
  publicBase: "/tech-news",
  fallbackSlugPrefix: "story",
});

export const caseStudyRoutes = createSlugCollectionRoutes<CaseStudy>({
  read: readCaseStudies,
  write: writeCaseStudies,
  normalise: normaliseCaseStudyInput,
  entityType: "case-study",
  label: "case study",
  publicBase: "/case-studies",
  fallbackSlugPrefix: "case-study",
  // Case studies are featured on the home page.
  alsoRevalidate: ["/"],
});
