"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { TechNewsPost } from "@/lib/tech-news-content";
import { EntityListActions } from "@/components/admin/EntityListActions";
import { AdminSearchBox } from "@/components/admin/AdminSearchBox";
import { formatShortDate } from "@/lib/date-format";

type Filter = "all" | "published" | "draft";

export function TechNewsListClient({
  posts,
  initialFilter = "all",
}: {
  posts: TechNewsPost[];
  initialFilter?: Filter;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => {
        const status = p.status ?? "published";
        if (filter !== "all" && status !== filter) return false;
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const av = new Date(a.dateUpdated ?? a.date).getTime();
        const bv = new Date(b.dateUpdated ?? b.date).getTime();
        return bv - av;
      });
  }, [posts, query, filter]);

  const counts = useMemo(() => {
    let pub = 0;
    let draft = 0;
    for (const p of posts) {
      if ((p.status ?? "published") === "published") pub++;
      else draft++;
    }
    return { all: posts.length, published: pub, draft };
  }, [posts]);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-1">
          {(["all", "published", "draft"] as Filter[]).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`mono-button rounded-sm px-2.5 py-1 tabular-nums transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.toUpperCase()} · {counts[f]}
              </button>
            );
          })}
        </div>
        <AdminSearchBox value={query} onChange={setQuery} placeholder="Search title, slug, or category…" label="Search stories" />
      </div>

      {filtered.length === 0 ? (
        <div className="card-flat mt-6 text-center text-muted-foreground">
          {posts.length === 0
            ? "No stories yet. Create the first one above."
            : "No stories match your filters."}
        </div>
      ) : (
        <div className="card-flat mt-6 overflow-hidden p-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="mono-label px-4 py-3 text-muted-foreground">Title</th>
                <th className="mono-label hidden px-4 py-3 text-muted-foreground md:table-cell">
                  Category
                </th>
                <th className="mono-label hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  Updated
                </th>
                <th className="mono-label px-4 py-3 text-right text-muted-foreground">Status</th>
                <th className="mono-label px-4 py-3 text-right text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => {
                const status = post.status ?? "published";
                return (
                  <tr
                    key={post.slug}
                    className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tech-news/${encodeURIComponent(post.slug)}/edit`}
                        className="block font-medium text-foreground hover:underline"
                      >
                        {post.title}
                      </Link>
                      <span className="mono-label text-muted-foreground">/{post.slug}</span>
                    </td>
                    <td className="hidden px-4 py-3 align-top md:table-cell">
                      <span className="mono-label rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                        {post.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-[13px] text-muted-foreground sm:table-cell">
                      {formatShortDate(post.dateUpdated ?? post.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <StatusPill status={status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <EntityListActions
                        editHref={`/admin/tech-news/${encodeURIComponent(post.slug)}/edit`}
                        deleteUrl={`/api/admin/content/tech-news/${encodeURIComponent(post.slug)}`}
                        confirmMessage="Delete this story? This cannot be undone."
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "draft" | "published" }) {
  const isPub = status === "published";
  return (
    <span
      className={`mono-label inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${
        isPub
          ? "bg-[color:var(--brand-mint)] text-[color:var(--app-fg)]"
          : "bg-muted text-muted-foreground"
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
