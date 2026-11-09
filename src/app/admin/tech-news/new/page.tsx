import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readSiteContent } from "@/lib/content";
import { TechNewsPostForm } from "../TechNewsPostForm";
import { AdminPageHeader } from "../../AdminPageHeader";

export default async function NewTechNewsPostPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const site = await readSiteContent();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Tech News", href: "/admin/tech-news" },
          { label: "New" },
        ]}
        title="New story"
        description="Save as a draft to iterate, then publish when you're ready. Slug auto-generates from the title."
      />
      <div className="mt-6">
        <TechNewsPostForm siteUrl={site.siteUrl} siteName={site.siteName} />
      </div>
    </div>
  );
}
