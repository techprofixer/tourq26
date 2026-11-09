"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EntityListActions({
  editHref,
  deleteUrl,
  confirmMessage,
}: {
  editHref: string;
  deleteUrl: string;
  confirmMessage: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!confirm(confirmMessage)) return;
    setBusy(true);
    const res = await fetch(deleteUrl, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("Failed to delete");
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <Link
        href={editHref}
        className="mono-button rounded-sm border border-border bg-background px-2.5 py-1 text-foreground transition-colors hover:border-foreground"
      >
        EDIT
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="mono-button rounded-sm border border-transparent bg-[color:rgba(220,38,38,0.08)] px-2.5 py-1 text-[color:var(--app-destructive)] transition-colors hover:bg-[color:rgba(220,38,38,0.18)] disabled:opacity-50"
      >
        {busy ? "…" : "DELETE"}
      </button>
    </div>
  );
}
