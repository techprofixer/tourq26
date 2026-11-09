import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import { requireMarketingFeature } from "@/lib/require-marketing-feature";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { publishedBlogPosts, readBlogPosts } from "@/lib/content";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd, DEFAULT_OG_IMAGE, INDEXABLE_ROBOTS } from "@/lib/seo";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { SupportingProseSection } from "@/components/marketing/SupportingProseSection";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getSiteUrl();
  return {
    title: "Blog",
    description:
      "Insights on mobile app development, web development, AI solutions, and remote IT teams. Tips and guides from Torq Studio to help you scale smarter.",
    alternates: { canonical: `${baseUrl}/blog` },
    openGraph: {
      images: [DEFAULT_OG_IMAGE],
      title: "Blog | Torq Studio – Mobile, Web, AI & Remote IT",
      description:
        "Guides and insights on choosing development partners, AI for business, and building with remote teams.",
      url: `${baseUrl}/blog`,
    },
    robots: INDEXABLE_ROBOTS,
  };
}

export default async function BlogPage() {
  await requireMarketingFeature("marketing_blog", "marketing_blog");
  const [rawPosts, siteUrl] = await Promise.all([readBlogPosts(), getSiteUrl()]);
  const posts = publishedBlogPosts(rawPosts);
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
  ]);

  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbLd} />
      <MarketingHeader />
      <main>
        {/* Hero — dark band */}
        <section className="hero-band">
          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 pt-32 pb-20 sm:px-6 sm:pt-36 sm:pb-24 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pt-40 lg:pb-[80px]">
            <div className="lg:col-span-8">
              <p className="mono-eyebrow text-white/55">INSIGHTS · GUIDES</p>
              <h1 className="display-xxl mt-5 text-white">
                Ideas for building better products.
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
                Practical guides on shipping, procurement, security, and working with remote
                engineering teams — written for founders, PMs, and technical leaders.
              </p>
            </div>
            <div className="flex flex-col items-start justify-end gap-3 lg:col-span-4 lg:items-end">
              {posts.length > 0 ? (
                <p className="mono-label text-white/65">
                  <span className="text-white">{posts.length}</span> articles published
                </p>
              ) : null}
              <Link href="/contact" className="btn-base btn-ghost-on-dark">
                Suggest a topic
              </Link>
            </div>
          </div>
        </section>

        {/* Posts list */}
        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            {posts.length === 0 ? (
              <p className="text-center text-muted-foreground">
                New articles are on the way. Check back soon.
              </p>
            ) : (
              <>
                {featured ? (
                  <div className="mb-12 lg:mb-16">
                    <p className="mono-eyebrow text-muted-foreground">LATEST</p>
                    <div className="mt-4">
                      <BlogPostCard post={featured} variant="featured" />
                    </div>
                  </div>
                ) : null}
                {rest.length > 0 ? (
                  <>
                    <div className="mb-6 flex items-end justify-between gap-4 border-b border-hairline pb-4">
                      <p className="mono-eyebrow text-muted-foreground">MORE ARTICLES</p>
                      <p className="mono-label text-muted-foreground">
                        {rest.length} ITEMS
                      </p>
                    </div>
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {rest.map((post) => (
                        <li key={post.slug}>
                          <BlogPostCard post={post} variant="compact" />
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </>
            )}
          </div>
        </section>

        <SupportingProseSection
          id="blog-editorial"
          eyebrow="EDITORIAL"
          heading="Who these articles are written for."
          paragraphs={[
            "Our blog is written for founders, product managers, and engineering leaders who need clear language about delivery risk: fixed-price versus phased work, outsourcing security, mobile partner selection, and when to ship an MVP versus a broader release.",
            "Posts are grounded in how senior engineers actually scope, test, and hand over systems — not generic marketing claims. We link to services and case studies when you want deeper detail, but each article should stand alone as a practical reference.",
            "New guides are added as we see recurring questions from clients and prospects. Subscribe to updates by bookmarking the blog or following Torq Studio on the social channels listed in the site footer.",
          ]}
        />
      </main>
      <Footer />
    </div>
  );
}
