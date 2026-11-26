"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

/**
 * Google Analytics 4 (gtag.js). Renders nothing unless NEXT_PUBLIC_GA_MEASUREMENT_ID is a valid
 * `G-…` measurement ID — inert until configured, same pattern as MetaPixel. Never loads on /admin.
 *
 * - `gtag('config')` sends the first page_view; GA4 Enhanced Measurement ("page changes based on
 *   browser history events", on by default) covers Next.js client-side navigation.
 * - Custom events go through `track()` in src/lib/analytics.ts, which forwards to `window.gtag`.
 * - The origins this needs are allow-listed in src/lib/csp.ts.
 *
 * `NEXT_PUBLIC_*` is inlined at build time: set it on the host and redeploy. Don't set it in local
 * `.env` unless you want dev traffic in your reports.
 */
export default function GoogleAnalytics() {
  const pathname = usePathname();
  if (!GA_ID || !/^G-[A-Z0-9]+$/.test(GA_ID) || pathname?.startsWith("/admin")) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
