import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readBlogPosts, readSiteContent } from "@/lib/content";
import { PostEditorForm } from "@/components/admin/PostEditorForm";
import { AdminPageHeader } from "../../../AdminPageHeader";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const { slug } = await params;
  const [posts, site] = await Promise.all([readBlogPosts(), readSiteContent()]);
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Blog", href: "/admin/blog" },
          { label: post.title.length > 32 ? `${post.title.slice(0, 32)}…` : post.title },
        ]}
        title="Edit post"
        description="Save changes anytime — drafts stay private, publishes go live immediately."
      />
      <div className="mt-6">
        <PostEditorForm kind="blog" key={post.slug} post={post} siteUrl={site.siteUrl} siteName={site.siteName} />
      </div>
    </div>
  );
}
