import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { readTechNewsPosts } from "@/lib/tech-news-content";
import { TechNewsListClient } from "./TechNewsListClient";
import { AdminPageHeader } from "../AdminPageHeader";

type SearchParams = Promise<{ status?: string }>;

export default async function AdminTechNewsPage({
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

  const posts = await readTechNewsPosts();

  return (
    <div>
      <AdminPageHeader
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Tech News" }]}
        title="Tech News"
        description="Manage briefings, categories, and SEO. Changes appear on the public site after save."
        actions={
          <Link href="/admin/tech-news/new" className="btn-base btn-primary">
            New story
          </Link>
        }
      />
      <TechNewsListClient posts={posts} initialFilter={status} />
    </div>
  );
}
