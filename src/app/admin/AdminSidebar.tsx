"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; badge?: number };
type Group = { id: string; label: string; items: Item[] };

export function AdminSidebar({
  blogCount,
  draftCount,
  contactCount,
  caseStudyCount,
  techNewsCount,
  chatFeedbackCount,
  newLeadCount,
  maintenanceOn,
}: {
  blogCount: number;
  draftCount: number;
  contactCount: number;
  caseStudyCount: number;
  techNewsCount: number;
  chatFeedbackCount: number;
  newLeadCount: number;
  maintenanceOn: boolean;
}) {
  const pathname = usePathname() || "";

  const groups: Group[] = [
    {
      id: "overview",
      label: "OVERVIEW",
      items: [
        { href: "/admin/dashboard", label: "Dashboard" },
        { href: "/admin/activity", label: "Activity" },
      ],
    },
    {
      id: "cms",
      label: "CMS",
      items: [
        { href: "/admin/cms/pages", label: "Pages" },
        { href: "/admin/cms/entities", label: "Entities" },
        { href: "/admin/media", label: "Media" },
      ],
    },
    {
      id: "content",
      label: "CONTENT",
      items: [
        { href: "/admin/blog", label: "Blog", badge: blogCount },
        { href: "/admin/case-studies", label: "Case studies", badge: caseStudyCount },
        { href: "/admin/tech-news", label: "Tech news", badge: techNewsCount },
        { href: "/admin/testimonials", label: "Testimonials" },
        { href: "/admin/pricing", label: "Pricing" },
      ],
    },
    {
      id: "inbox",
      label: "INBOX",
      items: [{ href: "/admin/contact", label: "Contact form", badge: contactCount }],
    },
    {
      id: "leads",
      label: "LEADS",
      items: [{ href: "/admin/leads", label: "Business Systems Audit", badge: newLeadCount }],
    },
    {
      id: "chatbot",
      label: "CHATBOT",
      items: [
        { href: "/admin/knowledge-base", label: "Chat knowledge" },
        { href: "/admin/chat-feedback", label: "Chat feedback", badge: chatFeedbackCount },
        { href: "/admin/chat-logs", label: "Chat logs" },
      ],
    },
    {
      id: "settings",
      label: "SETTINGS",
      items: [
        { href: "/admin/home", label: "Homepage" },
        { href: "/admin/navigation", label: "Navigation" },
        { href: "/admin/footer", label: "Footer" },
        { href: "/admin/brand", label: "Brand & SEO" },
        { href: "/admin/redirects", label: "Redirects" },
        { href: "/admin/feature-flags", label: "Feature flags" },
      ],
    },
  ];

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-muted/30 lg:block">
      <nav className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-6">
        {groups.map((group) => (
          <div key={group.id}>
            <p className="mono-eyebrow px-3 text-muted-foreground/80">
              {group.label}
            </p>
            <ul className="mt-2 space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin/dashboard" && pathname.startsWith(`${item.href}/`));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between rounded-md px-3 py-1.5 text-[13.5px] transition-colors ${
                        active
                          ? "bg-foreground text-background"
                          : "text-foreground/80 hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span
                          className={`mono-label rounded-full px-1.5 py-0.5 tabular-nums ${
                            active ? "bg-background/15 text-background" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="mt-auto rounded-md border border-border/60 bg-background/70 p-3">
          <p className="mono-eyebrow text-muted-foreground">QUICK STATS</p>
          <dl className="mt-2 space-y-1 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Drafts</dt>
              <dd className="tabular-nums font-medium text-foreground">{draftCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Published</dt>
              <dd className="tabular-nums font-medium text-foreground">
                {Math.max(0, blogCount - draftCount)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Inbox</dt>
              <dd className="tabular-nums font-medium text-foreground">{contactCount}</dd>
            </div>
            <div className="flex items-center justify-between pt-1">
              <dt className="text-muted-foreground">Maintenance</dt>
              <dd className="flex items-center gap-1.5 font-medium text-foreground">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: maintenanceOn
                      ? "var(--app-destructive)"
                      : "var(--app-success)",
                  }}
                />
                {maintenanceOn ? "ON" : "OFF"}
              </dd>
            </div>
          </dl>
        </div>
      </nav>
    </aside>
  );
}
