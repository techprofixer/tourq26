import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getCaseStudyBySlug } from "@/lib/case-studies-content";
import { listEntities } from "@/lib/cms/entities";
import { CaseStudyForm } from "../../CaseStudyForm";
import { AdminPageHeader } from "../../../AdminPageHeader";

export default async function EditCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const { slug } = await params;
  const [item, industries] = await Promise.all([getCaseStudyBySlug(slug), listEntities("INDUSTRY")]);
  if (!item) notFound();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Case studies", href: "/admin/case-studies" },
          { label: item.title.length > 32 ? `${item.title.slice(0, 32)}…` : item.title },
        ]}
        title="Edit case study"
        description="Save changes anytime — updates go live immediately."
      />
      <CaseStudyForm key={item.slug} item={item} availableIndustries={industries.map((i) => i.name)} />
    </div>
  );
}
