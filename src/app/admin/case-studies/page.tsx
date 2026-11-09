import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { readCaseStudies } from "@/lib/case-studies-content";
import { CaseStudyListClient } from "./CaseStudyListClient";
import { AdminPageHeader } from "../AdminPageHeader";

export default async function AdminCaseStudiesPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const items = await readCaseStudies();

  return (
    <div>
      <AdminPageHeader
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Case studies" }]}
        title="Case studies"
        description="Client engagements shown on /case-studies and the homepage teaser."
        actions={
          <Link href="/admin/case-studies/new" className="btn-base btn-primary">
            New case study
          </Link>
        }
      />
      <CaseStudyListClient items={items} />
    </div>
  );
}
