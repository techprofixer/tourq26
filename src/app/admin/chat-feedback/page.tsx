import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readChatFeedback } from "@/lib/content";
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

export default async function AdminChatFeedbackPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const feedback = await readChatFeedback();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Chat feedback" },
        ]}
        title="Chat feedback"
        description="Thumbs up/down ratings visitors left on assistant replies. Newest first."
      />

      {feedback.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No feedback yet.</p>
      ) : (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">
            Ratings <span className="text-muted-foreground">({feedback.length})</span>
          </h2>
          <ul className="mt-4 space-y-4">
            {feedback.map((f) => (
              <li
                key={f.id}
                className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/30 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 pr-4">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <span>{f.rating === "up" ? "👍" : "👎"}</span>
                    <span className="text-sm text-muted-foreground">{f.rating === "up" ? "Good response" : "Bad response"}</span>
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                    <span className="font-medium text-foreground">Q: </span>
                    {f.userQuery}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    <span className="font-medium text-foreground">A: </span>
                    {f.assistantReply}
                  </p>
                </div>
                <time
                  className="shrink-0 font-mono text-xs uppercase tracking-wide text-muted-foreground"
                  dateTime={f.createdAt}
                >
                  {formatDate(f.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
