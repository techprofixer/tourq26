"use client";

/**
 * Minimal analytics event dispatch — this repo has no analytics backend wired up yet (no GA4/
 * Segment/PostHog). `track()` pushes to `window.dataLayer` (the de facto standard queue GTM/GA4
 * consume) when present and no-ops otherwise, so events are captured the moment a backend is
 * connected without any call site changes.
 */

export const ANALYTICS_EVENTS = [
  "page_view",
  "business_systems_view",
  "torqos_view",
  "cta_click",
  "audit_form_start",
  "audit_form_step_1",
  "audit_form_step_2",
  "audit_form_step_3",
  // AGENTS.md §12 only names step_1–3, written before the form's final 7-step design (§4) —
  // extended here so every step of the actual form is instrumented, not just the first three.
  "audit_form_step_4",
  "audit_form_step_5",
  "audit_form_step_6",
  "audit_form_step_7",
  "audit_form_complete",
  "lead_submitted",
  "whatsapp_click",
  "booking_click",
  "video_demo_play",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function track(event: AnalyticsEvent, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...params });
}
