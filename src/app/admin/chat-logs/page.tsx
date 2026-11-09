import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listChatQueryLog } from "@/lib/content";
import { AdminPageHeader } from "../AdminPageHeader";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default async function AdminChatLogsPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const logs = await listChatQueryLog(200);

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Chat logs" },
        ]}
        title="Chat logs"
        description="Every question visitors have asked the assistant — typed or picked from a suggestion. Most recent 200, newest first."
      />

      {logs.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No queries logged yet.</p>
      ) : (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">
            Queries <span className="text-muted-foreground">({logs.length})</span>
          </h2>
          <ul className="mt-4 space-y-3">
            {logs.map((l) => (
              <li
                key={l.id}
                className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 pr-4">
                  <p className="text-sm leading-relaxed text-foreground/90">{l.query}</p>
                  {l.fromSuggestion ? (
                    <span className="mono-label mt-1 inline-block rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">
                      via suggestion
                    </span>
                  ) : null}
                </div>
                <time
                  className="shrink-0 font-mono text-xs uppercase tracking-wide text-muted-foreground"
                  dateTime={l.createdAt}
                >
                  {formatDate(l.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
