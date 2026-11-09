import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readSiteContent } from "@/lib/content";
import { PostEditorForm } from "@/components/admin/PostEditorForm";
import { AdminPageHeader } from "../../AdminPageHeader";

export default async function NewBlogPostPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const site = await readSiteContent();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Blog", href: "/admin/blog" },
          { label: "New" },
        ]}
        title="New post"
        description="Save as a draft to iterate, then publish when you're ready. Slug auto-generates from the title."
      />
      <div className="mt-6">
        <PostEditorForm kind="blog" siteUrl={site.siteUrl} siteName={site.siteName} />
      </div>
    </div>
  );
}
