import { prisma, readSingletonSetting, writeSingletonSetting, SINGLETON_KEY } from "@/lib/db";

/** Curated fonts — kept small so runtime `<link>` injection never needs an arbitrary Google Fonts URL. */
export const BRAND_FONTS = [
  { key: "inter", label: "Inter (default)", family: "Inter", googleFontsSlug: null },
  { key: "manrope", label: "Manrope", family: "Manrope", googleFontsSlug: "Manrope:wght@400;500;600;700" },
  { key: "sora", label: "Sora", family: "Sora", googleFontsSlug: "Sora:wght@400;500;600;700" },
  { key: "space-grotesk", label: "Space Grotesk", family: "Space Grotesk", googleFontsSlug: "Space+Grotesk:wght@400;500;600;700" },
  { key: "poppins", label: "Poppins", family: "Poppins", googleFontsSlug: "Poppins:wght@400;500;600;700" },
  { key: "jetbrains-mono", label: "JetBrains Mono", family: "JetBrains Mono", googleFontsSlug: "JetBrains+Mono:wght@400;500;600" },
] as const;

export type BrandFontKey = (typeof BRAND_FONTS)[number]["key"];

export function findBrandFont(key: string | null | undefined) {
  return BRAND_FONTS.find((f) => f.key === key) ?? null;
}

export type BrandContent = {
  logoUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  colorPrimary: string;
  colorAccent: string;
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
    fontHeading: data.fontHeading.trim(),
    fontBody: data.fontBody.trim(),
    voiceDescription: data.voiceDescription.trim(),
    voiceGuidelines: data.voiceGuidelines.trim(),
  };
  await writeSingletonSetting((args) => prisma.brandSettings.upsert(args), payload);
}
