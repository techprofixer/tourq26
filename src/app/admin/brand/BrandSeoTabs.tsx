"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { BrandContent } from "@/lib/brand-content";
import { buildThemeVars, contrastReport, themeFontSlugs, type ContrastLevel } from "@/lib/theme";
import type { SiteContent } from "@/lib/content";
import { BrandForm } from "./BrandForm";
import { SiteForm } from "./SiteForm";
import { SerpPreview } from "@/components/admin/SerpPreview";
import { clampText } from "@/lib/seo-generate";

type Tab = "brand" | "seo";

function PaletteIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M10 2.5a7.5 7.5 0 100 15c.9 0 1.5-.7 1.5-1.5 0-.4-.15-.75-.4-1.02-.24-.26-.4-.6-.4-.98 0-.8.65-1.5 1.5-1.5H14a3.5 3.5 0 003.5-3.5c0-3.6-3.36-6.5-7.5-6.5z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="6.2" cy="9.2" r="1.1" fill="currentColor" />
      <circle cx="9" cy="6" r="1.1" fill="currentColor" />
      <circle cx="12.8" cy="7" r="1.1" fill="currentColor" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="8.8" cy="8.8" r="5.3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M16.5 16.5l-3.6-3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const TABS: { key: Tab; label: string; description: string; icon: () => React.ReactNode }[] = [
  {
    key: "brand",
    label: "Brand identity",
    description: "Logo, favicon, colors, typography, and the voice used by every AI-generate button.",
    icon: PaletteIcon,
  },
  {
    key: "seo",
    label: "Site & SEO",
    description: "Global metadata, Open Graph, X/Twitter cards, keywords, and search engine verification.",
    icon: SearchIcon,
  },
];

function hostname(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
}

function ContrastBadge({ level }: { level: ContrastLevel }) {
  const tone =
    level === "Fail"
      ? "bg-[color:var(--app-destructive)]/10 text-[color:var(--app-destructive)]"
      : level === "AA Large"
        ? "bg-amber-500/15 text-amber-700"
        : "bg-[color:var(--app-success)]/10 text-[color:var(--app-success)]";
  return <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${tone}`}>{level}</span>;
}

/** Live "how it looks" panel — mirrors the active tab's in-progress (unsaved) field values. */
function PreviewPanel({
  tab,
  brand,
  site,
}: {
  tab: Tab;
  brand: BrandContent;
  site: SiteContent;
}) {
  const fontSlugs = themeFontSlugs(brand);
  const fontKey = fontSlugs.join("|");

  useEffect(() => {
    const added: HTMLLinkElement[] = [];
    for (const slug of fontKey ? fontKey.split("|") : []) {
      const id = `admin-font-preview-${slug}`;
      if (document.getElementById(id)) continue;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${slug}&display=swap`;
      document.head.appendChild(link);
      added.push(link);
    }
    return () => added.forEach((l) => l.remove());
  }, [fontKey]);

  // Same engine as the root layout, scoped to the preview box — what you see is what ships.
  const themeStyle = useMemo(() => buildThemeVars(brand) as CSSProperties, [brand]);
  const report = useMemo(() => contrastReport(brand), [brand]);

  if (tab === "brand") {
    const darkLogo = brand.logoDarkUrl || brand.logoUrl;
    return (
      <div className="card-flat space-y-4 p-5">
        <p className="mono-eyebrow text-muted-foreground">Live preview</p>
        <div className="overflow-hidden rounded-lg border border-border" style={themeStyle}>
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
            <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded bg-background">
              {brand.faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.faviconUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="h-2 w-2 rounded-sm bg-[var(--app-primary)]" />
              )}
            </span>
            <span className="truncate text-[12px] text-muted-foreground">
              {clampText(site.siteName || "Your site", 28)}
            </span>
          </div>

          {/* Dark band — navbar + hero */}
          <div className="bg-[var(--brand-canvas-dark)] px-4 pb-5 pt-3 text-white">
            <div className="flex items-center justify-between">
              {darkLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={darkLogo} alt="" className="h-5 w-auto max-w-[100px] object-contain" />
              ) : (
                <span className="font-display text-[14px] font-medium">
                  {site.siteName || "Your site"}
                </span>
              )}
              <span className="btn-base btn-mint !px-2.5 !py-1.5 !text-[10px]">Get started</span>
            </div>
            <div className="mt-3 h-[2px] rounded-full" style={{ backgroundImage: "var(--brand-gradient)" }} />
            <p className="mt-4 font-display text-[19px] font-medium leading-snug">
              Senior engineers, <span className="brand-gradient-text">shipped fast.</span>
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">Hero copy on the dark surface.</p>
          </div>

          {/* Light band — content */}
          <div className="space-y-3 bg-background p-4">
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Body copy with an <span className="font-medium text-[var(--brand-orange)] underline underline-offset-2">inline link</span> in the secondary color.
            </p>
            <div className="rounded-[var(--radius-md)] border border-border p-3">
              <p className="mono-eyebrow text-muted-foreground">Card</p>
              <p className="mt-1 font-display text-[14px] font-medium text-foreground">Corner radius sample</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="btn-base btn-primary !px-3 !py-2 !text-[11px]">Primary</span>
              <span className="rounded-[var(--radius-sm)] bg-[var(--app-accent-muted)] px-2 py-1 text-[11px] font-medium text-foreground">
                Accent tint
              </span>
            </div>
          </div>
        </div>

        <div>
          <p className="mono-eyebrow text-muted-foreground">Accessibility</p>
          <ul className="mt-2 space-y-1.5">
            {report.map((c) => (
              <li key={c.label} className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold"
                    style={{ backgroundColor: c.bg, color: c.fg, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }}
                  >
                    Aa
                  </span>
                  <span className="truncate text-foreground/80">{c.label}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="tabular-nums text-muted-foreground">{c.ratio.toFixed(1)}:1</span>
                  <ContrastBadge level={c.level} />
                </span>
              </li>
            ))}
          </ul>
          {report.some((c) => c.level === "Fail") ? (
            <p className="mt-2 text-[12px] text-destructive">
              Some pairings are hard to read. Pick a darker or lighter shade before saving.
            </p>
          ) : null}
        </div>

        <p className="text-[12.5px] text-muted-foreground">
          Updates as you type. Nothing is saved until you click{" "}
          <span className="font-medium text-foreground/80">Save brand</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SerpPreview siteUrl={site.siteUrl} path="" title={site.defaultTitle} description={site.defaultDescription} />

      <div className="card-flat p-4">
        <p className="mono-eyebrow text-muted-foreground">Social card (Open Graph)</p>
        <div className="mt-3 overflow-hidden rounded-md border border-border bg-background">
          <div className="relative aspect-[1200/630] w-full bg-[color:var(--brand-canvas-dark)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/opengraph-image" alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="border-t border-border bg-muted/40 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{hostname(site.siteUrl)}</p>
            <p className="mt-0.5 truncate text-[14px] font-medium text-foreground">
              {clampText(site.ogTitle || site.defaultTitle || "Your OG title", 70)}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">
              {clampText(site.ogDescription || site.defaultDescription || "Your OG description appears here.", 160)}
            </p>
          </div>
        </div>
      </div>

      <div className="card-flat space-y-2 p-4">
        <p className="mono-eyebrow text-muted-foreground">Indexing status</p>
        {site.robotsNoIndex ? (
          <p className="flex items-center gap-2 text-[13px] text-[color:var(--app-destructive)]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--app-destructive)]" />
            Hidden from search engines (noindex)
          </p>
        ) : (
          <p className="flex items-center gap-2 text-[13px] text-[color:var(--app-success)]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--app-success)]" />
            Indexable — visible to search engines
          </p>
        )}
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              site.googleSiteVerification ? "bg-[color:var(--app-success)]" : "bg-muted-foreground/40"
            }`}
          />
          {site.googleSiteVerification ? "Google Search Console verified" : "Google Search Console not verified"}
        </p>
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              site.bingSiteVerification ? "bg-[color:var(--app-success)]" : "bg-muted-foreground/40"
            }`}
          />
          {site.bingSiteVerification ? "Bing Webmaster verified" : "Bing Webmaster not verified"}
        </p>
      </div>
    </div>
  );
}

export function BrandSeoTabs({
  brandData,
  siteData,
}: {
  brandData: BrandContent;
  siteData: SiteContent;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("tab") === "seo" ? "seo" : "brand";
  const [tab, setTab] = useState<Tab>(initial);
  const [liveBrand, setLiveBrand] = useState(brandData);
  const [liveSite, setLiveSite] = useState(siteData);

  const goTo = (next: Tab) => {
    setTab(next);
    router.replace(`/admin/brand${next === "seo" ? "?tab=seo" : ""}`, { scroll: false });
  };

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Brand and SEO settings" className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => goTo(t.key)}
              className={`group flex items-center gap-2 rounded-lg border px-4 py-2.5 text-left transition-all ${
                active
                  ? "border-[color:var(--app-primary)]/40 bg-surface shadow-sm"
                  : "border-transparent bg-muted/30 hover:bg-muted/50"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                  active ? "bg-[color:var(--app-primary)] text-white" : "text-muted-foreground"
                }`}
              >
                <Icon />
              </span>
              <span
                className={`text-sm font-medium ${active ? "text-foreground" : "text-foreground/70"}`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 max-w-2xl text-[13.5px] text-muted-foreground">
        {TABS.find((t) => t.key === tab)?.description}
      </p>

      <div className="mt-2 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className={tab === "brand" ? "block" : "hidden"}>
            <BrandForm initialData={brandData} onChange={setLiveBrand} />
          </div>
          <div className={tab === "seo" ? "block" : "hidden"}>
            <SiteForm initialData={siteData} onChange={setLiveSite} />
          </div>
        </div>
        <div className="order-first lg:order-none lg:sticky lg:top-6 lg:h-fit">
          <PreviewPanel tab={tab} brand={liveBrand} site={liveSite} />
        </div>
      </div>
    </div>
  );
}
