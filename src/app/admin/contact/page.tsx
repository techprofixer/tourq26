import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readContactSubmissions } from "@/lib/content";
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

export default async function AdminContactPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const submissions = await readContactSubmissions();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Contact" },
        ]}
        title="Contact submissions"
        description="Form submissions from the contact page. Newest first."
      />

      {submissions.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No submissions yet.</p>
      ) : (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">
            Submissions <span className="text-muted-foreground">({submissions.length})</span>
          </h2>
          <ul className="mt-4 space-y-4">
            {submissions.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/30 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 pr-4">
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <a href={`mailto:${s.email}`} className="text-foreground underline underline-offset-2">
                      {s.email}
                    </a>
                    {s.company ? ` · ${s.company}` : null}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {s.message}
                  </p>
                  {s.source || s.medium || s.campaign ? (
                    <p className="mt-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                      {[s.source, s.medium, s.campaign].filter(Boolean).join(" / ")}
                    </p>
                  ) : null}
                </div>
                <time
                  className="shrink-0 font-mono text-xs uppercase tracking-wide text-muted-foreground"
                  dateTime={s.createdAt}
                >
                  {formatDate(s.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
