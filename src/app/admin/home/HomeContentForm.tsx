"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  HomeContent,
  ServiceItem,
  WhyUsItem,
  SlideItem,
  OfferItem,
} from "@/lib/home-content";
import { AiGenerateButton } from "@/components/admin/AiGenerateButton";
import { ADMIN_INPUT_CLASS as inputClass } from "@/components/admin/form-styles";

// ---------------------------------------------------------------------------
// Icons (inline SVG — no icon library in this project)
// ---------------------------------------------------------------------------

type IconProps = React.SVGProps<SVGSVGElement>;

function RocketIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2.5c3 1.5 5 4.5 5 8.5 0 2-.5 3.5-1.5 5L12 19l-3.5-3c-1-1.5-1.5-3-1.5-5 0-4 2-7 5-8.5Z" />
      <circle cx="12" cy="10.5" r="1.75" />
      <path d="M8.5 15 6 21l3.5-2M15.5 15 18 21l-3.5-2" />
    </svg>
  );
}

function ImageIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 16-5.5-5.5L4 21" />
    </svg>
  );
}

function CarouselIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="6" y="5" width="12" height="14" rx="1.5" />
      <path d="M2 8v8M22 8v8" />
    </svg>
  );
}

function MegaphoneIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11v2a2 2 0 0 0 2 2h1l2.5 5 1.8-.9L8.8 15H10l8 4V5l-8 4H5a2 2 0 0 0-2 2Z" />
      <path d="M18 9.5a4 4 0 0 1 0 5" />
    </svg>
  );
}

function TagIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11.5 3H5a2 2 0 0 0-2 2v6.5a2 2 0 0 0 .59 1.41l8.5 8.5a2 2 0 0 0 2.82 0l6.5-6.5a2 2 0 0 0 0-2.82l-8.5-8.5A2 2 0 0 0 11.5 3Z" />
      <circle cx="8" cy="8" r="1.5" />
    </svg>
  );
}

function BriefcaseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2.5" y="7.5" width="19" height="12" rx="2" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5M2.5 13h19" />
    </svg>
  );
}

function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3-4.8-4.3 6.4-.6Z" />
    </svg>
  );
}

function FolderIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2.5H19.5A1.5 1.5 0 0 1 21 9v8.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" />
    </svg>
  );
}

function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}

function DocIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3.5h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4M8 12h8M8 15.5h8M8 8.5h3" />
    </svg>
  );
}

const ACCENT: Record<string, { badge: string; icon: string }> = {
  rose: { badge: "bg-rose-500/10", icon: "text-rose-600" },
  indigo: { badge: "bg-indigo-500/10", icon: "text-indigo-600" },
  blue: { badge: "bg-blue-500/10", icon: "text-blue-600" },
  amber: { badge: "bg-amber-500/10", icon: "text-amber-600" },
  emerald: { badge: "bg-emerald-500/10", icon: "text-emerald-600" },
  sky: { badge: "bg-sky-500/10", icon: "text-sky-600" },
  purple: { badge: "bg-purple-500/10", icon: "text-purple-600" },
  teal: { badge: "bg-teal-500/10", icon: "text-teal-600" },
  slate: { badge: "bg-slate-500/10", icon: "text-slate-600" },
};

function IconBadge({ icon: Icon, accent }: { icon: (p: IconProps) => React.ReactElement; accent: keyof typeof ACCENT }) {
  const c = ACCENT[accent];
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${c.badge} ${c.icon}`}>
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </span>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex shrink-0 cursor-pointer items-center gap-2.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{checked ? "On" : "Off"}</span>
      <input
        type="checkbox"
        className="h-5 w-10 cursor-pointer accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function SectionHeader({
  icon,
  accent,
  title,
  description,
  toggle,
  action,
}: {
  icon: (p: IconProps) => React.ReactElement;
  accent: keyof typeof ACCENT;
  title: string;
  description?: string;
  toggle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <IconBadge icon={icon} accent={accent} />
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {action}
        {toggle}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared field / list helpers
// ---------------------------------------------------------------------------

function Field({
  label,
  value,
  onChange,
  textarea,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground/90">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={inputClass} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
    </div>
  );
}

function ReorderButtons({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        className="mono-label rounded border border-border px-2 py-1 text-muted-foreground disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
        className="mono-label rounded border border-border px-2 py-1 text-muted-foreground disabled:opacity-30"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="mono-label rounded border border-border px-2 py-1 text-[color:var(--app-destructive)]"
      >
        REMOVE
      </button>
    </div>
  );
}

function reorder<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  if (!src.trim()) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="mt-2 h-24 w-full rounded-md border border-border object-cover"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

const SECTIONS = [
  { id: "section-hero", label: "Hero" },
  { id: "section-slider", label: "Slider" },
  { id: "section-offer-banner", label: "Offer banner" },
  { id: "section-offers", label: "Offers" },
  { id: "section-services", label: "Services" },
  { id: "section-whyus", label: "Why us" },
  { id: "section-case-studies", label: "Case studies" },
  { id: "section-cta", label: "CTA" },
  { id: "section-snapshot", label: "Snapshot" },
];

// ---------------------------------------------------------------------------

export function HomeContentForm({ initialData }: { initialData: HomeContent }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = <K extends keyof HomeContent>(key: K, value: HomeContent[K]) => {
    setSuccess(false);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setError("");
    setSuccess(false);
    setSaving(true);
    const res = await fetch("/api/admin/content/home", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Save failed");
      return;
    }
    setSuccess(true);
    router.refresh();
  };

  const updateServiceItem = (index: number, patch: Partial<ServiceItem>) => {
    update(
      "servicesItems",
      data.servicesItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const updateWhyUsItem = (index: number, patch: Partial<WhyUsItem>) => {
    update(
      "whyUsItems",
      data.whyUsItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const updateSlideItem = (index: number, patch: Partial<SlideItem>) => {
    update(
      "sliderItems",
      data.sliderItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const updateOfferItem = (index: number, patch: Partial<OfferItem>) => {
    update(
      "offersItems",
      data.offersItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="mt-8 max-w-3xl space-y-10">
      <nav
        aria-label="Jump to section"
        className="sticky top-0 z-10 -mx-5 flex flex-wrap items-center gap-1 border-b border-border/60 bg-background/95 px-5 py-2.5 backdrop-blur lg:-mx-8 lg:px-8"
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="mono-label rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <section id="section-hero" className="card-flat scroll-mt-16 space-y-4">
        <SectionHeader
          icon={RocketIcon}
          accent="rose"
          title="Hero"
          description="The top banner — first thing every visitor sees."
          action={
            <AiGenerateButton<{ eyebrow: string; heading: string; subheading: string }>
              task="heroCopy"
              context={{ topic: "a software studio's homepage", purpose: "convert a first-time visitor into a lead" }}
              onResult={({ eyebrow, heading, subheading }) => {
                update("heroEyebrow", eyebrow);
                update("heroHeading", heading);
                update("heroSubheading", subheading);
              }}
            />
          }
        />
        <Field label="Eyebrow" value={data.heroEyebrow} onChange={(v) => update("heroEyebrow", v)} />
        <Field label="Headline" value={data.heroHeading} onChange={(v) => update("heroHeading", v)} textarea rows={2} />
        <Field label="Subheading" value={data.heroSubheading} onChange={(v) => update("heroSubheading", v)} textarea />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary CTA label" value={data.heroPrimaryCtaLabel} onChange={(v) => update("heroPrimaryCtaLabel", v)} />
          <Field label="Primary CTA link" value={data.heroPrimaryCtaHref} onChange={(v) => update("heroPrimaryCtaHref", v)} />
          <Field label="Secondary CTA label" value={data.heroSecondaryCtaLabel} onChange={(v) => update("heroSecondaryCtaLabel", v)} />
          <Field label="Secondary CTA link" value={data.heroSecondaryCtaHref} onChange={(v) => update("heroSecondaryCtaHref", v)} />
          <Field label="Tertiary CTA label" value={data.heroTertiaryCtaLabel} onChange={(v) => update("heroTertiaryCtaLabel", v)} />
          <Field label="Tertiary CTA link" value={data.heroTertiaryCtaHref} onChange={(v) => update("heroTertiaryCtaHref", v)} />
        </div>
        <Field
          label="Tag ticker (one per line — e.g. Mobile apps, Web platforms…)"
          value={data.heroTags.join("\n")}
          onChange={(v) => update("heroTags", v.split("\n").map((t) => t.trim()).filter(Boolean))}
          textarea
          rows={5}
        />

        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <IconBadge icon={ImageIcon} accent="indigo" />
              <div>
                <p className="text-sm font-medium text-foreground">Hero image</p>
                <p className="text-[13px] text-muted-foreground">
                  Replaces the decorative gradient panel with a real image on the right of the hero.
                </p>
              </div>
            </div>
            <Toggle checked={data.heroImageEnabled} onChange={(v) => update("heroImageEnabled", v)} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Image URL" value={data.heroImageUrl} onChange={(v) => update("heroImageUrl", v)} />
            <Field label="Alt text" value={data.heroImageAlt} onChange={(v) => update("heroImageAlt", v)} />
          </div>
          <ImagePreview src={data.heroImageUrl} alt={data.heroImageAlt} />
        </div>
      </section>

      <section id="section-slider" className="card-flat scroll-mt-16 space-y-4">
        <SectionHeader
          icon={CarouselIcon}
          accent="blue"
          title="Image slider"
          description="Optional carousel shown right after the hero."
          toggle={<Toggle checked={data.sliderEnabled} onChange={(v) => update("sliderEnabled", v)} />}
        />
        <Field label="Section label" value={data.sliderHeading} onChange={(v) => update("sliderHeading", v)} />
        <div className="space-y-4">
          {data.sliderItems.map((item, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="mono-label text-muted-foreground">SLIDE {i + 1}</p>
                <ReorderButtons
                  index={i}
                  count={data.sliderItems.length}
                  onMove={(from, to) => update("sliderItems", reorder(data.sliderItems, from, to))}
                  onRemove={(idx) => update("sliderItems", data.sliderItems.filter((_, j) => j !== idx))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Image URL" value={item.imageUrl} onChange={(v) => updateSlideItem(i, { imageUrl: v })} />
                <Field label="Alt text" value={item.alt} onChange={(v) => updateSlideItem(i, { alt: v })} />
              </div>
              <ImagePreview src={item.imageUrl} alt={item.alt} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Overlay heading" value={item.heading} onChange={(v) => updateSlideItem(i, { heading: v })} />
                <Field label="CTA label" value={item.ctaLabel} onChange={(v) => updateSlideItem(i, { ctaLabel: v })} />
                <Field label="Overlay caption" value={item.caption} onChange={(v) => updateSlideItem(i, { caption: v })} />
                <Field label="CTA link" value={item.ctaHref} onChange={(v) => updateSlideItem(i, { ctaHref: v })} />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              update("sliderItems", [
                ...data.sliderItems,
                { imageUrl: "", alt: "", heading: "", caption: "", ctaLabel: "", ctaHref: "" },
              ])
            }
            className="btn-base btn-outline text-sm"
          >
            + Add slide
          </button>
        </div>
      </section>

      <section id="section-offer-banner" className="card-flat scroll-mt-16 space-y-4">
        <SectionHeader
          icon={MegaphoneIcon}
          accent="amber"
          title="Offer banner"
          description="Slim promo strip above the hero, site-wide on the homepage."
          toggle={<Toggle checked={data.offerBannerEnabled} onChange={(v) => update("offerBannerEnabled", v)} />}
        />
        <Field label="Banner text" value={data.offerBannerText} onChange={(v) => update("offerBannerText", v)} textarea rows={2} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA label" value={data.offerBannerCtaLabel} onChange={(v) => update("offerBannerCtaLabel", v)} />
          <Field label="CTA link" value={data.offerBannerCtaHref} onChange={(v) => update("offerBannerCtaHref", v)} />
        </div>
        {data.offerBannerText.trim() ? (
          <div
            className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-md px-4 py-2.5 text-center text-[13px] font-medium text-white"
            style={{ background: "var(--brand-gradient)" }}
          >
            <span>{data.offerBannerText}</span>
            {data.offerBannerCtaLabel ? (
              <span className="underline underline-offset-2">{data.offerBannerCtaLabel}</span>
            ) : null}
          </div>
        ) : null}
      </section>

      <section id="section-offers" className="card-flat scroll-mt-16 space-y-4">
        <SectionHeader
          icon={TagIcon}
          accent="emerald"
          title="Offers"
          description="Promo-card grid — good for time-boxed or seasonal deals."
          toggle={<Toggle checked={data.offersEnabled} onChange={(v) => update("offersEnabled", v)} />}
        />
        <Field label="Heading" value={data.offersHeading} onChange={(v) => update("offersHeading", v)} />
        <Field label="Intro" value={data.offersIntro} onChange={(v) => update("offersIntro", v)} textarea rows={2} />
        <div className="space-y-4">
          {data.offersItems.map((item, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="mono-label text-muted-foreground">OFFER {i + 1}</p>
                <div className="flex items-center gap-2">
                  <AiGenerateButton<{ title: string; description: string }>
                    task="itemCopy"
                    variant="inline"
                    context={{ theme: item.badge || data.offersHeading || "a limited-time studio offer", kind: "offer" }}
                    onResult={({ title, description }) => updateOfferItem(i, { title, description })}
                  />
                  <ReorderButtons
                    index={i}
                    count={data.offersItems.length}
                    onMove={(from, to) => update("offersItems", reorder(data.offersItems, from, to))}
                    onRemove={(idx) => update("offersItems", data.offersItems.filter((_, j) => j !== idx))}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Badge (e.g. LIMITED TIME)" value={item.badge} onChange={(v) => updateOfferItem(i, { badge: v })} />
                <Field label="Title" value={item.title} onChange={(v) => updateOfferItem(i, { title: v })} />
                <Field label="CTA label" value={item.ctaLabel} onChange={(v) => updateOfferItem(i, { ctaLabel: v })} />
                <Field label="CTA link" value={item.ctaHref} onChange={(v) => updateOfferItem(i, { ctaHref: v })} />
              </div>
              <Field label="Description" value={item.description} onChange={(v) => updateOfferItem(i, { description: v })} textarea rows={2} />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              update("offersItems", [
                ...data.offersItems,
                { title: "New offer", description: "", badge: "LIMITED TIME", ctaLabel: "Claim offer", ctaHref: "/contact" },
              ])
            }
            className="btn-base btn-outline text-sm"
          >
            + Add offer
          </button>
        </div>
      </section>

      <section id="section-services" className="card-flat scroll-mt-16 space-y-4">
        <SectionHeader icon={BriefcaseIcon} accent="sky" title="Services" />
        <Field label="Eyebrow" value={data.servicesEyebrow} onChange={(v) => update("servicesEyebrow", v)} />
        <Field label="Heading" value={data.servicesHeading} onChange={(v) => update("servicesHeading", v)} />
        <Field label="Intro" value={data.servicesIntro} onChange={(v) => update("servicesIntro", v)} textarea rows={2} />
        <div className="space-y-4">
          {data.servicesItems.map((item, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="mono-label text-muted-foreground">SERVICE {i + 1}</p>
                <div className="flex items-center gap-2">
                  <AiGenerateButton<{ title: string; description: string }>
                    task="itemCopy"
                    variant="inline"
                    context={{ theme: item.category || data.servicesHeading || "software studio services", kind: "service" }}
                    onResult={({ title, description }) => updateServiceItem(i, { title, description })}
                  />
                  <ReorderButtons
                    index={i}
                    count={data.servicesItems.length}
                    onMove={(from, to) => update("servicesItems", reorder(data.servicesItems, from, to))}
                    onRemove={(idx) => update("servicesItems", data.servicesItems.filter((_, j) => j !== idx))}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Category label" value={item.category} onChange={(v) => updateServiceItem(i, { category: v })} />
                <Field label="Slug (/services/…)" value={item.slug} onChange={(v) => updateServiceItem(i, { slug: v })} />
                <Field label="Title" value={item.title} onChange={(v) => updateServiceItem(i, { title: v })} />
                <Field label="Result tag" value={item.result} onChange={(v) => updateServiceItem(i, { result: v })} />
              </div>
              <Field label="Description" value={item.description} onChange={(v) => updateServiceItem(i, { description: v })} textarea rows={2} />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              update("servicesItems", [
                ...data.servicesItems,
                { slug: "", title: "New service", description: "", result: "", category: "NEW", icon: "/images/icons/web.svg" },
              ])
            }
            className="btn-base btn-outline text-sm"
          >
            + Add service
          </button>
        </div>
      </section>

      <section id="section-whyus" className="card-flat scroll-mt-16 space-y-4">
        <SectionHeader icon={StarIcon} accent="purple" title="Why Choose Us" />
        <Field label="Eyebrow" value={data.whyUsEyebrow} onChange={(v) => update("whyUsEyebrow", v)} />
        <Field label="Heading" value={data.whyUsHeading} onChange={(v) => update("whyUsHeading", v)} />
        <Field label="Intro" value={data.whyUsIntro} onChange={(v) => update("whyUsIntro", v)} textarea rows={2} />
        <div className="space-y-4">
          {data.whyUsItems.map((item, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="mono-label text-muted-foreground">REASON {i + 1}</p>
                <div className="flex items-center gap-2">
                  <AiGenerateButton<{ title: string; description: string }>
                    task="itemCopy"
                    variant="inline"
                    context={{ theme: item.eyebrow || data.whyUsHeading || "why choose this studio", kind: "whyUs" }}
                    onResult={({ title, description }) => updateWhyUsItem(i, { title, description })}
                  />
                  <ReorderButtons
                    index={i}
                    count={data.whyUsItems.length}
                    onMove={(from, to) => update("whyUsItems", reorder(data.whyUsItems, from, to))}
                    onRemove={(idx) => update("whyUsItems", data.whyUsItems.filter((_, j) => j !== idx))}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Eyebrow" value={item.eyebrow} onChange={(v) => updateWhyUsItem(i, { eyebrow: v })} />
                <Field label="Stat (e.g. 40%)" value={item.stat} onChange={(v) => updateWhyUsItem(i, { stat: v })} />
                <Field label="Title" value={item.title} onChange={(v) => updateWhyUsItem(i, { title: v })} />
              </div>
              <Field label="Description" value={item.description} onChange={(v) => updateWhyUsItem(i, { description: v })} textarea rows={2} />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              update("whyUsItems", [
                ...data.whyUsItems,
                { eyebrow: "NEW", stat: "", title: "New reason", description: "" },
              ])
            }
            className="btn-base btn-outline text-sm"
          >
            + Add reason
          </button>
        </div>
      </section>

      <section id="section-case-studies" className="card-flat scroll-mt-16 space-y-4">
        <SectionHeader
          icon={FolderIcon}
          accent="teal"
          title="Case studies (teaser copy)"
          description="Only this section's intro copy is editable here — the case-study cards themselves are managed separately."
        />
        <Field label="Eyebrow" value={data.caseStudiesEyebrow} onChange={(v) => update("caseStudiesEyebrow", v)} />
        <Field label="Heading" value={data.caseStudiesHeading} onChange={(v) => update("caseStudiesHeading", v)} />
        <Field label="Intro" value={data.caseStudiesIntro} onChange={(v) => update("caseStudiesIntro", v)} textarea rows={2} />
      </section>

      <section id="section-cta" className="card-flat scroll-mt-16 space-y-4">
        <SectionHeader
          icon={MailIcon}
          accent="rose"
          title="Closing CTA"
          action={
            <AiGenerateButton<{ heading: string; body: string; primaryCtaLabel: string }>
              task="ctaCopy"
              context={{ purpose: "close a homepage visit with a booked call or contact form submission", audience: "a prospective client evaluating the studio" }}
              onResult={({ heading, body, primaryCtaLabel }) => {
                update("ctaHeading", heading);
                update("ctaBody", body);
                update("ctaPrimaryLabel", primaryCtaLabel);
              }}
            />
          }
        />
        <Field label="Eyebrow" value={data.ctaEyebrow} onChange={(v) => update("ctaEyebrow", v)} />
        <Field label="Heading" value={data.ctaHeading} onChange={(v) => update("ctaHeading", v)} />
        <Field label="Body" value={data.ctaBody} onChange={(v) => update("ctaBody", v)} textarea />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary CTA label" value={data.ctaPrimaryLabel} onChange={(v) => update("ctaPrimaryLabel", v)} />
          <Field label="Primary CTA link" value={data.ctaPrimaryHref} onChange={(v) => update("ctaPrimaryHref", v)} />
          <Field label="Secondary CTA label" value={data.ctaSecondaryLabel} onChange={(v) => update("ctaSecondaryLabel", v)} />
          <Field label="Secondary CTA link" value={data.ctaSecondaryHref} onChange={(v) => update("ctaSecondaryHref", v)} />
          <Field label="Contact email" value={data.ctaEmail} onChange={(v) => update("ctaEmail", v)} />
          <Field label="Footnote" value={data.ctaFootnote} onChange={(v) => update("ctaFootnote", v)} />
        </div>
      </section>

      <section id="section-snapshot" className="card-flat scroll-mt-16 space-y-4">
        <SectionHeader
          icon={DocIcon}
          accent="slate"
          title="Snapshot section"
          description="The editorial block near the bottom of the homepage."
        />
        <Field label="Heading" value={data.snapshotHeading} onChange={(v) => update("snapshotHeading", v)} />
        <div className="space-y-3">
          {data.snapshotParagraphs.map((p, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="mono-label text-muted-foreground">PARAGRAPH {i + 1}</p>
                <div className="flex items-center gap-2">
                  <AiGenerateButton<string>
                    task="shortCopy"
                    variant="inline"
                    context={{ purpose: data.snapshotHeading || "editorial paragraph about the studio", siteContext: p }}
                    onResult={(text) =>
                      update(
                        "snapshotParagraphs",
                        data.snapshotParagraphs.map((x, j) => (j === i ? text : x)),
                      )
                    }
                  />
                  <ReorderButtons
                    index={i}
                    count={data.snapshotParagraphs.length}
                    onMove={(from, to) => update("snapshotParagraphs", reorder(data.snapshotParagraphs, from, to))}
                    onRemove={(idx) => update("snapshotParagraphs", data.snapshotParagraphs.filter((_, j) => j !== idx))}
                  />
                </div>
              </div>
              <textarea
                value={p}
                onChange={(e) =>
                  update(
                    "snapshotParagraphs",
                    data.snapshotParagraphs.map((x, j) => (j === i ? e.target.value : x)),
                  )
                }
                rows={3}
                className={inputClass}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => update("snapshotParagraphs", [...data.snapshotParagraphs, ""])}
            className="btn-base btn-outline text-sm"
          >
            + Add paragraph
          </button>
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-success">Saved. The homepage will update on the next page load.</p> : null}
      <button type="submit" disabled={saving} className="btn-base btn-primary">
        {saving ? "Saving…" : "Save homepage"}
      </button>
    </form>
  );
}
