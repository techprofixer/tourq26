import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listRecentActivity } from "@/lib/activity-log";
import { AdminPageHeader } from "../AdminPageHeader";

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

const ACTION_LABEL: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  published: "Published",
};

export default async function AdminActivityPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const entries = await listRecentActivity(200);
  const groups: { day: string; items: typeof entries }[] = [];
  for (const entry of entries) {
    const day = dayKey(entry.createdAt);
    const group = groups.find((g) => g.day === day);
    if (group) group.items.push(entry);
    else groups.push({ day, items: [entry] });
  }

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Activity" },
        ]}
        title="Activity"
        description="What changed and when, across blog, CMS, site settings, and everything else in this admin."
      />
      <div className="mt-6 space-y-8">
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          groups.map((group) => (
            <section key={group.day} className="space-y-2">
              <p className="mono-eyebrow text-muted-foreground">{group.day.toUpperCase()}</p>
              <div className="space-y-1.5">
                {group.items.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-baseline justify-between gap-3 rounded-md border border-border/50 bg-background/60 px-3 py-2"
                  >
                    <p className="text-sm text-foreground">
                      <span className="mono-label mr-2 text-muted-foreground">
                        {(ACTION_LABEL[entry.action] ?? entry.action).toUpperCase()}
                      </span>
                      {entry.summary}
                    </p>
                    <p className="mono-label whitespace-nowrap text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
