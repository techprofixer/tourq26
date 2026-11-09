import type { Metadata } from "next";
import MarketingHeader from "@/components/MarketingHeader";
import Hero from "@/components/Hero";
import OfferBanner from "@/components/OfferBanner";
import HomeSlider from "@/components/HomeSlider";
import Offers from "@/components/Offers";
import WorkGalleryStrip from "@/components/WorkGalleryStrip";
import TrustBar from "@/components/TrustBar";
import Services from "@/components/Services";
import WhyChooseUs from "@/components/WhyChooseUs";
import CaseStudies from "@/components/CaseStudies";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import HomePageContent from "@/components/HomePageContent";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { readTestimonials, readSiteContent } from "@/lib/content";
import { readHomeContent } from "@/lib/home-content";
import { readCaseStudies } from "@/lib/case-studies-content";
import { webPageJsonLd } from "@/lib/seo";
import { SupportingProseSection } from "@/components/marketing/SupportingProseSection";

export async function generateMetadata(): Promise<Metadata> {
  const site = await readSiteContent();
  const siteUrl = site.siteUrl.replace(/\/$/, "");
  return {
    alternates: { canonical: siteUrl },
    openGraph: { url: siteUrl },
  };
}

export default async function Home() {
  const [testimonials, site, home, caseStudies] = await Promise.all([
    readTestimonials(),
    readSiteContent(),
    readHomeContent(),
    readCaseStudies(),
  ]);
  const siteUrl = site.siteUrl.replace(/\/$/, "");
  const servicesLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Services",
    numberOfItems: 5,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Mobile Apps", url: `${siteUrl}/services/mobile-app-development` },
      { "@type": "ListItem", position: 2, name: "Web & APIs", url: `${siteUrl}/services/web-development` },
      { "@type": "ListItem", position: 3, name: "AI Solutions", url: `${siteUrl}/services/ai-solutions` },
      { "@type": "ListItem", position: 4, name: "Remote IT", url: `${siteUrl}/services/remote-it` },
      { "@type": "ListItem", position: 5, name: "Technical consulting", url: `${siteUrl}/services/technical-consulting` },
    ],
  };
  const webPageLd = webPageJsonLd({
    siteUrl,
    path: "/",
    name: site.defaultTitle,
    description: site.defaultDescription,
  });

  const bannerActive = home.offerBannerEnabled && Boolean(home.offerBannerText.trim());

  return (
    <>
      <JsonLd data={webPageLd} />
      <JsonLd data={servicesLd} />
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
          heroTags={home.heroTags}
          bannerActive={bannerActive}
          heroImageEnabled={home.heroImageEnabled}
          heroImageUrl={home.heroImageUrl}
          heroImageAlt={home.heroImageAlt}
        />
        {home.sliderEnabled ? <HomeSlider heading={home.sliderHeading} items={home.sliderItems} /> : null}
        <WorkGalleryStrip />
        <TrustBar />
        {home.offersEnabled ? (
          <Offers offersHeading={home.offersHeading} offersIntro={home.offersIntro} offersItems={home.offersItems} />
        ) : null}
        <Services
          servicesEyebrow={home.servicesEyebrow}
          servicesHeading={home.servicesHeading}
          servicesIntro={home.servicesIntro}
          servicesItems={home.servicesItems}
        />
        <WhyChooseUs
          whyUsEyebrow={home.whyUsEyebrow}
          whyUsHeading={home.whyUsHeading}
          whyUsIntro={home.whyUsIntro}
          whyUsItems={home.whyUsItems}
        />
        <CaseStudies
          caseStudiesEyebrow={home.caseStudiesEyebrow}
          caseStudiesHeading={home.caseStudiesHeading}
          caseStudiesIntro={home.caseStudiesIntro}
          items={caseStudies}
        />
        <Testimonials items={testimonials} />
        <HomePageContent />
        <SupportingProseSection
          id="home-snapshot"
          heading={home.snapshotHeading}
          paragraphs={home.snapshotParagraphs}
        />
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
        <Footer />
      </main>
    </>
  );
}
