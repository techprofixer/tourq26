import { describe, expect, it } from "vitest";
import { INITIAL_PROGRESS, estimateTokens, formatDuration, viewProgress, type AiProgress } from "@/lib/ai/progress";

const info = {
  model: "m",
  provider: "local" as const,
  host: "localhost:11434",
  maxOutputTokens: 8000,
  expectedOutputTokens: 2000,
};

const base: AiProgress = { ...INITIAL_PROGRESS, info, phase: "writing" };

describe("viewProgress", () => {
  it("is 0 with no ETA before any tokens arrive", () => {
    const v = viewProgress({ ...base, elapsedMs: 30_000 });
    expect(v.fraction).toBe(0);
    expect(v.remainingMs).toBeNull();
    expect(v.tokensPerSecond).toBeNull();
  });

  it("computes speed from the first token, excluding cold-start wait", () => {
    // 40s waiting for the model to load, then 500 tokens in the next 20s → 25 tok/s.
    const v = viewProgress({ ...base, outputTokens: 500, firstTokenAtMs: 40_000, elapsedMs: 60_000 });
    expect(v.tokensPerSecond).toBeCloseTo(25, 5);
    expect(v.fraction).toBeCloseTo(0.25, 5);
    // 1,500 tokens left at 25 tok/s = 60s.
    expect(v.remainingMs).toBe(60_000);
  });

  it("never reaches 100% and drops the ETA once the estimate is exceeded", () => {
    const v = viewProgress({ ...base, outputTokens: 2600, firstTokenAtMs: 1000, elapsedMs: 100_000 });
    expect(v.fraction).toBeLessThan(1);
    expect(v.overrun).toBe(true);
    expect(v.remainingMs).toBeNull();
  });

  it("handles a missing run description", () => {
    const v = viewProgress({ ...INITIAL_PROGRESS, outputTokens: 100, firstTokenAtMs: 0, elapsedMs: 1000 });
    expect(v.fraction).toBe(0);
    expect(v.remainingMs).toBeNull();
  });
});

describe("formatDuration / estimateTokens", () => {
  it("formats seconds and minutes", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45_400)).toBe("45s");
    expect(formatDuration(125_000)).toBe("2m 05s");
  });

  it("estimates ~4 chars per token", () => {
    expect(estimateTokens("a".repeat(400))).toBe(100);
  });
});
