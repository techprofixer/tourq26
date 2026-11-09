import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { freebies } from "@/data/freebies";
import { getFreebieContentNode } from "@/data/freebie-content";
import { readSiteContent } from "@/lib/content";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd } from "@/lib/seo";
import { SupportingProseSection } from "@/components/marketing/SupportingProseSection";
import { getFreebieExtraProseParagraphs } from "@/data/freebie-page-extra-prose";

/** Only slugs from the content module resolve; unknown URLs 404 (no accidental SSR). */
export const dynamicParams = false;
// Safety net: on-demand revalidation covers CMS/site-setting edits, but this bounds
// staleness to an hour even if a revalidatePath call is ever missed.
export const revalidate = 3600;

export async function generateStaticParams() {
  return freebies.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const freebie = freebies.find((f) => f.slug === slug);
  if (!freebie) return { title: "Freebie not found", robots: { index: false, follow: false } };
  const site = await readSiteContent();
  const baseUrl = site.siteUrl.replace(/\/$/, "");
  const ogImage = `/freebies/${freebie.slug}/opengraph-image`;
  return {
    title: freebie.title,
    description: freebie.description,
    alternates: { canonical: `${baseUrl}/freebies/${freebie.slug}` },
    openGraph: {
      title: `${freebie.title} | Torq Studio Free Resources`,
      description: freebie.description,
      url: `${baseUrl}/freebies/${freebie.slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: freebie.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${freebie.title} | Torq Studio`,
      description: freebie.description,
      images: [ogImage],
      ...(site.twitterSite
        ? { site: `@${site.twitterSite}`, creator: `@${site.twitterSite}` }
        : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function FreebiePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const freebie = freebies.find((f) => f.slug === slug);
  if (!freebie) notFound();

  const siteUrl = await getSiteUrl();
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Free resources", path: "/freebies" },
    { name: freebie.title, path: `/freebies/${freebie.slug}` },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbLd} />
      <MarketingHeader />
      <main>
        <article className="mx-auto max-w-3xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
          <Link
            href="/freebies"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← All free resources
          </Link>
          <header className="mt-6">
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              Free resource
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              {freebie.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {freebie.description}
            </p>
          </header>
          <div className="prose prose-invert mt-10 max-w-none [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1 [&_input]:rounded [&_input]:border [&_input]:border-border [&_input]:bg-surface [&_input]:px-2 [&_input]:py-1">
            {getFreebieContentNode(slug)}
          </div>

          <SupportingProseSection
            id="freebie-how-we-help"
            className="mt-12"
            heading="How Torq Studio can help beyond this resource"
            paragraphs={[
              `${freebie.title} is meant to accelerate alignment with stakeholders and vendors. When you are ready to turn a checklist or template into an engineered solution—mobile apps, web platforms, APIs, or AI workflows—our team can own delivery or advise alongside your in-house engineers.`,
              "We offer fixed-scope MVPs, retainers, embedded squads, and short discovery blocks so you can validate risk before a large budget commitment. Use the consultation link below to share context; we respond with a clear suggested next step.",
              ...getFreebieExtraProseParagraphs(slug),
            ]}
          />

          <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-border/50 pt-8">
            <p className="text-sm text-muted-foreground">
              Use Ctrl+P / Cmd+P to print or save as PDF.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Get a free consultation
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
