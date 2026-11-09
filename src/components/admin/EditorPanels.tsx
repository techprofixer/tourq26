/** Shared building blocks for admin content editors (blog / case study / tech news / CMS pages)
 *  so every editor gets the same sidebar cards, rows and status pill. */

export function StatusPill({ status }: { status: "draft" | "published" }) {
  const isPub = status === "published";
  return (
    <span
      className={`mono-label inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${
        isPub ? "bg-[color:var(--brand-mint)] text-[color:var(--app-fg)]" : "bg-muted text-muted-foreground"
      }`}
    >
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          isPub ? "bg-[color:var(--app-success)]" : "bg-[color:var(--app-muted-fg)]"
        }`}
      />
      {isPub ? "LIVE" : "DRAFT"}
    </span>
  );
}

export function Card({
  title,
  action,
  children,
}: {
  title: string;
  /** Optional control rendered at the right of the card heading. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card-flat p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="mono-eyebrow text-muted-foreground">{title}</p>
        {action}
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function Row({ label, value, control }: { label: string; value?: string | number; control?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="mono-label text-muted-foreground">{label.toUpperCase()}</span>
      {control ? control : <span className="text-[13px] text-foreground">{value}</span>}
    </div>
  );
}

export function SidebarField({
  label,
  hint,
  children,
}: {
  label: string;
  /** Helper / validation text under the control. */
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mono-label text-muted-foreground">{label}</p>
      <div className="mt-1.5">{children}</div>
      {hint ? <div className="mt-1 text-[12px] leading-snug text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
