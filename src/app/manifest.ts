import type { MetadataRoute } from "next";
import { readSiteContent } from "@/lib/content";
import { readBrandContent } from "@/lib/brand-content";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [site, brand] = await Promise.all([readSiteContent(), readBrandContent()]);

  return {
    name: site.siteName,
    short_name: site.siteName,
    description: site.defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: brand.colorPrimary || "#ffffff",
    icons: [
      brand.faviconUrl
        ? { src: brand.faviconUrl, sizes: "any" }
        : { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
