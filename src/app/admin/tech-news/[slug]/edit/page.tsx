import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readTechNewsPosts } from "@/lib/tech-news-content";
import { readSiteContent } from "@/lib/content";
import { TechNewsPostForm } from "../../TechNewsPostForm";
import { AdminPageHeader } from "../../../AdminPageHeader";

export default async function EditTechNewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const { slug } = await params;
  const [posts, site] = await Promise.all([readTechNewsPosts(), readSiteContent()]);
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Tech News", href: "/admin/tech-news" },
          { label: post.title.length > 32 ? `${post.title.slice(0, 32)}…` : post.title },
        ]}
        title="Edit story"
        description="Save changes anytime — drafts stay private, publishes go live immediately."
      />
      <div className="mt-6">
        <TechNewsPostForm key={post.slug} post={post} siteUrl={site.siteUrl} siteName={site.siteName} />
      </div>
    </div>
  );
}
