import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readHomeContent } from "@/lib/home-content";
import { HomeContentForm } from "./HomeContentForm";
import { AdminPageHeader } from "../AdminPageHeader";

export default async function AdminHomePage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const data = await readHomeContent();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Homepage" },
        ]}
        title="Homepage"
        description="Hero (with optional image), image slider, offer banner, offers, services, why-us, case studies intro, closing CTA, and the snapshot section — everything on the homepage except testimonials (Testimonials page) and the case-study cards themselves."
      />
      <HomeContentForm initialData={data} />
    </div>
  );
}
