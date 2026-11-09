import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_COLORS,
  THEME_PRESETS,
  buildThemeVars,
  contrastRatio,
  contrastReport,
  parseHex,
  readableOn,
  themeFontSlugs,
  themeVarsToCss,
} from "@/lib/theme";

describe("color math", () => {
  it("parses 3- and 6-digit hex", () => {
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
    expect(parseHex("#2F63B8")).toEqual([47, 99, 184]);
    expect(parseHex("rgb(0,0,0)")).toBeNull();
  });

  it("computes WCAG contrast", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
  });

  it("picks readable text for light and dark backgrounds", () => {
    expect(readableOn("#ffd100")).toBe("#050505");
    expect(readableOn("#050505")).toBe("#ffffff");
    expect(readableOn("#2f63b8")).toBe("#ffffff");
  });
});

describe("buildThemeVars", () => {
  it("emits nothing for an empty theme so globals.css defaults win", () => {
    expect(buildThemeVars({})).toEqual({});
    expect(themeVarsToCss({})).toBe("");
  });

  it("derives fg, hover and tints from a light primary", () => {
    const vars = buildThemeVars({ colorPrimary: "#ffd100" });
    expect(vars["--app-primary"]).toBe("#ffd100");
    expect(vars["--app-primary-fg"]).toBe("#050505");
    expect(vars["--app-primary-hover"]).not.toBe("#ffd100");
    expect(vars["--app-primary-muted"]).toBe("rgba(255, 209, 0, 0.06)");
  });

  it("rebuilds the gradient when only the secondary changes", () => {
    const vars = buildThemeVars({ colorSecondary: "#e11d48" });
    expect(vars["--brand-orange"]).toBe("#e11d48");
    expect(vars["--brand-gradient"]).toContain("#e11d48");
    expect(vars["--brand-gradient"]).toContain(DEFAULT_THEME_COLORS.colorAccent);
  });

  it("ignores non-hex input rather than injecting it", () => {
    const vars = buildThemeVars({ colorPrimary: "red;}body{display:none", colorDark: "url(x)" });
    expect(vars).toEqual({});
  });

  it("only overrides radius for non-default scales", () => {
    expect(buildThemeVars({ radiusScale: "default" })).toEqual({});
    expect(buildThemeVars({ radiusScale: "bogus" })).toEqual({});
    expect(buildThemeVars({ radiusScale: "sharp" })["--radius-sm"]).toBe("0px");
  });

  it("serialises to a single :root rule", () => {
    const css = themeVarsToCss(buildThemeVars({ colorDark: "#0a1f12" }));
    expect(css.startsWith(":root{--brand-canvas-dark:#0a1f12;")).toBe(true);
    expect(css.endsWith("}")).toBe(true);
  });
});

describe("fonts", () => {
  it("dedupes Google Fonts slugs and skips self-hosted defaults", () => {
    expect(themeFontSlugs({ fontHeading: "sora", fontBody: "sora" })).toHaveLength(1);
    expect(themeFontSlugs({ fontHeading: "inter" })).toEqual([]);
  });
});

describe("presets", () => {
  it("every preset passes AA for button text", () => {
    for (const preset of THEME_PRESETS) {
      const report = contrastReport(preset.colors);
      const buttons = report.filter((c) => c.label.includes("button"));
      for (const c of buttons) expect(c.level, `${preset.key}: ${c.label}`).not.toBe("Fail");
    }
  });
});
