import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { readSiteContent } from "@/lib/content";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import FloatingChatWidget from "@/components/FloatingChatWidget";
import MetaPixel from "@/components/MetaPixel";
import UtmCapture from "@/components/UtmCapture";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { readBrandContent } from "@/lib/brand-content";
import { buildThemeVars, themeFontSlugs, themeVarsToCss } from "@/lib/theme";
import JsonLd from "@/components/JsonLd";
import { INDEXABLE_ROBOTS, organizationId, websiteId } from "@/lib/seo";

// Display sans — closest open-source match to the brand's custom "The Future"
// face (DESIGN.md → typography). Inter at 400/500 with negative tracking is
// the canonical substitute.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Uppercase mono — substitute for PP Neue Montreal Mono.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Safety net: on-demand revalidation (revalidatePath("/", "layout")) covers site-setting
// edits, but this bounds staleness to an hour even if that call is ever missed.
export const revalidate = 3600;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export async function generateMetadata(): Promise<Metadata> {
  const [site, brand] = await Promise.all([readSiteContent(), readBrandContent()]);
  const siteUrl = site.siteUrl.replace(/\/$/, "");
  return {
    metadataBase: new URL(siteUrl),
    ...(brand.faviconUrl ? { icons: { icon: brand.faviconUrl } } : {}),
    title: {
      default: site.defaultTitle,
      template: site.titleTemplate,
    },
    description: site.defaultDescription,
    keywords: site.keywords?.length ? site.keywords : undefined,
    authors: [{ name: site.siteName, url: siteUrl }],
    creator: site.siteName,
    robots: site.robotsNoIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : INDEXABLE_ROBOTS,
    ...(site.googleSiteVerification || site.bingSiteVerification
      ? {
          verification: {
            ...(site.googleSiteVerification ? { google: site.googleSiteVerification } : {}),
            ...(site.bingSiteVerification
              ? { other: { "msvalidate.01": site.bingSiteVerification } }
              : {}),
          },
        }
      : {}),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: site.siteName,
      title: site.ogTitle,
      description: site.ogDescription,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${site.siteName} | Your Trusted Technology Partner`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: site.twitterTitle,
      description: site.twitterDescription,
      images: ["/opengraph-image"],
      ...(site.twitterSite
        ? { site: `@${site.twitterSite}`, creator: `@${site.twitterSite}` }
        : {}),
    },
    // No root-level `alternates.canonical`: it would be inherited by every page that doesn't set
    // its own, silently canonicalising them to the homepage. Each indexable page sets its own.
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [site, showWhatsApp, showChatAssistant, brand] = await Promise.all([
    readSiteContent(),
    isFeatureEnabled("floating_whatsapp"),
    isFeatureEnabled("floating_chat_assistant"),
    readBrandContent(),
  ]);
  const siteUrl = site.siteUrl.replace(/\/$/, "");

  const themeCss = themeVarsToCss(buildThemeVars(brand));
  const googleFontsSlugs = themeFontSlugs(brand);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(siteUrl),
    name: site.siteName,
    url: siteUrl,
    description: site.defaultDescription,
    areaServed: "Worldwide",
    logo: brand.logoUrl || `${siteUrl}/opengraph-image`,
    ...(site.sameAs?.length ? { sameAs: site.sameAs } : {}),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(siteUrl),
    name: site.siteName,
    url: siteUrl,
    description: site.defaultDescription,
    publisher: { "@id": organizationId(siteUrl) },
    inLanguage: "en-US",
  };

  return (
    <html lang="en" data-scroll-behavior="smooth">
      {googleFontsSlugs.length || themeCss ? (
        <head>
          {googleFontsSlugs.length ? (
            <>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </>
          ) : null}
          {googleFontsSlugs.map((slug) => (
            <link
              key={slug}
              rel="stylesheet"
              href={`https://fonts.googleapis.com/css2?family=${slug}&display=swap`}
            />
          ))}
          {themeCss ? <style id="brand-theme" dangerouslySetInnerHTML={{ __html: themeCss }} /> : null}
        </head>
      ) : null}
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <MetaPixel />
        <UtmCapture />
        {children}
        {showWhatsApp ? <FloatingWhatsApp /> : null}
        {showChatAssistant ? <FloatingChatWidget /> : null}
      </body>
    </html>
  );
}
