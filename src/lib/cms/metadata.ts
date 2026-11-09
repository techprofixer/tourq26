import type { Metadata } from "next";
import type { PageWithSeo } from "@/lib/cms/pages";
import { getPageBlocks } from "@/lib/cms/pages";
import {
  DEFAULT_OG_IMAGE,
  articleJsonLd,
  breadcrumbListJsonLd,
  definedTermJsonLd,
  faqPageJsonLd,
  serviceJsonLd,
  webPageJsonLd,
} from "@/lib/seo";
import { stripHtmlToText } from "@/lib/seo-generate";


const SEGMENT_LABELS: Record<string, string> = {
  services: "Services",
  solutions: "Solutions",
  industries: "Industries",
  technologies: "Technologies",
  locations: "Locations",
};

function titleCaseSegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Breadcrumb trail for a CMS page — shared by the visible hero trail and BreadcrumbList JSON-LD
 *  so the two never disagree. The leaf uses the SEO breadcrumb label, then the page title. */
export function buildPageBreadcrumbs(page: Pick<PageWithSeo, "path" | "title" | "seo">) {
  const parts = page.path.split("/").filter(Boolean);
  const crumbs: { name: string; path: string }[] = [{ name: "Home", path: "/" }];
  let acc = "";
  parts.forEach((part, i) => {
    acc += `/${part}`;
    const isLeaf = i === parts.length - 1;
    crumbs.push({
      name: isLeaf
        ? page.seo?.breadcrumbLabel || page.title
        : SEGMENT_LABELS[part] ?? titleCaseSegment(part),
      path: acc,
    });
  });
  return crumbs;
}
/** Page types rendered as long-form editorial content (Article schema, `og:type=article`). */
const ARTICLE_TYPES = new Set(["GUIDE", "COMPARISON", "RESEARCH", "WHITEPAPER", "NEWS", "BLOG"]);
/** Page types describing something Torq Studio sells (Service schema). */
const SERVICE_TYPES = new Set(["SERVICE", "SOLUTION", "LOCATION", "INDUSTRY", "TECHNOLOGY"]);

function pageDates(page: PageWithSeo) {
  return {
    published: (page.publishedAt ?? page.createdAt).toISOString(),
    modified: page.updatedAt.toISOString(),
  };
}

/** Normalises the stored custom JSON-LD (object or array; `[]` means "none") to a list of objects. */
function customJsonLd(raw: unknown): Record<string, unknown>[] {
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return items.filter(
    (x): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x),
  );
}

export function buildPageMetadata(
  page: PageWithSeo,
  siteUrl: string,
  siteName?: string,
): Metadata {
  const seo = page.seo;
  const title = seo?.metaTitle || page.title;
  const description = seo?.metaDescription || page.excerpt || undefined;
  const canonical = seo?.canonical || `${siteUrl.replace(/\/$/, "")}${page.path}`;
  const index = seo?.robotsIndex ?? page.status === "PUBLISHED";
  const follow = seo?.robotsFollow ?? true;
  const isArticle = ARTICLE_TYPES.has(page.type);
  const dates = pageDates(page);
  const image = seo?.ogImageUrl
    ? { url: seo.ogImageUrl, width: 1200, height: 630, alt: seo.ogTitle || title }
    : { ...DEFAULT_OG_IMAGE, alt: seo?.ogTitle || title };

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: seo?.ogTitle || title,
      description: seo?.ogDescription || description,
      url: canonical,
      locale: "en_US",
      ...(siteName ? { siteName } : {}),
      images: [image],
      ...(isArticle
        ? {
            type: "article" as const,
            publishedTime: dates.published,
            modifiedTime: dates.modified,
            ...(seo?.authorName ? { authors: [seo.authorName] } : {}),
          }
        : { type: "website" as const }),
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.twitterTitle || title,
      description: seo?.twitterDescription || description,
      images: [image.url],
    },
    robots: {
      index,
      follow,
      // Let Google show full-length snippets / large image previews — these directives gate how
      // much of the page AI Overviews and Discover may quote or display.
      googleBot: {
        index,
        follow,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
  };
}

export function buildPageJsonLd(page: PageWithSeo, siteUrl: string, siteName: string) {
  const blocks = getPageBlocks(page);
  const schemas: Record<string, unknown>[] = [];
  const name = page.seo?.metaTitle || page.title;
  const description = page.seo?.metaDescription || page.excerpt || "";
  const dates = pageDates(page);
  const image = page.seo?.ogImageUrl || undefined;

  schemas.push(
    webPageJsonLd({
      siteUrl,
      path: page.path,
      name,
      description,
      datePublished: dates.published,
      dateModified: dates.modified,
      image,
    }),
  );

  if (SERVICE_TYPES.has(page.type)) {
    schemas.push(
      serviceJsonLd({
        siteUrl,
        path: page.path,
        name,
        description,
        siteName,
        areaServed: page.type === "LOCATION" ? page.seo?.breadcrumbLabel || undefined : undefined,
      }),
    );
  } else if (ARTICLE_TYPES.has(page.type)) {
    schemas.push(
      articleJsonLd({
        siteUrl,
        path: page.path,
        headline: page.title,
        description,
        datePublished: dates.published,
        dateModified: dates.modified,
        authorName: page.seo?.authorName || undefined,
        image,
      }),
    );
  } else if (page.type === "GLOSSARY") {
    schemas.push(
      definedTermJsonLd({ siteUrl, path: page.path, name: page.title, description }),
    );
  }

  schemas.push(breadcrumbListJsonLd(siteUrl, buildPageBreadcrumbs(page)));

  const faqItems = blocks.flatMap((b) => (b.type === "faq" ? b.items : []));
  if (faqItems.length > 0) {
    schemas.push(
      faqPageJsonLd(
        faqItems.map((item) => ({
          question: item.question,
          answer: stripHtmlToText(item.answer),
        })),
      ),
    );
  }

  schemas.push(...customJsonLd(page.seo?.jsonLdCustom));

  return schemas;
}
