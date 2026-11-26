"use client";

import { useMemo } from "react";
import type { HomeContent } from "@/lib/home-content";
import { validateJsonLdText } from "@/lib/home-content";
import { SerpPreview } from "@/components/admin/SerpPreview";
import { SocialPreview } from "@/components/admin/SocialPreview";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { ADMIN_INPUT_CLASS as inputClass } from "@/components/admin/form-styles";

export type SiteSeoDefaults = {
  siteUrl: string;
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  ogTitle: string;
  ogDescription: string;
};

type Update = <K extends keyof HomeContent>(key: K, value: HomeContent[K]) => void;

/** Live length meter: green inside the recommended band, amber when short, red when it would be truncated. */
function Meter({ value, min, max }: { value: string; min: number; max: number }) {
  const n = value.length;
  const tone = n === 0 ? "text-muted-foreground" : n > max ? "text-[color:var(--app-destructive)]" : n < min ? "text-amber-600" : "text-success";
  return (
    <span className={`mono-label tabular-nums ${tone}`}>
      {n} / {min}–{max}
    </span>
  );
}

function Check({ ok, children, hint }: { ok: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[13.5px]">
      <span
        aria-hidden
        className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
          ok ? "bg-[var(--app-success)]" : "bg-amber-500"
        }`}
        style={{ height: 18, width: 18 }}
      >
        {ok ? "✓" : "!"}
      </span>
      <span className={ok ? "text-foreground" : "text-foreground"}>
        {children}
        {!ok && hint ? <span className="ml-1 text-muted-foreground">— {hint}</span> : null}
      </span>
    </li>
  );
}

function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface/50 p-3.5">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-[13px] text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

const ORG_TEMPLATE = `{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Torq Studio",
  "url": "https://torqstudio.com",
  "priceRange": "$$",
  "areaServed": "IN",
  "openingHours": "Mo-Fr 10:00-19:00",
  "address": { "@type": "PostalAddress", "addressLocality": "Mumbai", "addressCountry": "IN" }
}`;

/**
 * Homepage SEO & schema: search/social previews, overrides, robots, structured-data toggles and a
 * custom JSON-LD box with live validation. Blank fields fall back to Brand & SEO site defaults.
 */
export function HomeSeoSection({ data, update, site }: { data: HomeContent; update: Update; site: SiteSeoDefaults }) {
  const title = data.seoMetaTitle.trim() || site.defaultTitle;
  const description = data.seoMetaDescription.trim() || site.defaultDescription;
  const ogTitle = data.seoOgTitle.trim() || data.seoMetaTitle.trim() || site.ogTitle;
  const ogDescription = data.seoOgDescription.trim() || data.seoMetaDescription.trim() || site.ogDescription;
  const jsonLdError = useMemo(() => validateJsonLdText(data.seoJsonLdCustom), [data.seoJsonLdCustom]);
  const faqCount = data.faqItems.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mono-eyebrow mb-2 text-muted-foreground">GOOGLE RESULT PREVIEW</p>
          <SerpPreview siteUrl={site.siteUrl} path="/" title={title} description={description} />
        </div>
        <SocialPreview
          siteUrl={site.siteUrl}
          path="/"
          title={ogTitle}
          description={ogDescription}
          coverImage={data.seoOgImageUrl.trim() || undefined}
          siteName={site.siteName}
          kicker="HOME"
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label className="block text-sm font-medium text-foreground/90">Meta title</label>
          <Meter value={data.seoMetaTitle} min={30} max={60} />
        </div>
        <input
          className={inputClass}
          value={data.seoMetaTitle}
          onChange={(e) => update("seoMetaTitle", e.target.value)}
          placeholder={site.defaultTitle}
        />
        <p className="mt-1 text-xs text-muted-foreground">Used as-is (no site-name suffix is added). Blank = the site default from Brand &amp; SEO.</p>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label className="block text-sm font-medium text-foreground/90">Meta description</label>
          <Meter value={data.seoMetaDescription} min={110} max={160} />
        </div>
        <textarea
          className={inputClass}
          rows={3}
          value={data.seoMetaDescription}
          onChange={(e) => update("seoMetaDescription", e.target.value)}
          placeholder={site.defaultDescription}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground/90">Social title (og / twitter)</label>
          <input className={inputClass} value={data.seoOgTitle} onChange={(e) => update("seoOgTitle", e.target.value)} placeholder={ogTitle} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90">Social description</label>
          <input className={inputClass} value={data.seoOgDescription} onChange={(e) => update("seoOgDescription", e.target.value)} placeholder={ogDescription} />
        </div>
      </div>

      <ImageUploadField
        label="Social share image (1200×630 recommended)"
        value={data.seoOgImageUrl}
        onChange={(url) => update("seoOgImageUrl", url)}
        helpText="Shown when the homepage is shared on LinkedIn, X, WhatsApp and Slack. Blank = the generated site card."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground/90">Canonical URL</label>
          <input
            className={inputClass}
            value={data.seoCanonical}
            onChange={(e) => update("seoCanonical", e.target.value)}
            placeholder={site.siteUrl}
          />
          <p className="mt-1 text-xs text-muted-foreground">Leave blank unless this page duplicates another. Must be absolute.</p>
        </div>
        <div className="self-end">
          <Switch
            checked={data.seoRobotsIndex}
            onChange={(v) => update("seoRobotsIndex", v)}
            label="Allow search engines to index the homepage"
            hint={data.seoRobotsIndex ? "Indexable (recommended)." : "noindex is ON — the homepage will disappear from Google."}
          />
        </div>
      </div>

      <div>
        <p className="mono-eyebrow mb-2 text-muted-foreground">STRUCTURED DATA (JSON-LD)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Switch
            checked={data.schemaFaqEnabled}
            onChange={(v) => update("schemaFaqEnabled", v)}
            label="FAQPage schema"
            hint="Mirrors the FAQ section so answer engines can quote it."
          />
          <Switch
            checked={data.schemaServicesEnabled}
            onChange={(v) => update("schemaServicesEnabled", v)}
            label="Services ItemList schema"
            hint="Lists every service card with its URL."
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Always emitted (site-wide): Organization, WebSite and WebPage. Edit the organization details in Brand &amp; SEO.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label className="block text-sm font-medium text-foreground/90">Custom JSON-LD (optional)</label>
          <button type="button" onClick={() => update("seoJsonLdCustom", ORG_TEMPLATE)} className="mono-label text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            INSERT PROFESSIONALSERVICE TEMPLATE
          </button>
        </div>
        <textarea
          className={`${inputClass} font-mono text-[12.5px]`}
          rows={8}
          spellCheck={false}
          value={data.seoJsonLdCustom}
          onChange={(e) => update("seoJsonLdCustom", e.target.value)}
          placeholder='{ "@context": "https://schema.org", "@type": "…" }'
          aria-invalid={Boolean(jsonLdError)}
        />
        {jsonLdError ? (
          <p role="alert" className="mt-1.5 text-[13px] text-[color:var(--app-destructive)]">{jsonLdError}</p>
        ) : data.seoJsonLdCustom.trim() ? (
          <p className="mt-1.5 text-[13px] text-success">Valid JSON-LD — appended after the generated schema.</p>
        ) : (
          <p className="mt-1.5 text-xs text-muted-foreground">An object or an array of objects. Validated before saving.</p>
        )}
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
        <p className="mono-eyebrow text-muted-foreground">HOMEPAGE SEO CHECKLIST</p>
        <ul className="mt-3 space-y-2">
          <Check ok={title.length >= 30 && title.length <= 60} hint={`title is ${title.length} chars; aim for 30–60`}>Title length</Check>
          <Check ok={description.length >= 110 && description.length <= 160} hint={`description is ${description.length} chars; aim for 110–160`}>Meta description length</Check>
          <Check ok={Boolean(data.seoOgImageUrl.trim())} hint="add a share image for richer link previews">Social share image</Check>
          <Check ok={data.seoRobotsIndex}>Indexable by search engines</Check>
          <Check ok={!data.faqEnabled || data.schemaFaqEnabled} hint="FAQ is visible but its schema is off">FAQ schema matches the visible FAQ</Check>
          <Check ok={data.servicesItems.length > 0 && data.schemaServicesEnabled} hint="enable Services ItemList schema">Services listed in schema</Check>
          <Check ok={faqCount === 0 || faqCount >= 3} hint="add at least 3 questions, or clear them to auto-build from service pages">FAQ depth</Check>
        </ul>
      </div>
    </div>
  );
}
