import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readBrandContent } from "@/lib/brand-content";
import { readSiteContent } from "@/lib/content";
import { BrandSeoTabs } from "./BrandSeoTabs";
import { AdminPageHeader } from "../AdminPageHeader";

export default async function AdminBrandPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const [brandData, siteData] = await Promise.all([readBrandContent(), readSiteContent()]);

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Brand & SEO" },
        ]}
        title="Brand & SEO"
        description="Logo, colors, typography, and voice, plus the metadata, social cards, and search engine settings that control how the site appears off-site."
      />
      <BrandSeoTabs brandData={brandData} siteData={siteData} />
    </div>
  );
}
