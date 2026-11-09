"use client";

type Props = {
  siteUrl: string;
  /** Full path including leading slash, e.g. `/tech-news/my-story`. Preferred over `slug`. */
  path?: string;
  /** @deprecated Prefer `path`. Kept for older callers — treated as `/blog/{slug}`. */
  slug?: string;
  title: string;
  description: string;
  coverImage?: string;
  siteName: string;
  /** Eyebrow label on the gradient fallback card, e.g. "BLOG" or "TECH NEWS". */
  kicker?: string;
};

function clamp(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1).trim()}…` : s;
}

function hostname(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

export function SocialPreview({
  siteUrl,
  path,
  slug,
  title,
  description,
  coverImage,
  siteName,
  kicker = "BLOG",
}: Props) {
  const base = siteUrl.replace(/\/$/, "");
  const resolvedPath = path ?? `/blog/${slug || "your-slug"}`;
  const url = `${base}${resolvedPath}`;

  return (
    <div className="card-flat p-4">
      <p className="mono-eyebrow text-muted-foreground">SOCIAL CARD</p>
      <div className="mt-3 overflow-hidden rounded-md border border-border bg-background">
        <div className="relative aspect-[1200/630] w-full bg-[color:var(--brand-canvas-dark)]">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="relative h-full w-full overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{ background: "var(--brand-gradient)", opacity: 0.55 }}
              />
              <div className="relative z-10 flex h-full w-full flex-col justify-end p-5 text-white">
                <p className="mono-eyebrow text-white/70">{siteName.toUpperCase()} · {kicker}</p>
                <p className="mt-2 font-display text-[20px] font-medium leading-tight">
                  {clamp(title || "Your post title", 80)}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-border bg-muted/40 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {hostname(base)}
          </p>
          <p className="mt-0.5 truncate text-[14px] font-medium text-foreground">
            {clamp(title || "Your post title", 70)}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">
            {clamp(description || "Your meta description appears here.", 160)}
          </p>
          <p className="mt-1 truncate text-[11px] text-muted-foreground/80">{url}</p>
        </div>
      </div>
    </div>
  );
}
