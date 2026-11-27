import type { Metadata } from "next";
import MarketingHeader from "@/components/MarketingHeader";
import Hero from "@/components/Hero";
import OfferBanner from "@/components/OfferBanner";
import HomeSlider from "@/components/HomeSlider";
import Offers from "@/components/Offers";
import Services from "@/components/Services";
import WhyChooseUs from "@/components/WhyChooseUs";
import CaseStudies from "@/components/CaseStudies";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Process from "@/components/Process";
import Industries from "@/components/Industries";
import Faq from "@/components/Faq";
import HomePageContent from "@/components/HomePageContent";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { readTestimonials, readSiteContent } from "@/lib/content";
import { readHomeContent, isOfferBannerLive, customHomeJsonLd } from "@/lib/home-content";
import { readCaseStudies } from "@/lib/case-studies-content";
import { webPageJsonLd, faqPageJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { getEntityCatalogCards } from "@/lib/entity-catalog";
import { servicePages } from "@/data/services-content";

export async function generateMetadata(): Promise<Metadata> {
  const [site, home] = await Promise.all([readSiteContent(), readHomeContent()]);
  const siteUrl = site.siteUrl.replace(/\/$/, "");
  const canonical = home.seoCanonical.trim() || siteUrl;

  // Homepage SEO overrides (Admin → Homepage → SEO & schema). Anything left blank falls back to the
  // site-wide defaults from Brand & SEO, which the layout supplies.
  const title = home.seoMetaTitle.trim();
  const description = home.seoMetaDescription.trim();
  const ogTitle = home.seoOgTitle.trim() || title;
  const ogDescription = home.seoOgDescription.trim() || description;
  const ogImage = home.seoOgImageUrl.trim();
  const overridesOg = Boolean(ogTitle || ogDescription || ogImage);

  return {
    ...(title ? { title: { absolute: title } } : {}),
    ...(description ? { description } : {}),
    alternates: {
      canonical,
      types: { "application/rss+xml": `${siteUrl}/feed.xml` },
    },
    // openGraph replaces (not merges) the layout's, so when any field is overridden we rebuild it
    // in full from the site defaults.
    ...(overridesOg
      ? {
          openGraph: {
            type: "website" as const,
            locale: "en_IN",
            url: canonical,
            siteName: site.siteName,
            title: ogTitle || site.ogTitle,
            description: ogDescription || site.ogDescription,
            images: [ogImage ? { url: ogImage, width: 1200, height: 630, alt: ogTitle || site.ogTitle } : DEFAULT_OG_IMAGE],
          },
          twitter: {
            card: "summary_large_image" as const,
            title: ogTitle || site.twitterTitle,
            description: ogDescription || site.twitterDescription,
            images: [ogImage || DEFAULT_OG_IMAGE.url],
          },
        }
      : {}),
    ...(home.seoRobotsIndex
      ? {}
      : { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }),
  };
}

export default async function Home() {
  const [testimonials, site, home, caseStudies, industries] = await Promise.all([
    readTestimonials(),
    readSiteContent(),
    readHomeContent(),
    readCaseStudies(),
    getEntityCatalogCards("INDUSTRY"),
  ]);
  // Admin-written FAQ wins; otherwise build from the service pages so there is always something real.
  const faqs = home.faqItems.length
    ? home.faqItems
    : servicePages.flatMap((p) => p.faqs.slice(0, 2)).slice(0, 10);
  const siteUrl = site.siteUrl.replace(/\/$/, "");
  const servicesLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Services",
    numberOfItems: home.servicesItems.length,
    itemListElement: home.servicesItems.map((svc, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: svc.title,
      url: `${siteUrl}/services/${svc.slug}`,
    })),
  };
  const webPageLd = webPageJsonLd({
    siteUrl,
    path: "/",
    name: home.seoMetaTitle.trim() || site.defaultTitle,
    description: home.seoMetaDescription.trim() || site.defaultDescription,
  });
  const customLd = customHomeJsonLd(home.seoJsonLdCustom);

  const bannerActive = isOfferBannerLive(home);

  return (
    <>
      <JsonLd data={webPageLd} />
      {home.schemaServicesEnabled && home.servicesItems.length ? <JsonLd data={servicesLd} /> : null}
      {home.faqEnabled && home.schemaFaqEnabled && faqs.length ? <JsonLd data={faqPageJsonLd(faqs)} /> : null}
      {customLd.map((ld, i) => (
        <JsonLd key={i} data={ld} />
      ))}
      {bannerActive ? (
        <OfferBanner
          text={home.offerBannerText}
          ctaLabel={home.offerBannerCtaLabel}
          ctaHref={home.offerBannerCtaHref}
        />
      ) : null}
      <MarketingHeader bannerActive={bannerActive} />
      <main>
        <Hero
          heroEyebrow={home.heroEyebrow}
          heroHeading={home.heroHeading}
          heroSubheading={home.heroSubheading}
          heroPrimaryCtaLabel={home.heroPrimaryCtaLabel}
          heroPrimaryCtaHref={home.heroPrimaryCtaHref}
          heroSecondaryCtaLabel={home.heroSecondaryCtaLabel}
          heroSecondaryCtaHref={home.heroSecondaryCtaHref}
          heroTertiaryCtaLabel={home.heroTertiaryCtaLabel}
          heroTertiaryCtaHref={home.heroTertiaryCtaHref}
          bannerActive={bannerActive}
          heroImageEnabled={home.heroImageEnabled}
          heroImageUrl={home.heroImageUrl}
          heroImageAlt={home.heroImageAlt}
        />
        {home.sliderEnabled ? <HomeSlider heading={home.sliderHeading} items={home.sliderItems} /> : null}
        {home.offersEnabled ? (
          <Offers offersHeading={home.offersHeading} offersIntro={home.offersIntro} offersItems={home.offersItems} />
        ) : null}
        <Services
          servicesEyebrow={home.servicesEyebrow}
          servicesHeading={home.servicesHeading}
          servicesIntro={home.servicesIntro}
          servicesItems={home.servicesItems}
        />
        <CaseStudies
          caseStudiesEyebrow={home.caseStudiesEyebrow}
          caseStudiesHeading={home.caseStudiesHeading}
          caseStudiesIntro={home.caseStudiesIntro}
          items={caseStudies}
        />
        <WhyChooseUs
          whyUsEyebrow={home.whyUsEyebrow}
          whyUsHeading={home.whyUsHeading}
          whyUsIntro={home.whyUsIntro}
          whyUsItems={home.whyUsItems}
        />
        {home.processEnabled ? (
          <Process
            eyebrow={home.processEyebrow}
            heading={home.processHeading}
            intro={home.processIntro}
            steps={home.processSteps}
          />
        ) : null}
        {home.industriesEnabled ? (
          <Industries
            items={industries}
            eyebrow={home.industriesEyebrow}
            heading={home.industriesHeading}
            intro={home.industriesIntro}
          />
        ) : null}
        {home.testimonialsEnabled ? (
          <Testimonials
            items={testimonials}
            eyebrow={home.testimonialsEyebrow}
            heading={home.testimonialsHeading}
            intro={home.testimonialsIntro}
          />
        ) : null}
        {home.faqEnabled ? <Faq items={faqs} heading={home.faqHeading} intro={home.faqIntro} /> : null}
        <CTA
          ctaEyebrow={home.ctaEyebrow}
          ctaHeading={home.ctaHeading}
          ctaBody={home.ctaBody}
          ctaPrimaryLabel={home.ctaPrimaryLabel}
          ctaPrimaryHref={home.ctaPrimaryHref}
          ctaSecondaryLabel={home.ctaSecondaryLabel}
          ctaSecondaryHref={home.ctaSecondaryHref}
          ctaEmail={home.ctaEmail}
          ctaFootnote={home.ctaFootnote}
        />
        <HomePageContent />
        <Footer />
      </main>
    </>
  );
}
