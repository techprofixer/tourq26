"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CaseStudy } from "@/lib/case-studies-content";
import { EntityListActions } from "@/components/admin/EntityListActions";
import { AdminSearchBox } from "@/components/admin/AdminSearchBox";
import { formatShortDate } from "@/lib/date-format";

export function CaseStudyListClient({ items }: { items: CaseStudy[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.client.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="mono-label text-muted-foreground">{items.length} TOTAL</p>
        <AdminSearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search title, slug, client, or industry…"
          label="Search case studies"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card-flat mt-6 text-center text-muted-foreground">
          {items.length === 0
            ? "No case studies yet. Create the first one above."
            : "No case studies match your search."}
        </div>
      ) : (
        <div className="card-flat mt-6 overflow-hidden p-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="mono-label px-4 py-3 text-muted-foreground">Title</th>
                <th className="mono-label hidden px-4 py-3 text-muted-foreground md:table-cell">
                  Industry
                </th>
                <th className="mono-label hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  Date
                </th>
                <th className="mono-label px-4 py-3 text-right text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.slug}
                  className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/case-studies/${encodeURIComponent(c.slug)}/edit`}
                      className="block font-medium text-foreground hover:underline"
                    >
                      {c.title}
                    </Link>
                    <span className="mono-label text-muted-foreground">/{c.slug}</span>
                  </td>
                  <td className="hidden px-4 py-3 align-top text-[13px] text-muted-foreground md:table-cell">
                    {c.industry}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-[13px] text-muted-foreground sm:table-cell">
                    {formatShortDate(c.date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <EntityListActions
                      editHref={`/admin/case-studies/${encodeURIComponent(c.slug)}/edit`}
                      deleteUrl={`/api/admin/content/case-studies/${encodeURIComponent(c.slug)}`}
                      confirmMessage="Delete this case study? This cannot be undone."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
