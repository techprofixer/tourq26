import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getSiteUrl();
  return {
    title: "Privacy Policy",
    description:
      "Torq Studio privacy policy. How we collect, use, and protect your data. GDPR-friendly, transparent practices.",
    alternates: { canonical: `${baseUrl}/privacy` },
    openGraph: {
      title: "Privacy Policy | Torq Studio",
      description:
        "How we collect, use, and protect your data. Transparent privacy practices for our website and services.",
      url: `${baseUrl}/privacy`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPage() {
  const siteUrl = await getSiteUrl();
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Privacy", path: "/privacy" },
  ]);
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={breadcrumbLd} />
      <header className="border-b border-border/50 bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
          <Link
            href="/"
            className="font-display text-lg font-bold text-foreground"
          >
            torq <span className="text-primary">studio</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div className="prose prose-invert mt-8 max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            Torq Studio (“we”, “us”) is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our website or services.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            The site combines marketing pages, a contact form, optional analytics with consent, and client-side developer utilities. We minimise data collection to what is needed to respond to enquiries, run the site securely, and understand aggregate usage when you opt in.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            If you use only the browser-based tools under Dev tools, your inputs typically stay on your device; marketing sections may still set essential cookies or read aggregate server logs as described below. For any privacy request—access, correction, deletion, or objection—email connect@torqstudio.com and we will respond within a reasonable timeframe.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            Information we collect
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            We may collect contact details (e.g. name, email, company) when you get in touch, and usage data (e.g. pages visited) via cookies or similar technologies where applicable.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            Cookies and analytics
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            This site does not load third-party analytics, advertising, or session-recording cookies. We may use strictly
            necessary cookies to keep the site functional (for example, to remember UI state between page loads). If we
            introduce any optional analytics in the future, this policy will be updated and consent will be requested up
            front before any data is collected.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            How we use it
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            We use your information to respond to enquiries, deliver services, improve our website, and comply with legal obligations. We do not sell your data to third parties.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Contact form submissions are used to follow up on your request and, if you become a client, to administer the
            relationship. We retain enquiry data only as long as needed for those purposes or as required by law. You may
            ask us to delete or export correspondence subject to legitimate business or legal retention needs.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            Sharing, processors, and transfers
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            We use reputable infrastructure and service providers (for example hosting and email) who process data on our
            instructions. Where analytics or session tools run, they operate under your consent choice and their own
            privacy terms. We do not allow those vendors to use your personal data for their own advertising unrelated
            to providing the service.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            If data is processed in countries other than your own, we rely on appropriate safeguards where required by law
            (such as standard contractual clauses or equivalent mechanisms). Ask connect@torqstudio.com for detail if your
            organisation needs a data processing record for vendor review.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            Developer utilities on this website
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            The utilities on Torq DevTools (SVG to CSS, JSON to CSV, CSS shadow preview) run in your browser. Your
            inputs are not sent to our servers for those pages.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            Security & your rights
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            We take reasonable steps to keep your data secure. Depending on your location, you may have rights to access, correct, or delete your data. Contact us at{" "}
            <a href="mailto:connect@torqstudio.com" className="text-primary hover:underline">
              connect@torqstudio.com
            </a>{" "}
            for any privacy requests.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Rights vary by jurisdiction (for example GDPR in the EEA, UK GDPR, or similar laws elsewhere). We will verify
            requests where needed to protect your account from impersonation. If you are not satisfied with our response,
            you may lodge a complaint with your local supervisory authority where applicable.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            Children
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Our website and services are directed at businesses and professionals. We do not knowingly collect personal
            information from children. If you believe a child has provided data to us, contact connect@torqstudio.com and we
            will take appropriate steps to delete it.
          </p>
          <p className="mt-8 text-muted-foreground leading-relaxed">
            We may update this policy from time to time. Continued use of our site after changes constitutes acceptance.
          </p>
        </div>
        <Link
          href="/"
          className="mt-10 inline-block text-primary hover:underline"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
