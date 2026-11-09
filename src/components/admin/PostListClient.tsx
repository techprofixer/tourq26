"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BlogPost } from "@/lib/content";
import type { TechNewsPost } from "@/lib/tech-news-content";
import { EntityListActions } from "@/components/admin/EntityListActions";
import { AdminSearchBox } from "@/components/admin/AdminSearchBox";
import { StatusPill } from "@/components/admin/PostEditorForm";
import { formatShortDate } from "@/lib/date-format";

type Filter = "all" | "published" | "draft";
type ListPost = BlogPost | TechNewsPost;

/** Admin list for article-style content. Blog shows tags; tech news shows its category. */
export type PostListProps =
  | { kind: "blog"; posts: BlogPost[]; initialFilter?: Filter }
  | { kind: "tech-news"; posts: TechNewsPost[]; initialFilter?: Filter };

const LIST_KINDS = {
  blog: {
    adminBase: "/admin/blog",
    apiBase: "/api/admin/content/blog",
    noun: "posts",
    labelColumn: "Tags",
    searchPlaceholder: "Search title, slug, or tag…",
    deleteConfirm: "Delete this post? This cannot be undone.",
  },
  "tech-news": {
    adminBase: "/admin/tech-news",
    apiBase: "/api/admin/content/tech-news",
    noun: "stories",
    labelColumn: "Category",
    searchPlaceholder: "Search title, slug, or category…",
    deleteConfirm: "Delete this story? This cannot be undone.",
  },
} as const;

/** Tags for blog posts, the single category for tech-news stories. */
function postLabels(post: ListPost): string[] {
  return "category" in post ? [post.category] : (post.tags ?? []).slice(0, 4);
}

export function PostListClient({ kind, posts, initialFilter = "all" }: PostListProps) {
  const cfg = LIST_KINDS[kind];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (posts as ListPost[])
      .filter((p) => {
        const status = p.status ?? "published";
        if (filter !== "all" && status !== filter) return false;
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          postLabels(p).some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.dateUpdated ?? b.date).getTime() - new Date(a.dateUpdated ?? a.date).getTime());
  }, [posts, query, filter]);

  const counts = useMemo(() => {
    const published = (posts as ListPost[]).filter((p) => (p.status ?? "published") === "published").length;
    return { all: posts.length, published, draft: posts.length - published };
  }, [posts]);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-1">
          {(["all", "published", "draft"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`mono-button rounded-sm px-2.5 py-1 tabular-nums transition-colors ${
                filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.toUpperCase()} · {counts[f]}
            </button>
          ))}
        </div>
        <AdminSearchBox
          value={query}
          onChange={setQuery}
          placeholder={cfg.searchPlaceholder}
          label={`Search ${cfg.noun}`}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card-flat mt-6 text-center text-muted-foreground">
          {posts.length === 0
            ? `No ${cfg.noun} yet. Create the first one above.`
            : `No ${cfg.noun} match your filters.`}
        </div>
      ) : (
        <div className="card-flat mt-6 overflow-hidden p-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="mono-label px-4 py-3 text-muted-foreground">Title</th>
                <th className="mono-label hidden px-4 py-3 text-muted-foreground md:table-cell">{cfg.labelColumn}</th>
                <th className="mono-label hidden px-4 py-3 text-muted-foreground sm:table-cell">Updated</th>
                <th className="mono-label px-4 py-3 text-right text-muted-foreground">Status</th>
                <th className="mono-label px-4 py-3 text-right text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => {
                const editHref = `${cfg.adminBase}/${encodeURIComponent(post.slug)}/edit`;
                const labels = postLabels(post);
                return (
                  <tr
                    key={post.slug}
                    className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <Link href={editHref} className="block font-medium text-foreground hover:underline">
                        {post.title}
                      </Link>
                      <span className="mono-label text-muted-foreground">/{post.slug}</span>
                    </td>
                    <td className="hidden px-4 py-3 align-top md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {labels.map((t) => (
                          <span key={t} className="mono-label rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                            {t.toUpperCase()}
                          </span>
                        ))}
                        {labels.length === 0 ? <span className="text-[12px] text-muted-foreground/70">—</span> : null}
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-[13px] text-muted-foreground sm:table-cell">
                      {formatShortDate(post.dateUpdated ?? post.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <StatusPill status={post.status ?? "published"} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <EntityListActions
                        editHref={editHref}
                        deleteUrl={`${cfg.apiBase}/${encodeURIComponent(post.slug)}`}
                        confirmMessage={cfg.deleteConfirm}
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
