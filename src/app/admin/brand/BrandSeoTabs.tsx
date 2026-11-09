"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { BrandContent } from "@/lib/brand-content";
import { findBrandFont } from "@/lib/brand-content";
import type { SiteContent } from "@/lib/content";
import { BrandForm } from "./BrandForm";
import { SiteForm } from "./SiteForm";
import { SerpPreview } from "@/components/admin/SerpPreview";

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

function clamp(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1).trim()}…` : s;
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
  const headingFont = findBrandFont(brand.fontHeading);
  const bodyFont = findBrandFont(brand.fontBody);

  useEffect(() => {
    const slugs = [headingFont?.googleFontsSlug, bodyFont?.googleFontsSlug].filter(Boolean) as string[];
    const added: HTMLLinkElement[] = [];
    for (const slug of slugs) {
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
  }, [headingFont?.googleFontsSlug, bodyFont?.googleFontsSlug]);

  const primarySwatch = /^#[0-9a-fA-F]{6}$/.test(brand.colorPrimary) ? brand.colorPrimary : "var(--app-primary)";
  const accentSwatch = /^#[0-9a-fA-F]{6}$/.test(brand.colorAccent) ? brand.colorAccent : "var(--app-accent)";
  const headingStack = headingFont ? `'${headingFont.family}', sans-serif` : undefined;
  const bodyStack = bodyFont ? `'${bodyFont.family}', sans-serif` : undefined;

  if (tab === "brand") {
    return (
      <div className="card-flat space-y-4 p-5">
        <p className="mono-eyebrow text-muted-foreground">Live preview</p>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
            <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded bg-background">
              {brand.faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.faviconUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: primarySwatch }} />
              )}
            </span>
            <span className="truncate text-[12px] text-muted-foreground">
              {clamp(site.siteName || "Your site", 28)}
            </span>
          </div>
          <div className="space-y-4 bg-background p-5">
            <div className="flex items-center gap-2">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt="" className="h-6 w-auto max-w-[120px] object-contain" />
              ) : (
                <span className="font-display text-[15px] font-semibold text-foreground" style={{ fontFamily: headingStack }}>
                  {site.siteName || "Your site"}
                </span>
              )}
            </div>
            <p
              className="text-[19px] font-medium leading-snug text-foreground"
              style={{ fontFamily: headingStack }}
            >
              Senior engineers, shipped fast.
            </p>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground" style={{ fontFamily: bodyStack }}>
              This is how body copy reads with the fonts and colors picked on the left — headline above, this
              paragraph below.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span
                className="rounded-md px-3 py-1.5 text-[13px] font-medium text-white"
                style={{ backgroundColor: primarySwatch, fontFamily: bodyStack }}
              >
                Primary button
              </span>
              <span
                className="text-[13px] font-medium underline decoration-2 underline-offset-4"
                style={{ color: accentSwatch, fontFamily: bodyStack }}
              >
                Accent link
              </span>
            </div>
          </div>
        </div>
        <p className="text-[12.5px] text-muted-foreground">
          Updates as you type — nothing here is saved until you click{" "}
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
              {clamp(site.ogTitle || site.defaultTitle || "Your OG title", 70)}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">
              {clamp(site.ogDescription || site.defaultDescription || "Your OG description appears here.", 160)}
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
