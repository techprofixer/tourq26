/**
 * Theme engine — turns the admin-editable brand settings into CSS custom-property overrides.
 *
 * Single source of truth for theming: the root layout injects `themeVarsToCss(buildThemeVars(...))`
 * and the admin Brand preview applies the very same vars to its preview container, so what the
 * admin sees is exactly what ships. Pure + client-safe (no Prisma) so it can run on both sides.
 *
 * Only fields that are set produce overrides — blank fields fall through to the defaults in
 * `globals.css`, which remain the canonical palette.
 */

/* -------------------------------------------------------------------------- */
/* Fonts                                                                      */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Radius                                                                     */
/* -------------------------------------------------------------------------- */

type RadiusTokens = { xs: number; sm: number; md: number; lg: number; xl: number };

export const RADIUS_SCALES = {
  sharp: { label: "Sharp", tokens: { xs: 0, sm: 0, md: 2, lg: 2, xl: 4 } },
  default: { label: "Default", tokens: { xs: 3.25, sm: 4, md: 8, lg: 12, xl: 16 } },
  soft: { label: "Soft", tokens: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 } },
  round: { label: "Round", tokens: { xs: 6, sm: 12, md: 16, lg: 20, xl: 28 } },
} as const satisfies Record<string, { label: string; tokens: RadiusTokens }>;

export type RadiusScaleKey = keyof typeof RADIUS_SCALES;

export function isRadiusScale(value: string): value is RadiusScaleKey {
  return Object.prototype.hasOwnProperty.call(RADIUS_SCALES, value);
}

/* -------------------------------------------------------------------------- */
/* Theme input, defaults & presets                                            */
/* -------------------------------------------------------------------------- */

export type ThemeInput = {
  colorPrimary: string;
  colorAccent: string;
  colorSecondary: string;
  colorDark: string;
  radiusScale: string;
  fontHeading: string;
  fontBody: string;
};

export const THEME_COLOR_FIELDS = ["colorPrimary", "colorAccent", "colorSecondary", "colorDark"] as const;
export type ThemeColorField = (typeof THEME_COLOR_FIELDS)[number];

/** Mirrors the palette hard-coded in `globals.css` — what a blank field effectively means. */
export const DEFAULT_THEME_COLORS: Record<ThemeColorField, string> = {
  colorPrimary: "#050505",
  colorAccent: "#ffd100",
  colorSecondary: "#2f63b8",
  colorDark: "#050505",
};

export type ThemePreset = {
  key: string;
  label: string;
  colors: Record<ThemeColorField, string>;
  radiusScale: RadiusScaleKey;
};

export const THEME_PRESETS: ThemePreset[] = [
  { key: "torq", label: "Torq (default)", colors: { ...DEFAULT_THEME_COLORS }, radiusScale: "default" },
  {
    key: "ocean",
    label: "Ocean",
    colors: { colorPrimary: "#0b3b66", colorAccent: "#38bdf8", colorSecondary: "#0ea5e9", colorDark: "#06192b" },
    radiusScale: "soft",
  },
  {
    key: "forest",
    label: "Forest",
    colors: { colorPrimary: "#14532d", colorAccent: "#a3e635", colorSecondary: "#16a34a", colorDark: "#0a1f12" },
    radiusScale: "default",
  },
  {
    key: "sunset",
    label: "Sunset",
    colors: { colorPrimary: "#1c1917", colorAccent: "#fb923c", colorSecondary: "#e11d48", colorDark: "#1c1917" },
    radiusScale: "round",
  },
  {
    key: "violet",
    label: "Violet",
    colors: { colorPrimary: "#4c1d95", colorAccent: "#f0abfc", colorSecondary: "#7c3aed", colorDark: "#13072b" },
    radiusScale: "soft",
  },
  {
    key: "mono",
    label: "Monochrome",
    colors: { colorPrimary: "#111111", colorAccent: "#ffffff", colorSecondary: "#525252", colorDark: "#0a0a0a" },
    radiusScale: "sharp",
  },
];

/* -------------------------------------------------------------------------- */
/* Color math                                                                 */
/* -------------------------------------------------------------------------- */

type Rgb = [number, number, number];

/** Theme colors are stored as `#rgb` / `#rrggbb` only — derivations (hover, contrast) need exact channels. */
export function isHexColor(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

export function parseHex(value: string): Rgb | null {
  if (!isHexColor(value)) return null;
  let h = value.slice(1);
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;
}

/** Linear mix: `t` = 0 → a, 1 → b. */
function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgba([r, g, b]: Rgb, alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** WCAG 2.x relative luminance. */
function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: string, b: string): number {
  const ra = parseHex(a);
  const rb = parseHex(b);
  if (!ra || !rb) return 1;
  const [hi, lo] = [luminance(ra), luminance(rb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const INK = "#050505";
const WHITE = "#ffffff";

/** Black or white — whichever reads better on `bg`. */
export function readableOn(bg: string): string {
  return contrastRatio(bg, WHITE) >= contrastRatio(bg, INK) ? WHITE : INK;
}

/** Light colors darken on hover, dark colors lighten — keeps hover visible for any brand color. */
function hoverOf(rgb: Rgb): string {
  return luminance(rgb) > 0.4 ? toHex(mix(rgb, [0, 0, 0], 0.1)) : toHex(mix(rgb, [255, 255, 255], 0.12));
}

/* -------------------------------------------------------------------------- */
/* Vars                                                                       */
/* -------------------------------------------------------------------------- */

export type ThemeVars = Record<`--${string}`, string>;

export function buildThemeVars(theme: Partial<ThemeInput>): ThemeVars {
  const vars: ThemeVars = {};

  const primary = parseHex(theme.colorPrimary ?? "");
  if (primary) {
    const hex = toHex(primary);
    vars["--app-primary"] = hex;
    vars["--app-primary-hover"] = hoverOf(primary);
    vars["--app-primary-fg"] = readableOn(hex);
    vars["--app-primary-muted"] = rgba(primary, 0.06);
    vars["--app-ring"] = rgba(primary, 0.45);
  }

  const accent = parseHex(theme.colorAccent ?? "");
  if (accent) {
    const hex = toHex(accent);
    vars["--brand-mint"] = hex;
    vars["--brand-magenta"] = hex;
    vars["--app-accent"] = hex;
    vars["--app-accent-hover"] = hoverOf(accent);
    vars["--app-accent-fg"] = readableOn(hex);
    vars["--app-accent-muted"] = rgba(accent, 0.18);
  }

  const secondary = parseHex(theme.colorSecondary ?? "");
  if (secondary) {
    const hex = toHex(secondary);
    vars["--brand-orange"] = hex;
    vars["--brand-periwinkle"] = hex;
  }

  // Declared explicitly (not only via globals.css) because a custom property's var() references
  // resolve where it is declared — the scoped admin preview would otherwise inherit the old gradient.
  if (accent || secondary) {
    const s = secondary ? toHex(secondary) : DEFAULT_THEME_COLORS.colorSecondary;
    const a = accent ? toHex(accent) : DEFAULT_THEME_COLORS.colorAccent;
    vars["--brand-gradient"] = `linear-gradient(100deg, ${s} 0%, ${a} 48%, ${s} 100%)`;
  }

  const dark = parseHex(theme.colorDark ?? "");
  if (dark) {
    vars["--brand-canvas-dark"] = toHex(dark);
    vars["--brand-surface-dark-soft"] = toHex(mix(dark, [255, 255, 255], 0.1));
    vars["--brand-hairline-on-dark"] = toHex(mix(dark, [255, 255, 255], 0.06));
  }

  if (theme.radiusScale && isRadiusScale(theme.radiusScale) && theme.radiusScale !== "default") {
    for (const [k, px] of Object.entries(RADIUS_SCALES[theme.radiusScale].tokens)) {
      vars[`--radius-${k}`] = `${px}px`;
    }
  }

  const headingFont = findBrandFont(theme.fontHeading);
  const bodyFont = findBrandFont(theme.fontBody);
  if (headingFont) vars["--font-display-stack"] = `'${headingFont.family}', var(--font-inter), sans-serif`;
  if (bodyFont) vars["--font-body-stack"] = `'${bodyFont.family}', var(--font-inter), sans-serif`;

  return vars;
}

/** Serialises for a `<style>` tag. Safe: every value above is built from validated hex / whitelisted keys. */
export function themeVarsToCss(vars: ThemeVars, selector = ":root"): string {
  const body = Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  return body ? `${selector}{${body}}` : "";
}

export function themeFontSlugs(theme: Partial<ThemeInput>): string[] {
  const slugs: (string | null | undefined)[] = [
    findBrandFont(theme.fontHeading)?.googleFontsSlug,
    findBrandFont(theme.fontBody)?.googleFontsSlug,
  ];
  return [...new Set(slugs.filter((s): s is string => !!s))];
}

/* -------------------------------------------------------------------------- */
/* Accessibility report                                                       */
/* -------------------------------------------------------------------------- */

export type ContrastLevel = "AAA" | "AA" | "AA Large" | "Fail";

export type ContrastCheck = { label: string; fg: string; bg: string; ratio: number; level: ContrastLevel };

function levelOf(ratio: number): ContrastLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

/** The pairings the site actually renders — surfaced in admin so a bad pick is visible before saving. */
export function contrastReport(theme: Partial<ThemeInput>): ContrastCheck[] {
  const pick = (f: ThemeColorField) => (isHexColor(theme[f] ?? "") ? theme[f]! : DEFAULT_THEME_COLORS[f]);
  const primary = pick("colorPrimary");
  const accent = pick("colorAccent");
  const secondary = pick("colorSecondary");
  const dark = pick("colorDark");

  const pairs: Omit<ContrastCheck, "ratio" | "level">[] = [
    { label: "Primary button text", fg: readableOn(primary), bg: primary },
    { label: "Accent button text", fg: readableOn(accent), bg: accent },
    { label: "Secondary on white (links)", fg: secondary, bg: WHITE },
    { label: "Text on dark bands", fg: WHITE, bg: dark },
    { label: "Accent on dark bands", fg: accent, bg: dark },
  ];
  return pairs.map((p) => {
    const ratio = contrastRatio(p.fg, p.bg);
    return { ...p, ratio: Math.round(ratio * 100) / 100, level: levelOf(ratio) };
  });
}
