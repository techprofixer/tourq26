"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BrandContent } from "@/lib/brand-content";
import { BRAND_FONTS } from "@/lib/brand-content";
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

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground/90">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 rounded border border-border bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="w-full rounded-lg border border-border bg-surface/50 px-4 py-2 text-foreground"
        />
      </div>
    </div>
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

  const save = async () => {
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
      setError("Save failed");
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

      <section className="card-flat space-y-4">
        <h2 className="display-sm text-foreground">Brand colors</h2>
        <p className="text-sm text-muted-foreground">
          Leave blank to keep the site&apos;s current default palette.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Primary" value={data.colorPrimary} onChange={(v) => update("colorPrimary", v)} />
          <ColorField label="Accent" value={data.colorAccent} onChange={(v) => update("colorAccent", v)} />
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
      <button type="submit" disabled={saving} className="btn-base btn-primary">
        {saving ? "Saving…" : "Save brand"}
      </button>
    </form>
  );
}
