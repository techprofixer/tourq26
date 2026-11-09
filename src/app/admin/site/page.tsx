import { redirect } from "next/navigation";

/** Site & SEO settings moved into the Brand & SEO page as a tab. */
export default function AdminSiteRedirect() {
  redirect("/admin/brand?tab=seo");
}
