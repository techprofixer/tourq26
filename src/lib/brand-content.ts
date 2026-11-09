import { prisma, readSingletonSetting, writeSingletonSetting, SINGLETON_KEY } from "@/lib/db";

export const BRAND_FIELDS = [
  "logoUrl",
  "logoDarkUrl",
  "faviconUrl",
  "colorPrimary",
  "colorAccent",
  "colorSecondary",
  "colorDark",
  "radiusScale",
  "fontHeading",
  "fontBody",
  "voiceDescription",
  "voiceGuidelines",
] as const;

export type BrandContent = {
  logoUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  colorPrimary: string;
  colorAccent: string;
  /** Links, emphasis and the brand gradient's outer stops. */
  colorSecondary: string;
  /** Background of the dark hero / CTA bands. */
  colorDark: string;
  /** Key of `RADIUS_SCALES` in `@/lib/theme`; blank = default. */
  radiusScale: string;
  fontHeading: string;
  fontBody: string;
  voiceDescription: string;
  voiceGuidelines: string;
};

function getDefaultBrandContent(): BrandContent {
  return {
    logoUrl: "",
    logoDarkUrl: "",
    faviconUrl: "",
    colorPrimary: "",
    colorAccent: "",
    colorSecondary: "",
    colorDark: "",
    radiusScale: "",
    fontHeading: "",
    fontBody: "",
    voiceDescription: "",
    voiceGuidelines: "",
  };
}

export async function readBrandContent(): Promise<BrandContent> {
  return readSingletonSetting(
    () => prisma.brandSettings.findUnique({ where: { key: SINGLETON_KEY } }),
    getDefaultBrandContent,
    (row, d) => ({
      logoUrl: row.logoUrl || d.logoUrl,
      logoDarkUrl: row.logoDarkUrl || d.logoDarkUrl,
      faviconUrl: row.faviconUrl || d.faviconUrl,
      colorPrimary: row.colorPrimary || d.colorPrimary,
      colorAccent: row.colorAccent || d.colorAccent,
      colorSecondary: row.colorSecondary || d.colorSecondary,
      colorDark: row.colorDark || d.colorDark,
      radiusScale: row.radiusScale || d.radiusScale,
      fontHeading: row.fontHeading || d.fontHeading,
      fontBody: row.fontBody || d.fontBody,
      voiceDescription: row.voiceDescription || d.voiceDescription,
      voiceGuidelines: row.voiceGuidelines || d.voiceGuidelines,
    }),
  );
}

export async function writeBrandContent(data: BrandContent): Promise<void> {
  const payload = {
    logoUrl: data.logoUrl.trim(),
    logoDarkUrl: data.logoDarkUrl.trim(),
    faviconUrl: data.faviconUrl.trim(),
    colorPrimary: data.colorPrimary.trim(),
    colorAccent: data.colorAccent.trim(),
    colorSecondary: data.colorSecondary.trim(),
    colorDark: data.colorDark.trim(),
    radiusScale: data.radiusScale.trim(),
    fontHeading: data.fontHeading.trim(),
    fontBody: data.fontBody.trim(),
    voiceDescription: data.voiceDescription.trim(),
    voiceGuidelines: data.voiceGuidelines.trim(),
  };
  await writeSingletonSetting((args) => prisma.brandSettings.upsert(args), payload);
}
