import { listPages } from "@/lib/cms/pages";
import { servicePages } from "@/data/services-content";
import { readCaseStudies } from "@/lib/case-studies-content";
import { readBlogPosts, publishedBlogPosts } from "@/lib/content";
import { readTechNewsPosts, publishedTechNewsPosts } from "@/lib/tech-news-content";

export type RelatedLink = { title: string; description: string; href: string };
export type RelatedLinkGroup = { key: string; heading: string; description: string; links: RelatedLink[] };

const MAX_LINKS_PER_GROUP = 4;

async function servicesGroup(excludePath: string): Promise<RelatedLinkGroup | null> {
  const links: RelatedLink[] = [];
  const seen = new Set([excludePath]);

  try {
    const pages = await listPages({ status: "PUBLISHED", type: "SERVICE", take: 20 });
    for (const p of pages) {
      if (seen.has(p.path)) continue;
      seen.add(p.path);
      links.push({ title: p.title, description: p.excerpt ?? "", href: p.path });
    }
  } catch {
    /* DB unavailable — fall back to the static catalog below */
  }

  for (const p of servicePages) {
    const href = `/services/${p.slug}`;
    if (seen.has(href)) continue;
    seen.add(href);
    links.push({ title: p.title, description: p.description, href });
  }

  if (links.length === 0) return null;
  return {
    key: "services",
    heading: "Related services",
    description: "Other engagements Torq Studio delivers.",
    links: links.slice(0, MAX_LINKS_PER_GROUP),
  };
}

async function industriesGroup(excludePath: string): Promise<RelatedLinkGroup | null> {
  try {
    const pages = await listPages({ status: "PUBLISHED", type: "INDUSTRY", take: 20 });
    const links = pages
      .filter((p) => p.path !== excludePath)
      .map((p) => ({ title: p.title, description: p.excerpt ?? "", href: p.path }))
      .slice(0, MAX_LINKS_PER_GROUP);
    if (links.length === 0) return null;
    return {
      key: "industries",
      heading: "Industries we serve",
      description: "See how this approach adapts to specific sectors.",
      links,
    };
  } catch {
    return null;
  }
}

async function caseStudiesGroup(excludeSlug?: string): Promise<RelatedLinkGroup | null> {
  const all = await readCaseStudies();
  const links = all
    .filter((c) => c.slug !== excludeSlug)
    .slice(0, MAX_LINKS_PER_GROUP)
    .map((c) => ({ title: c.title, description: c.description, href: `/case-studies/${c.slug}` }));
  if (links.length === 0) return null;
  return {
    key: "case-studies",
    heading: "Case studies",
    description: "See how we've approached real-world engineering problems.",
    links,
  };
}

async function blogGroup(excludeSlug?: string): Promise<RelatedLinkGroup | null> {
  const posts = publishedBlogPosts(await readBlogPosts()).filter((p) => p.slug !== excludeSlug);
  const links = posts
    .slice(0, MAX_LINKS_PER_GROUP)
    .map((p) => ({ title: p.title, description: p.description, href: `/blog/${p.slug}` }));
  if (links.length === 0) return null;
  return {
    key: "blog",
    heading: "From the blog",
    description: "Long-form essays on the same problem space.",
    links,
  };
}

async function techNewsGroup(excludeSlug?: string): Promise<RelatedLinkGroup | null> {
  const posts = publishedTechNewsPosts(await readTechNewsPosts()).filter((p) => p.slug !== excludeSlug);
  const links = posts
    .slice(0, MAX_LINKS_PER_GROUP)
    .map((p) => ({ title: p.title, description: p.excerpt || p.description, href: `/tech-news/${p.slug}` }));
  if (links.length === 0) return null;
  return {
    key: "tech-news",
    heading: "Tech news",
    description: "Briefings on the same topics from our tech news desk.",
    links,
  };
}

/**
 * Automatic "related content" cards for the bottom of a page — services, industries, case
 * studies, blog posts, and tech news stories, so every published page/post/case-study gets
 * internal links to the other content types without any manual linking work.
 */
export async function getRelatedContentGroups(input: {
  path: string;
  blogSlug?: string;
  caseStudySlug?: string;
  techNewsSlug?: string;
}): Promise<RelatedLinkGroup[]> {
  const groups = await Promise.all([
    servicesGroup(input.path),
    industriesGroup(input.path),
    caseStudiesGroup(input.caseStudySlug),
    blogGroup(input.blogSlug),
    techNewsGroup(input.techNewsSlug),
  ]);
  return groups.filter((g): g is RelatedLinkGroup => g !== null);
}
