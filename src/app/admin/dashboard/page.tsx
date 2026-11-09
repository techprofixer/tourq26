import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import {
  readBlogPosts,
  readTestimonials,
  readContactSubmissions,
} from "@/lib/content";
import { getResolvedFeatureFlags } from "@/lib/feature-flags";
import { AdminPageHeader } from "../AdminPageHeader";

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "just now";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d} d ago`;
  return new Date(iso).toLocaleDateString();
}

function isRecent(iso: string, hours: number): boolean {
  const ms = Date.now() - new Date(iso).getTime();
  return !Number.isNaN(ms) && ms >= 0 && ms < hours * 60 * 60 * 1000;
}

export default async function AdminDashboardPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const [posts, testimonials, contactSubmissions, flags] = await Promise.all([
    readBlogPosts(),
    readTestimonials(),
    readContactSubmissions(),
    getResolvedFeatureFlags(),
  ]);

  const maintenanceOn = flags.maintenance_mode === true;

  const draftCount = posts.filter((p) => (p.status ?? "published") === "draft").length;
  const publishedCount = posts.length - draftCount;
  const recentPosts = [...posts]
    .sort((a, b) => {
      const av = new Date(a.dateUpdated ?? a.date).getTime();
      const bv = new Date(b.dateUpdated ?? b.date).getTime();
      return bv - av;
    })
    .slice(0, 5);
  const recentSubmissions = contactSubmissions.slice(0, 4);

  return (
    <div>
      <AdminPageHeader
        title="Welcome back."
        description="At-a-glance status of content, inbox, and site health. Use the cards below to jump straight in."
        actions={
          <Link href="/admin/blog/new" className="btn-base btn-primary">
            New post
          </Link>
        }
      />

      {/* KPI tiles */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          href="/admin/contact"
          label="Inbox"
          value={contactSubmissions.length}
          hint={contactSubmissions.length === 1 ? "submission" : "submissions"}
          accent="periwinkle"
        />
        <Tile
          href="/admin/blog"
          label="Published"
          value={publishedCount}
          hint={publishedCount === 1 ? "post live" : "posts live"}
          accent="mint"
        />
        <Tile
          href="/admin/blog?status=draft"
          label="Drafts"
          value={draftCount}
          hint={draftCount === 1 ? "post in review" : "posts in review"}
          accent="orange"
        />
        <Tile
          href="/admin/testimonials"
          label="Testimonials"
          value={testimonials.length}
          hint={testimonials.length === 1 ? "quote" : "quotes"}
          accent="magenta"
        />
      </section>

      {/* Recent activity */}
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="card-flat lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="mono-eyebrow text-muted-foreground">RECENT POSTS</p>
            <Link href="/admin/blog" className="mono-button text-foreground hover:opacity-70">
              VIEW ALL →
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <p className="mt-4 text-[14px] text-muted-foreground">
              No posts yet. <Link href="/admin/blog/new" className="underline">Create your first one</Link>.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border/60">
              {recentPosts.map((post) => {
                const status = post.status ?? "published";
                return (
                  <li key={post.slug} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/blog/${encodeURIComponent(post.slug)}/edit`}
                        className="block truncate text-[14.5px] font-medium text-foreground hover:underline"
                      >
                        {post.title}
                      </Link>
                      <p className="mono-label mt-0.5 truncate text-muted-foreground">
                        /{post.slug}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusPill status={status} />
                      <span className="mono-label hidden text-muted-foreground sm:inline">
                        {formatRelative(post.dateUpdated ?? post.date)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card-flat">
          <div className="flex items-center justify-between">
            <p className="mono-eyebrow text-muted-foreground">LATEST INBOX</p>
            <Link href="/admin/contact" className="mono-button text-foreground hover:opacity-70">
              OPEN →
            </Link>
          </div>
          {recentSubmissions.length === 0 ? (
            <p className="mt-4 text-[14px] text-muted-foreground">No messages yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {recentSubmissions.map((s) => (
                <li key={s.id} className="border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    {isRecent(s.createdAt, 24) ? (
                      <span
                        aria-hidden
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--brand-orange)" }}
                      />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-foreground">
                      {s.name || s.email}
                    </span>
                    <time className="mono-label shrink-0 text-muted-foreground" dateTime={s.createdAt}>
                      {formatRelative(s.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">
                    {s.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Settings entry + system status */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Link
          href="/admin/home"
          className="card-flat card-hover block"
        >
          <p className="mono-eyebrow text-muted-foreground">SETTINGS</p>
          <h3 className="display-sm mt-2 text-foreground">Homepage</h3>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Hero, services, why-us, CTA, and snapshot copy.
          </p>
        </Link>
        <Link
          href="/admin/navigation"
          className="card-flat card-hover block"
        >
          <p className="mono-eyebrow text-muted-foreground">SETTINGS</p>
          <h3 className="display-sm mt-2 text-foreground">Navigation</h3>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Primary nav bar links.
          </p>
        </Link>
        <Link
          href="/admin/footer"
          className="card-flat card-hover block"
        >
          <p className="mono-eyebrow text-muted-foreground">SETTINGS</p>
          <h3 className="display-sm mt-2 text-foreground">Footer</h3>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Brand blurb, tagline, and link columns.
          </p>
        </Link>
        <Link
          href="/admin/brand"
          className="card-flat card-hover block"
        >
          <p className="mono-eyebrow text-muted-foreground">SETTINGS</p>
          <h3 className="display-sm mt-2 text-foreground">Brand & SEO</h3>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Logo, colors, typography, voice, meta titles, Open Graph, Twitter card, and search console verification.
          </p>
        </Link>
        <Link
          href="/admin/feature-flags"
          className="card-flat card-hover block"
        >
          <p className="mono-eyebrow text-muted-foreground">CONTROL</p>
          <h3 className="display-sm mt-2 text-foreground">Feature flags</h3>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Maintenance, marketing routes, and navigation toggles.
          </p>
        </Link>
      </section>

      <section className="mt-8 card-flat">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mono-eyebrow text-muted-foreground">SYSTEM STATUS</p>
            <p className="mt-2 text-[14px] text-foreground">MongoDB Atlas (Prisma)</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Content persists in the shared MongoDB cluster.
            </p>
          </div>
          <Link href="/admin/feature-flags" className="shrink-0">
            <MaintenancePill on={maintenanceOn} />
          </Link>
        </div>
      </section>
    </div>
  );
}

const TILE_ACCENTS = {
  periwinkle: "var(--brand-periwinkle)",
  mint: "var(--brand-mint)",
  orange: "var(--brand-orange)",
  magenta: "var(--brand-magenta)",
} as const;

function Tile({
  href,
  label,
  value,
  hint,
  accent,
}: {
  href: string;
  label: string;
  value: number;
  hint: string;
  accent: keyof typeof TILE_ACCENTS;
}) {
  return (
    <Link
      href={href}
      className="card-flat card-hover relative block overflow-hidden"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: TILE_ACCENTS[accent] }}
      />
      <p className="mono-eyebrow text-muted-foreground">{label.toUpperCase()}</p>
      <p className="stat-number mt-3 text-[34px] leading-none text-foreground">
        {value}
      </p>
      <p className="mono-label mt-2 text-muted-foreground">{hint.toUpperCase()}</p>
    </Link>
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

export function MaintenancePill({ on }: { on: boolean }) {
  return (
    <span
      className={`mono-label inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
        on
          ? "bg-[color:var(--app-destructive)]/10 text-[color:var(--app-destructive)]"
          : "bg-[color:var(--brand-mint)] text-[color:var(--app-fg)]"
      }`}
    >
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          on ? "bg-[color:var(--app-destructive)]" : "bg-[color:var(--app-success)]"
        }`}
      />
      {on ? "MAINTENANCE ON" : "SITE LIVE"}
    </span>
  );
}
