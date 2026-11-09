"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CaseStudy } from "@/lib/case-studies-content";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { TagInput } from "@/components/admin/TagInput";
import { AiGenerateButton } from "@/components/admin/AiGenerateButton";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { stripHtmlToText } from "@/lib/seo-generate";
import { slugify } from "@/lib/blog-server";
import { ADMIN_INPUT_CLASS as inputClass } from "@/components/admin/form-styles";

function Field({
  label,
  value,
  onChange,
  textarea,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground/90">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={inputClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}

const emptyCaseStudy: CaseStudy = {
  slug: "",
  title: "",
  seoTitle: "",
  client: "",
  industry: "",
  industries: [],
  challenge: "",
  outcome: "",
  metric: "",
  metricLabel: "",
  icon: "/images/icons/web.svg",
  coverImage: "",
  coverAlt: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  readTime: "6 min read",
  services: [],
  body: "",
};

export function CaseStudyForm({
  item,
  availableIndustries = [],
}: {
  item?: CaseStudy;
  availableIndustries?: string[];
}) {
  const router = useRouter();
  const isNew = !item;

  const [data, setData] = useState<CaseStudy>(item ?? emptyCaseStudy);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = <K extends keyof CaseStudy>(key: K, value: CaseStudy[K]) => {
    setSuccess(false);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const effectiveSlug = slugTouched ? data.slug : slugify(data.title);

  const save = async () => {
    setError("");
    setSuccess(false);
    setSaving(true);
    const payload = { ...data, slug: effectiveSlug };
    const url = item
      ? `/api/admin/content/case-studies/${encodeURIComponent(item.slug)}`
      : "/api/admin/content/case-studies";
    const method = item ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const resData = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(resData.error || "Save failed");
      return;
    }
    if (isNew && resData?.slug) {
      router.push(`/admin/case-studies/${encodeURIComponent(resData.slug)}/edit`);
      router.refresh();
    } else {
      setSuccess(true);
      router.refresh();
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="mt-6 max-w-3xl space-y-10">
      <div className="sticky top-0 z-20 -mx-5 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/95 px-5 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/admin/case-studies" className="mono-button text-muted-foreground transition-colors hover:text-foreground">
            ← CASE STUDIES
          </Link>
          <span className="hidden text-muted-foreground sm:inline">|</span>
          <p className="hidden truncate text-[14px] font-medium text-foreground sm:block">
            {data.title || (isNew ? "New case study" : item?.title)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && item ? (
            <Link href={`/case-studies/${item.slug}`} target="_blank" className="btn-base btn-outline">
              View
            </Link>
          ) : null}
          <button type="submit" disabled={saving} className="btn-base btn-primary">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <section className="card-flat space-y-4">
        <h2 className="font-display text-base font-semibold text-foreground">Basics</h2>
        <Field label="Title" value={data.title} onChange={(v) => update("title", v)} />
        <div>
          <label className="block text-sm font-medium text-foreground/90">Slug</label>
          <input
            type="text"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              update("slug", slugify(e.target.value));
            }}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Public URL: /case-studies/{effectiveSlug || "…"}
          </p>
        </div>
        <Field label="SEO title (optional, shorter H1/social title)" value={data.seoTitle ?? ""} onChange={(v) => update("seoTitle", v)} />
        <div>
          <Field label="Description (card + meta description)" value={data.description} onChange={(v) => update("description", v)} textarea rows={2} />
          <div className="mt-2">
            <AiGenerateButton<{ metaTitle: string; metaDescription: string }>
              task="seoMetaPair"
              variant="inline"
              context={{ title: data.title, bodyText: stripHtmlToText(data.body) || data.challenge || data.description }}
              onResult={({ metaTitle, metaDescription }) => {
                update("seoTitle", metaTitle);
                update("description", metaDescription);
              }}
              disabled={!data.title.trim()}
            />
          </div>
        </div>
      </section>

      <section className="card-flat space-y-4">
        <h2 className="display-sm text-foreground">Engagement details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client" value={data.client} onChange={(v) => update("client", v)} placeholder="Confidential · FinTech" />
          <Field label="Industry" value={data.industry} onChange={(v) => update("industry", v)} placeholder="Financial services · UAE" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90">
            Industry filter tags (shown as filters on the case studies page)
          </label>
          <div className="mt-1">
            <TagInput value={data.industries} onChange={(v) => update("industries", v)} placeholder="Add an industry…" max={6} />
          </div>
          {availableIndustries.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {availableIndustries
                .filter((name) => !data.industries.includes(name))
                .map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => update("industries", [...data.industries, name])}
                    className="mono-label rounded-full border border-hairline px-2 py-0.5 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    + {name}
                  </button>
                ))}
            </div>
          ) : null}
        </div>
        <Field label="Challenge" value={data.challenge} onChange={(v) => update("challenge", v)} textarea rows={2} />
        <Field label="Outcome" value={data.outcome} onChange={(v) => update("outcome", v)} textarea rows={2} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Metric (e.g. 6 months, 40%)" value={data.metric} onChange={(v) => update("metric", v)} />
          <Field label="Metric label" value={data.metricLabel} onChange={(v) => update("metricLabel", v)} placeholder="Time to store launch" />
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label className="block text-sm font-medium text-foreground/90">Services (press Enter or comma to add)</label>
            <AiGenerateButton<{ keywords: string[] }>
              task="keywordSuggestions"
              variant="inline"
              label="Suggest"
              context={{ title: data.title, bodyText: [data.challenge, data.outcome, data.description].filter(Boolean).join(". ") }}
              onResult={({ keywords }) => update("services", Array.from(new Set([...data.services, ...keywords])))}
              disabled={!data.title.trim()}
            />
          </div>
          <div className="mt-1">
            <TagInput value={data.services} onChange={(v) => update("services", v)} placeholder="Add a service…" max={8} />
          </div>
        </div>
      </section>

      <section className="card-flat space-y-4">
        <h2 className="display-sm text-foreground">Media & dates</h2>
        <ImageUploadField
          label="Cover image"
          value={data.coverImage}
          onChange={(v) => update("coverImage", v)}
          placeholder="https://…"
          previewClassName="mt-2 aspect-[1200/630] w-full max-w-sm rounded-[var(--radius-sm)] border border-border object-cover"
        />
        <Field label="Cover image alt text" value={data.coverAlt} onChange={(v) => update("coverAlt", v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground/90">Date</label>
            <input type="date" value={data.date} onChange={(e) => update("date", e.target.value)} className={inputClass} />
          </div>
          <Field label="Read time" value={data.readTime} onChange={(v) => update("readTime", v)} placeholder="7 min read" />
        </div>
      </section>

      <section className="card-flat space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="display-sm text-foreground">Body</h2>
            <p className="text-sm text-muted-foreground">The full write-up shown on the case study&apos;s detail page.</p>
          </div>
          <AiGenerateButton<string>
            task="longFormBody"
            context={{
              title: data.title,
              contentType: "caseStudy",
              brief: [
                data.client && `Client: ${data.client}`,
                data.industry && `Industry: ${data.industry}`,
                data.challenge && `Challenge: ${data.challenge}`,
                data.outcome && `Outcome: ${data.outcome}`,
              ]
                .filter(Boolean)
                .join(". "),
            }}
            onResult={(html) => update("body", html)}
            disabled={!data.title.trim()}
          />
        </div>
        <RichTextEditor value={data.body} onChange={(html) => update("body", html)} minHeight="20rem" />
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-success">Saved.</p> : null}
      <button type="submit" disabled={saving} className="btn-base btn-primary">
        {saving ? "Saving…" : "Save case study"}
      </button>
    </form>
  );
}
