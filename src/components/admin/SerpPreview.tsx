"use client";

import { clampText } from "@/lib/seo-generate";
type Props = {
  siteUrl: string;
  /** Full path including leading slash, e.g. `/blog/my-post` or `/services/mvp`. Empty = homepage. */
  path?: string;
  /** @deprecated Prefer `path`. Kept for older callers — treated as `/blog/{slug}`. */
  slug?: string;
  title: string;
  description: string;
};

function hostname(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

function resolvePath(path: string | undefined, slug: string | undefined): string {
  if (typeof path === "string") {
    const p = path.trim();
    if (!p || p === "/") return "";
    return p.startsWith("/") ? p : `/${p}`;
  }
  const s = (slug || "").trim();
  if (!s) return "";
  return `/blog/${s}`;
}

export function SerpPreview({ siteUrl, path, slug, title, description }: Props) {
  const base = siteUrl.replace(/\/$/, "");
  const resolved = resolvePath(path, slug);
  const isHome = !resolved;
  const url = isHome ? base : `${base}${resolved}`;
  const host = hostname(base);
  const crumbs = isHome
    ? host
    : `${host} › ${resolved
        .replace(/^\//, "")
        .split("/")
        .filter(Boolean)
        .join(" › ")}`;

  return (
    <div className="card-flat p-4">
      <p className="mono-eyebrow text-muted-foreground">GOOGLE PREVIEW</p>
      <div className="mt-3 rounded-md border border-border bg-background p-4 font-sans">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span
            aria-hidden
            className="inline-block h-5 w-5 rounded-full border border-border bg-muted"
          />
          <div className="leading-tight">
            <p className="text-foreground">{host || "yoursite.com"}</p>
            <p className="text-[11px] text-muted-foreground">{crumbs}</p>
          </div>
        </div>
        <a
          href={url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-[18px] leading-tight text-[color:#1a0dab] hover:underline"
        >
          {clampText(title || "Your page title — Site name", 70)}
        </a>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
          {clampText(
            description || "Your meta description appears here. Aim for 120–160 characters.",
            160,
          )}
        </p>
      </div>
    </div>
  );
}
