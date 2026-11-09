import type { BlogPost } from "@/lib/content";

export function formatBlogDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function blogPostsExcluding(posts: BlogPost[], slug: string, limit: number) {
  return posts.filter((p) => p.slug !== slug).slice(0, limit);
}

/** Up to two initials for author avatar */
export function authorInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
