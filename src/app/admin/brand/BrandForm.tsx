"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BrandContent } from "@/lib/brand-content";
import {
  BRAND_FONTS,
  DEFAULT_THEME_COLORS,
  RADIUS_SCALES,
  THEME_COLOR_FIELDS,
  THEME_PRESETS,
  isHexColor,
  type ThemeColorField,
  type ThemePreset,
} from "@/lib/theme";
import { AiGenerateButton } from "@/components/admin/AiGenerateButton";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { ADMIN_INPUT_CLASS as inputClass } from "@/components/admin/form-styles";

function Field({
  label,
  value,
  onChange,
  textarea,
  rows = 3,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  type?: string;
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
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}

const COLOR_META: Record<ThemeColorField, { label: string; hint: string }> = {
  colorPrimary: { label: "Primary", hint: "Main CTA buttons and key UI on light backgrounds." },
  colorAccent: { label: "Accent", hint: "Highlight CTAs on dark bands, badges, the gradient's centre." },
  colorSecondary: { label: "Secondary", hint: "Links, emphasis text and the gradient's outer stops." },
  colorDark: { label: "Dark surface", hint: "Background of the hero, navbar and dark CTA bands." },
};

function ColorField({
  field,
  value,
  onChange,
}: {
  field: ThemeColorField;
  value: string;
  onChange: (v: string) => void;
}) {
  const { label, hint } = COLOR_META[field];
  const fallback = DEFAULT_THEME_COLORS[field];
  const invalid = value !== "" && !isHexColor(value);
  const inputId = `brand-${field}`;
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground/90">
          {label}
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Use default
          </button>
        ) : (
          <span className="text-[12px] text-muted-foreground">Default</span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} color picker`}
          value={isHexColor(value) && value.length === 7 ? value.toLowerCase() : fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded border border-border bg-transparent"
        />
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder={fallback}
          spellCheck={false}
          aria-invalid={invalid}
          className={`w-full rounded-lg border bg-surface/50 px-4 py-2 font-mono text-[13px] text-foreground ${
            invalid ? "border-destructive" : "border-border"
          }`}
        />
      </div>
      <p className={`mt-1 text-[12px] ${invalid ? "text-destructive" : "text-muted-foreground"}`}>
        {invalid ? "Use a hex color, e.g. #2f63b8" : hint}
      </p>
    </div>
  );
}

function presetMatches(preset: ThemePreset, data: BrandContent) {
  return (
    THEME_COLOR_FIELDS.every((f) => (data[f] || DEFAULT_THEME_COLORS[f]).toLowerCase() === preset.colors[f]) &&
    (data.radiusScale || "default") === preset.radiusScale
  );
}

export function BrandForm({
  initialData,
  onChange,
}: {
  initialData: BrandContent;
  /** Fires on every field change so a parent can drive a live preview — save logic stays local. */
  onChange?: (data: BrandContent) => void;
}) {
  const router = useRouter();
  const [data, setData] = useState<BrandContent>(initialData);
  const [businessDescription, setBusinessDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    onChange?.(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const update = <K extends keyof BrandContent>(key: K, value: BrandContent[K]) => {
    setSuccess(false);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: ThemePreset) => {
    setSuccess(false);
    // The default preset clears the fields so the site keeps tracking globals.css.
    const isDefault = preset.key === "torq";
    setData((prev) => ({
      ...prev,
      ...Object.fromEntries(THEME_COLOR_FIELDS.map((f) => [f, isDefault ? "" : preset.colors[f]])),
      radiusScale: isDefault ? "" : preset.radiusScale,
    }));
  };

  const themeInvalid = THEME_COLOR_FIELDS.some((f) => data[f] !== "" && !isHexColor(data[f]));

  const save = async () => {
    if (themeInvalid) {
      setError("Fix the highlighted theme colors before saving.");
      return;
    }
    setError("");
    setSuccess(false);
    setSaving(true);
    const res = await fetch("/api/admin/content/brand", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || "Save failed");
      return;
    }
    setSuccess(true);
    router.refresh();
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="mt-6 max-w-3xl space-y-10">
      <section className="card-flat space-y-4">
        <h2 className="display-sm text-foreground">Logo & favicon</h2>
        <p className="text-sm text-muted-foreground">
          Leave blank to keep the current text wordmark and default favicon.
        </p>
        <ImageUploadField
          label="Logo"
          value={data.logoUrl}
          onChange={(v) => update("logoUrl", v)}
          placeholder="https://…/logo.svg"
          previewClassName="mt-2 h-8 w-auto object-contain"
        />
        <ImageUploadField
          label="Dark-mode logo (optional)"
          value={data.logoDarkUrl}
          onChange={(v) => update("logoDarkUrl", v)}
          placeholder="https://…/logo-dark.svg"
          previewClassName="mt-2 h-8 w-auto rounded bg-foreground/90 object-contain p-1"
        />
        <ImageUploadField
          label="Favicon"
          value={data.faviconUrl}
          onChange={(v) => update("faviconUrl", v)}
          placeholder="https://…/favicon.png"
          previewClassName="mt-2 h-8 w-8 rounded object-contain"
        />
      </section>

      <section className="card-flat space-y-6">
        <div>
          <h2 className="display-sm text-foreground">Theme</h2>
          <p className="text-sm text-muted-foreground">
            Colors and shape for the whole public site. Hover states, button text color and tints are
            derived automatically. Blank fields use the built-in defaults.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground/90">Presets</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {THEME_PRESETS.map((preset) => {
              const active = presetMatches(preset, data);
              return (
                <button
                  key={preset.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => applyPreset(preset)}
                  className={`flex flex-col gap-2 rounded-lg border p-2.5 text-left transition-colors ${
                    active
                      ? "border-[color:var(--app-fg)] bg-surface"
                      : "border-border bg-muted/20 hover:border-foreground/30"
                  }`}
                >
                  <span className="flex h-6 overflow-hidden rounded">
                    {THEME_COLOR_FIELDS.map((f) => (
                      <span key={f} className="flex-1" style={{ backgroundColor: preset.colors[f] }} />
                    ))}
                  </span>
                  <span className="text-[13px] font-medium text-foreground">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {THEME_COLOR_FIELDS.map((f) => (
            <ColorField key={f} field={f} value={data[f]} onChange={(v) => update(f, v)} />
          ))}
        </div>

        <div>
          <p className="text-sm font-medium text-foreground/90">Corner radius</p>
          <div role="radiogroup" aria-label="Corner radius" className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(RADIUS_SCALES).map(([key, scale]) => {
              const active = (data.radiusScale || "default") === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update("radiusScale", key === "default" ? "" : key)}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "border-[color:var(--app-fg)] bg-surface text-foreground"
                      : "border-border bg-muted/20 text-foreground/75 hover:border-foreground/30"
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-5 w-5 shrink-0 border-2 border-current"
                    style={{ borderRadius: `${scale.tokens.md}px` }}
                  />
                  {scale.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="button"
            onClick={() => applyPreset(THEME_PRESETS[0])}
            className="text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Reset theme to defaults
          </button>
        </div>
      </section>

      <section className="card-flat space-y-4">
        <h2 className="display-sm text-foreground">Typography</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground/90">Heading font</label>
            <select
              value={data.fontHeading}
              onChange={(e) => update("fontHeading", e.target.value)}
              className={inputClass}
            >
              <option value="">Default</option>
              {BRAND_FONTS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90">Body font</label>
            <select
              value={data.fontBody}
              onChange={(e) => update("fontBody", e.target.value)}
              className={inputClass}
            >
              <option value="">Default</option>
              {BRAND_FONTS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card-flat space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="display-sm text-foreground">Brand voice & guidelines</h2>
            <p className="text-sm text-muted-foreground">
              Feeds directly into every &quot;Generate with AI&quot; button across the admin.
            </p>
          </div>
        </div>
        <Field
          label="Describe your business in a sentence or two (used only to draft the voice below, not saved)"
          value={businessDescription}
          onChange={setBusinessDescription}
          textarea
          rows={2}
          placeholder="e.g. a software studio building mobile apps, websites, and AI products for startups"
        />
        <div className="flex justify-end">
          <AiGenerateButton<{ voiceDescription: string; voiceGuidelines: string }>
            task="brandVoiceDraft"
            label="Draft voice with AI"
            context={{ businessDescription }}
            onResult={({ voiceDescription, voiceGuidelines }) => {
              update("voiceDescription", voiceDescription);
              update("voiceGuidelines", voiceGuidelines);
            }}
            disabled={!businessDescription.trim()}
          />
        </div>
        <Field
          label="Voice description"
          value={data.voiceDescription}
          onChange={(v) => update("voiceDescription", v)}
          textarea
          rows={3}
          placeholder="e.g. confident, direct, technical but not jargon-heavy"
        />
        <Field
          label="Guidelines (do's / don'ts)"
          value={data.voiceGuidelines}
          onChange={(v) => update("voiceGuidelines", v)}
          textarea
          rows={4}
          placeholder={"Do: lead with outcomes.\nDon't: use hype words like \"revolutionary\"."}
        />
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-success">Saved. Changes apply on the next page load.</p> : null}
      <button type="submit" disabled={saving || themeInvalid} className="btn-base btn-primary">
        {saving ? "Saving…" : "Save brand"}
      </button>
    </form>
  );
}
