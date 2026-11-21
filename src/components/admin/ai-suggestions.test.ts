import { describe, expect, it } from "vitest";
import { hasSuggestion, toggleSuggestion } from "@/components/admin/AiGenerateButton";

describe("toggleSuggestion", () => {
  it("adds plain lines on their own line and removes them on a second click", () => {
    const once = toggleSuggestion("No pricing", "Don't mention competitors");
    expect(once).toBe("No pricing\nDon't mention competitors");
    expect(toggleSuggestion(once, "Don't mention competitors")).toBe("No pricing");
  });

  it("never removes or duplicates a Label: starter the editor has filled in", () => {
    const filled = "Based in: Austin, TX";
    expect(hasSuggestion(filled, "Based in: ")).toBe(true);
    expect(toggleSuggestion(filled, "Based in: ")).toBe(filled);
  });
});
