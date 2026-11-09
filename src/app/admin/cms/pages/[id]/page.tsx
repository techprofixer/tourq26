import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readSiteContent } from "@/lib/content";
import { getPageById, getPageBlocks } from "@/lib/cms/pages";
import { AdminPageHeader } from "../../../AdminPageHeader";
import { PageEditor } from "@/components/admin/cms/PageEditor";

type Props = { params: Promise<{ id: string }> };

/** Stored custom JSON-LD → editor textarea text. An empty array is the "none" sentinel. */
function formatJsonLd(value: unknown): string {
  if (value == null || (Array.isArray(value) && value.length === 0)) return "";
  return JSON.stringify(value, null, 2);
}

export default async function AdminCmsEditPage({ params }: Props) {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const { id } = await params;
  const page = await getPageById(id);
  if (!page) notFound();

  const blocks = getPageBlocks(page);
  const site = await readSiteContent();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "CMS Pages", href: "/admin/cms/pages" },
          { label: page.title.length > 32 ? `${page.title.slice(0, 32)}…` : page.title },
        ]}
        title="Edit page"
        description="Changes to a live page go live when you click Update. ⌘S saves."
      />
      <div className="mt-6">
        <PageEditor
          key={page.id}
          mode="edit"
          pageId={page.id}
          siteUrl={site.siteUrl}
          siteName={site.siteName}
          initial={{
            title: page.title,
            slug: page.slug,
            type: page.type,
            status: page.status,
            path: page.path,
            excerpt: page.excerpt ?? "",
            blocks,
            seo: {
              metaTitle: page.seo?.metaTitle ?? "",
              metaDescription: page.seo?.metaDescription ?? "",
              focusKeyword: page.seo?.focusKeyword ?? "",
              robotsIndex: page.seo?.robotsIndex ?? true,
              robotsFollow: page.seo?.robotsFollow ?? true,
              canonical: page.seo?.canonical ?? "",
              ogImageUrl: page.seo?.ogImageUrl ?? "",
              breadcrumbLabel: page.seo?.breadcrumbLabel ?? "",
              authorName: page.seo?.authorName ?? "",
              jsonLdCustom: formatJsonLd(page.seo?.jsonLdCustom),
            },
            brief: {
              targetKeyword: page.brief?.targetKeyword ?? "",
              secondaryKeywords: (page.brief?.secondaryKeywords ?? []).join(", "),
            },
          }}
        />
      </div>
    </div>
  );
}
