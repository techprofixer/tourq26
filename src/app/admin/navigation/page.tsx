import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readPrimaryNav } from "@/lib/nav-content";
import { NavigationForm } from "./NavigationForm";
import { AdminPageHeader } from "../AdminPageHeader";

export default async function AdminNavigationPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const links = await readPrimaryNav();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Navigation" },
        ]}
        title="Navigation"
        description="The primary nav bar links shown across the marketing site."
      />
      <NavigationForm initialLinks={links} />
    </div>
  );
}
