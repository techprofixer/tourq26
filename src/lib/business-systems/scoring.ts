import type { Budget, TeamSize, Timeline } from "./options";

/** Lead scoring weights (AGENTS.md §9) — tune freely, nothing else needs to change when these do. */
export const BUDGET_POINTS: Record<Budget, number> = {
  "50k-1l": 5,
  "1l-3l": 15,
  "3l-5l": 25,
  "5l-plus": 30,
  "not-sure": 5,
};

export const TIMELINE_POINTS: Record<Timeline, number> = {
  immediately: 30,
  "within-30-days": 25,
  "1-3-months": 15,
  "3-6-months": 5,
  exploring: 0,
};

export const TEAM_SIZE_POINTS: Record<TeamSize, number> = {
  "1-5": 5,
  "6-20": 10,
  "21-50": 15,
  "51-100": 20,
  "100+": 25,
};

export type LeadCategory = "LOW" | "MEDIUM" | "HIGH" | "HOT";

/** LOW 0–20, MEDIUM 21–40, HIGH 41–60, HOT 60+ (AGENTS.md §9). */
export function categorizeLeadScore(score: number): LeadCategory {
  if (score > 60) return "HOT";
  if (score >= 41) return "HIGH";
  if (score >= 21) return "MEDIUM";
  return "LOW";
}

export function computeLeadScore(input: { budget: Budget; timeline: Timeline; teamSize: TeamSize }): number {
  return (
    (BUDGET_POINTS[input.budget] ?? 0) +
    (TIMELINE_POINTS[input.timeline] ?? 0) +
    (TEAM_SIZE_POINTS[input.teamSize] ?? 0)
  );
}
