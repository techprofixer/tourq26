import Header from "@/components/Header";
import { readPrimaryNav, readNavMegaMenus } from "@/lib/nav-content";
import { readBrandContent } from "@/lib/brand-content";

export default async function MarketingHeader({ bannerActive = false }: { bannerActive?: boolean }) {
  const [navLinks, megaMenus, brand] = await Promise.all([
    readPrimaryNav(),
    readNavMegaMenus(),
    readBrandContent(),
  ]);
  return (
    <Header
      navLinks={navLinks}
      megaMenus={megaMenus}
      logoUrl={brand.logoUrl}
      bannerActive={bannerActive}
    />
  );
}
