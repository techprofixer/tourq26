import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import { requireMarketingFeature } from "@/lib/require-marketing-feature";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import SuccessActions from "./SuccessActions";

export const metadata: Metadata = {
  title: "You're on the list | Torq Studio",
  robots: { index: false, follow: false },
};

export default async function AuditSuccessPage() {
  await requireMarketingFeature("business_systems_audit", "business_systems_audit");
  const whatsappUrl = buildWhatsAppUrl(
    "Hi, I just booked a Free Business Systems Audit — looking forward to the call.",
  );

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <section className="border-t border-hairline">
          <div className="mx-auto w-full max-w-[640px] px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--app-success)" }}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h1 className="display-lg mt-6 text-foreground">
              You&apos;re on the list. Let&apos;s build something better.
            </h1>
            <p className="mt-4 text-[16px] leading-[1.6] text-muted-foreground">
              We&apos;ll review what you shared and reach out shortly to schedule your free
              Business Systems Audit.
            </p>
            <SuccessActions whatsappUrl={whatsappUrl} />
            <p className="mt-10 border-t border-hairline pt-6 text-[14px] text-muted-foreground">
              <Link href="/" className="text-foreground underline underline-offset-4 decoration-[var(--app-hairline)] hover:decoration-[var(--app-fg)]">
                Back to homepage
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
