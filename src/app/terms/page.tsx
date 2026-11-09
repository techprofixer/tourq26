import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getSiteUrl } from "@/lib/site-url";
import { breadcrumbListJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getSiteUrl();
  return {
    title: "Terms of Service",
    description:
      "Torq Studio terms of service. Terms governing use of our website and services. Intellectual property and contact.",
    alternates: { canonical: `${baseUrl}/terms` },
    openGraph: {
      title: "Terms of Service | Torq Studio",
      description:
        "Terms governing use of our website and services. Use of website, services, and intellectual property.",
      url: `${baseUrl}/terms`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function TermsPage() {
  const siteUrl = await getSiteUrl();
  const breadcrumbLd = breadcrumbListJsonLd(siteUrl, [
    { name: "Home", path: "/" },
    { name: "Terms", path: "/terms" },
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div className="prose prose-invert mt-8 max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            By using the Torq Studio website and services, you agree to these terms. If you do not agree, please do not use our site or services.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            These terms cover general use of torqstudio.com, including browsing, downloading free resources, and using in-browser utilities. Custom software development, retainers, and consulting engagements are also governed by separate written agreements that take precedence for those projects.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We may update this page to reflect new features or legal requirements. The “Last updated” date at the top summarises the latest revision. Continued use after changes means you accept the updated terms unless a signed contract with Torq Studio says otherwise.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            Use of our website
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            You may use our website for lawful purposes only. You must not use it to transmit harmful, offensive, or illegal content or to attempt to gain unauthorised access to our or others’ systems.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Automated scraping, excessive load generation, or attempts to reverse engineer our services beyond normal
            browsing may be blocked. Free resources and developer utilities are provided as-is for your internal business
            use unless a separate licence says otherwise; redistribution of our site content or branding without permission
            is not allowed.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            Services & agreements
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Specific projects and engagements are governed by separate agreements (e.g. statements of work, contracts). Nothing on this website constitutes a binding commitment until a written agreement is signed.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            Intellectual property
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Content on this site (text, design, logos) is owned by Torq Studio or its licensors. You may not copy or use it without our prior written permission. Deliverables under client projects are governed by the relevant project agreement.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            Disclaimers and limitation of liability
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            The website, free resources, and in-browser tools are provided for general information and productivity. They
            are not legal, financial, or security advice. To the fullest extent permitted by law, Torq Studio disclaims
            warranties of merchantability, fitness for a particular purpose, and non-infringement for use of the site.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We are not liable for indirect, incidental, or consequential damages arising from your use of the site or
            reliance on its content, except where liability cannot be excluded under applicable law. Nothing in these
            terms limits liability for death or personal injury caused by negligence where such limitation is unlawful.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            Third-party links and tools
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Our site may link to third-party websites or describe integrations. We are not responsible for their content
            or practices. Analytics or embedded widgets loaded after you consent are subject to those providers’ terms.
            Review their policies before submitting personal data outside torqstudio.com.
          </p>
          <h2 className="mt-8 font-display text-lg font-semibold text-foreground">
            Contact
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            For questions about these terms, contact us at{" "}
            <a href="mailto:connect@torqstudio.com" className="text-primary hover:underline">
              connect@torqstudio.com
            </a>.
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
