import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { freebies } from "@/data/freebies";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd, DEFAULT_OG_IMAGE, INDEXABLE_ROBOTS } from "@/lib/seo";
import { SupportingProseSection } from "@/components/marketing/SupportingProseSection";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getSiteUrl();
  return {
    title: "Free Resources",
    description:
      "Free checklists, templates, and guides for product teams and founders: mobile app partner checklist, project brief template, pre-launch checklist, build vs buy guide.",
    alternates: { canonical: `${baseUrl}/freebies` },
    openGraph: {
      images: [DEFAULT_OG_IMAGE],
      title: "Free Resources | Torq Studio",
      description:
        "Checklists, templates, and guides to help you choose partners, brief projects, and launch apps.",
      url: `${baseUrl}/freebies`,
    },
    robots: INDEXABLE_ROBOTS,
  };
}

const typeLabel: Record<string, string> = {
  checklist: "CHECKLIST",
  template: "TEMPLATE",
  guide: "GUIDE",
};

export default async function FreebiesPage() {
  const siteUrl = await getSiteUrl();
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Free resources", path: "/freebies" },
  ]);
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbLd} />
      <MarketingHeader />
      <main>
        {/* Hero band — dark */}
        <section className="hero-band">
          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 pt-32 pb-20 sm:px-6 sm:pt-36 sm:pb-24 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pt-40 lg:pb-[80px]">
            <div className="lg:col-span-8">
              <p className="mono-eyebrow text-white/55">FREE RESOURCES</p>
              <h1 className="display-xxl mt-5 text-white">
                Checklists, templates, and short guides.
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
                Designed to be usable in vendor workshops, internal steering meetings, or
                investor updates. Plain language so non-technical stakeholders can follow.
              </p>
            </div>
            <div className="flex flex-col items-start justify-end gap-3 lg:col-span-4 lg:items-end">
              <p className="mono-label text-white/65">NO SIGN-UP · PRINT FRIENDLY</p>
              <Link href="/contact" className="btn-base btn-ghost-on-dark">
                Suggest a resource
              </Link>
            </div>
          </div>
        </section>

        {/* Resources grid */}
        <section className="band-light border-t border-hairline">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <p className="mono-eyebrow text-muted-foreground">CURRENT LIBRARY</p>
              <p className="display-md max-w-xl text-foreground">
                {freebies.length} resources you can use today.
              </p>
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {freebies.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/freebies/${item.slug}`}
                    className="card-flat card-hover group flex h-full flex-col"
                  >
                    <p className="mono-eyebrow text-muted-foreground">
                      {typeLabel[item.type] ?? item.type.toUpperCase()}
                    </p>
                    <h2 className="display-md mt-5 text-foreground">{item.title}</h2>
                    <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                    <span className="mono-button mt-6 inline-flex items-center gap-1 border-t border-hairline pt-4 text-foreground transition-transform group-hover:translate-x-0.5">
                      VIEW RESOURCE →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-center text-[14px] text-muted-foreground">
              No sign-up required. Use them in your projects and share with your team.
            </p>
          </div>
        </section>

        <SupportingProseSection
          id="freebies-editorial"
          eyebrow="WHY WE PUBLISH THESE"
          heading="Plain-language tools for kickoff, not gated downloads."
          paragraphs={[
            "Product and engineering teams repeatedly ask similar questions before kickoff: how to brief an agency, how to compare build versus buy versus partner, and what to verify before app store submission. These resources distil patterns we have seen across mobile, web, and API engagements.",
            "Each item is designed to be actionable in a meeting or workshop — you can print to PDF, duplicate sections into your own wiki, or share a link with stakeholders. They do not replace legal or compliance review, but they do align vocabulary and expectations before you invest in a long contract cycle.",
            "Torq Studio also ships open developer utilities under Dev tools for formatting, encoding, and quick technical checks. Combine those with the resources here when you are preparing a specification, reviewing a vendor proposal, or planning a launch checklist.",
            "The mobile partner checklist helps you score vendors on delivery, security, and communication habits. The project brief template captures goals, users, constraints, and success metrics in one place. The pre-launch checklist covers store policies, analytics, crash reporting, and rollback. The build-versus-buy guide frames decision criteria for executives who need a short, balanced summary.",
          ]}
        />
      </main>
      <Footer />
    </div>
  );
}
