import type { Metadata } from "next";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import { requireMarketingFeature } from "@/lib/require-marketing-feature";
import AuditForm from "./AuditForm";

export const metadata: Metadata = {
  title: "Book Your Free Business Systems Audit | Torq Studio",
  description:
    "A 60-90 second form to book your free Business Systems Audit with Torq Studio — no account, no obligation.",
  robots: { index: false, follow: true },
};

export default async function BusinessSystemsAuditPage() {
  await requireMarketingFeature("business_systems_audit", "business_systems_audit");

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <section className="border-t border-hairline">
          <div className="mx-auto w-full max-w-[720px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <p className="mono-eyebrow text-muted-foreground">FREE BUSINESS SYSTEMS AUDIT</p>
            <h1 className="display-lg mt-4 text-foreground">Book your free audit.</h1>
            <p className="mt-3 max-w-lg text-[15px] leading-[1.5] text-muted-foreground">
              Takes about a minute. No account, no commitment.
            </p>
            <div className="mt-10">
              <AuditForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
