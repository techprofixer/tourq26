import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readFooterContent } from "@/lib/footer-content";
import { FooterForm } from "./FooterForm";
import { AdminPageHeader } from "../AdminPageHeader";

export default async function AdminFooterPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const data = await readFooterContent();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Footer" },
        ]}
        title="Footer"
        description="Brand blurb, tagline, and the 4 link columns shown in the site-wide footer."
      />
      <FooterForm initialData={data} />
    </div>
  );
}
