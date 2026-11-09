import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listEntities } from "@/lib/cms/entities";
import { AdminPageHeader } from "../../AdminPageHeader";
import { EntitiesClient } from "./EntitiesClient";

export default async function AdminCmsEntitiesPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  let initial = {
    services: [] as Awaited<ReturnType<typeof listEntities>>,
    solutions: [] as Awaited<ReturnType<typeof listEntities>>,
    industries: [] as Awaited<ReturnType<typeof listEntities>>,
    technologies: [] as Awaited<ReturnType<typeof listEntities>>,
    locations: [] as Awaited<ReturnType<typeof listEntities>>,
  };
  let dbError: string | null = null;

  try {
    const [services, solutions, industries, technologies, locations] = await Promise.all([
      listEntities("SERVICE"),
      listEntities("SOLUTION"),
      listEntities("INDUSTRY"),
      listEntities("TECHNOLOGY"),
      listEntities("LOCATION"),
    ]);
    initial = { services, solutions, industries, technologies, locations };
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Database unavailable";
  }

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Entities" },
        ]}
        title="Entities"
        description="Services, Solutions, Industries, Technologies, and Locations — the graph that powers SEO and internal linking."
      />
      {dbError ? (
        <p className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          MongoDB not ready: {dbError}
        </p>
      ) : (
        <EntitiesClient initial={initial} />
      )}
    </div>
  );
}
