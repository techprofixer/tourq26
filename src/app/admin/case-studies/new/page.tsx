import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listEntities } from "@/lib/cms/entities";
import { CaseStudyForm } from "../CaseStudyForm";
import { AdminPageHeader } from "../../AdminPageHeader";

export default async function NewCaseStudyPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const industries = await listEntities("INDUSTRY");

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Case studies", href: "/admin/case-studies" },
          { label: "New" },
        ]}
        title="New case study"
        description="Slug auto-generates from the title."
      />
      <CaseStudyForm availableIndustries={industries.map((i) => i.name)} />
    </div>
  );
}
