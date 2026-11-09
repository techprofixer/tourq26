import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { readBlogPosts } from "@/lib/content";
import { PostListClient } from "@/components/admin/PostListClient";
import { AdminPageHeader } from "../AdminPageHeader";

type SearchParams = Promise<{ status?: string }>;

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const params = await searchParams;
  const status = params?.status === "draft" || params?.status === "published"
    ? params.status
    : "all";

  const posts = await readBlogPosts();

  return (
    <div>
      <AdminPageHeader
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Blog" }]}
        title="Blog"
        description="Manage articles, drafts, tags, and SEO. Changes appear on the public site after save."
        actions={
          <Link href="/admin/blog/new" className="btn-base btn-primary">
            New post
          </Link>
        }
      />
      <PostListClient kind="blog" posts={posts} initialFilter={status} />
    </div>
  );
}
