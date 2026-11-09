import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listRedirects } from "@/lib/redirects";
import { RedirectsClient } from "./RedirectsClient";
import { AdminPageHeader } from "../AdminPageHeader";

export default async function AdminRedirectsPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const redirects = await listRedirects();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Redirects" },
        ]}
        title="Redirects"
        description="Admin-editable 301/302 redirect rules, applied at request time — no rebuild needed."
      />
      <RedirectsClient initialRedirects={redirects} />
    </div>
  );
}
