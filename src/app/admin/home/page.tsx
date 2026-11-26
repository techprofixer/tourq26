import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readHomeContent } from "@/lib/home-content";
import { readSiteContent } from "@/lib/content";
import { HomeContentForm } from "./HomeContentForm";
import { AdminPageHeader } from "../AdminPageHeader";

export default async function AdminHomePage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const [data, site] = await Promise.all([readHomeContent(), readSiteContent()]);

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Homepage" },
        ]}
        title="Homepage"
        description="Every section of the homepage — hero, services, proof strip, process, industries, market pulse, FAQ and closing CTA — plus its SEO and structured data. Testimonial quotes and case-study cards are managed on their own pages."
      />
      <HomeContentForm
        initialData={data}
        site={{
          siteUrl: site.siteUrl,
          siteName: site.siteName,
          defaultTitle: site.defaultTitle,
          defaultDescription: site.defaultDescription,
          ogTitle: site.ogTitle,
          ogDescription: site.ogDescription,
        }}
      />
    </div>
  );
}
