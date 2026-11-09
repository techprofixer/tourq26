import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingHeader from "@/components/MarketingHeader";
import { requireMarketingFeature } from "@/lib/require-marketing-feature";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { publishedBlogPosts, readBlogPosts, readSiteContent } from "@/lib/content";
import { getSiteUrl } from "@/lib/site-url";
import { sanitizeBlogHtml } from "@/lib/blog-sanitize";
import { blogPostingJsonLd, breadcrumbListJsonLd } from "@/lib/seo";
import { BlogRelatedPosts } from "@/components/blog/BlogRelatedPosts";
import {
  authorInitials,
  blogPostsExcluding,
  formatBlogDate,
} from "@/lib/blog-display";
import { SupportingProseSection } from "@/components/marketing/SupportingProseSection";
import { RelatedContentSection } from "@/components/marketing/RelatedContentSection";
import { getRelatedContentGroups } from "@/lib/related-links";

// Safety net: on-demand revalidation covers CMS/site-setting edits, but this bounds
// staleness to an hour even if a revalidatePath call is ever missed.
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const posts = publishedBlogPosts(await readBlogPosts());
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [posts, site] = await Promise.all([readBlogPosts(), readSiteContent()]);
  const post = posts.find((p) => p.slug === slug);
  if (!post) return { title: "Post not found", robots: { index: false, follow: false } };
  const isDraft = (post.status ?? "published") === "draft";
  const metaTitle = post.seoTitle?.trim() || post.title;
  const baseUrl = site.siteUrl.replace(/\/$/, "");
  const ogImage = post.coverImage?.trim() || `/blog/${post.slug}/opengraph-image`;
  return {
    title: metaTitle,
    description: post.description,
    alternates: { canonical: `${baseUrl}/blog/${post.slug}` },
    openGraph: {
      title: `${metaTitle} | ${site.siteName} Blog`,
      description: post.description,
      url: `${baseUrl}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      ...(post.dateUpdated ? { modifiedTime: post.dateUpdated } : {}),
      ...(post.tags && post.tags.length > 0 ? { tags: post.tags } : {}),
      images: [{ url: ogImage, width: 1200, height: 630, alt: metaTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${metaTitle} | ${site.siteName} Blog`,
      description: post.description,
      images: [ogImage],
      ...(site.twitterSite
        ? { site: `@${site.twitterSite}`, creator: `@${site.twitterSite}` }
        : {}),
    },
    robots: isDraft ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireMarketingFeature("marketing_blog", "marketing_blog");
  const { slug } = await params;
  const [posts, site, siteUrl] = await Promise.all([
    readBlogPosts(),
    readSiteContent(),
    getSiteUrl(),
  ]);
  const visible = publishedBlogPosts(posts);
  const post = visible.find((p) => p.slug === slug);
  if (!post) notFound();

  const authorLabel = post.authorName?.trim() || site.siteName;
  const related = blogPostsExcluding(visible, post.slug, 3);
  const relatedGroups = await getRelatedContentGroups({
    path: `/blog/${post.slug}`,
    blogSlug: post.slug,
  });

  const articleLd = blogPostingJsonLd({
    siteUrl,
    slug: post.slug,
    title: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.dateUpdated,
    siteName: site.siteName,
    authorName: post.authorName,
    image: post.coverImage,
    keywords: post.tags,
    wordCount: post.wordCount,
  });
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      <MarketingHeader />
      <main>
        <article>
          {/* Hero band — dark */}
          <header className="hero-band">
            <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pt-32 pb-16 sm:px-6 sm:pt-36 sm:pb-20 lg:px-8 lg:pt-40 lg:pb-[80px]">
              <nav aria-label="Breadcrumb">
                <ol className="mono-label flex flex-wrap items-center gap-2 text-white/55">
                  <li>
                    <Link href="/" className="transition-colors hover:text-white">
                      HOME
                    </Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li>
                    <Link href="/blog" className="transition-colors hover:text-white">
                      BLOG
                    </Link>
                  </li>
                </ol>
              </nav>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <time
                  dateTime={post.date}
                  className="mono-label text-white/65"
                >
                  {formatBlogDate(post.date).toUpperCase()}
                </time>
                <span className="mono-label text-white/40" aria-hidden>
                  ·
                </span>
                <span className="mono-label text-white/65">
                  {post.readTime.toUpperCase()}
                </span>
              </div>

              <h1 className="display-xxl mt-5 max-w-[20ch] text-white">
                {post.title}
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
                {post.description}
              </p>
              {post.tags && post.tags.length > 0 ? (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <li
                      key={t}
                      className="mono-label rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-white/80"
                    >
                      {t.toUpperCase()}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-10 flex items-center gap-4 border-t border-[var(--brand-hairline-on-dark)] pt-8">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-white/15 bg-white/5 font-display text-[14px] font-medium text-white"
                  aria-hidden
                >
                  {authorInitials(authorLabel)}
                </div>
                <div>
                  <p className="text-[15px] font-medium text-white">{authorLabel}</p>
                  <p className="mono-label text-white/55">AUTHOR</p>
                </div>
              </div>
            </div>
          </header>

          {post.coverImage ? (
            <section className="band-light border-t border-hairline">
              <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="aspect-[1200/630] w-full rounded-[var(--radius-sm)] border border-hairline object-cover"
                />
              </div>
            </section>
          ) : null}

          {/* Body — light band, blog-article prose */}
          <section className={`band-light ${post.coverImage ? "" : "border-t border-hairline"}`}>
            <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
              <div className="grid gap-12 lg:grid-cols-12">
                <aside className="lg:col-span-4">
                  <p className="mono-eyebrow text-muted-foreground">ARTICLE</p>
                  <h2 className="display-sm mt-3 text-foreground">{post.title}</h2>
                  <p className="mt-3 text-[14px] text-muted-foreground">
                    {post.readTime} · published {formatBlogDate(post.date)}
                    {post.dateUpdated && post.dateUpdated.slice(0, 10) !== post.date
                      ? ` · updated ${formatBlogDate(post.dateUpdated)}`
                      : "."}
                  </p>
                </aside>
                <div
                  className="blog-article max-w-none lg:col-span-8 lg:max-w-[680px]"
                  dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(post.body || "") }}
                />
              </div>

              <SupportingProseSection
                id="blog-torq-context"
                eyebrow="ABOUT TORQ STUDIO"
                className="border-x-0 mt-16"
                heading="Engineering partner for product teams."
                paragraphs={[
                  "Torq Studio helps product and engineering organisations ship mobile apps, web platforms, APIs, and AI-assisted workflows with senior ownership end to end. We combine hands-on delivery with advisory work when you need estimates, architecture review, or vendor diligence before committing to a build.",
                  "If this article raised questions about your own roadmap — procurement, security, team shape, or launch strategy — you can explore our services overview, read anonymised case studies, or start with a free consultation. We reply to thoughtful enquiries within one business day.",
                ]}
              />

              <BlogRelatedPosts posts={related} />
            </div>
          </section>

          <RelatedContentSection groups={relatedGroups} />

          {/* Closing CTA — dark band */}
          <section className="hero-band border-t border-[var(--brand-hairline-on-dark)]">
            <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-[80px]">
              <div className="lg:col-span-7">
                <p className="mono-eyebrow text-white/55">PLANNING A PRODUCT OR A TEAM?</p>
                <h2 className="display-xl mt-4 text-white">
                  Share what you&apos;re building — we&apos;ll scope the right next step.
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end">
                <Link href="/contact" className="btn-base btn-white">
                  Get in touch
                </Link>
                <Link href="/services" className="btn-base btn-ghost-on-dark">
                  Explore services →
                </Link>
              </div>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
