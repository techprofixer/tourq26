"use client";

/**
 * Analytics event dispatch. When GA4 is installed (src/components/GoogleAnalytics.tsx) events go to
 * `window.gtag('event', …)`; otherwise they are queued on `window.dataLayer` so a later-loaded tag
 * manager still sees them. `page_view` is never forwarded to gtag because GA4 already records page
 * views itself (config + Enhanced Measurement) and a manual one would double-count.
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
  "email_click",
  "phone_click",
  "booking_click",
  "video_demo_play",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export function track(event: AnalyticsEvent, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    if (event !== "page_view") window.gtag("event", event, params);
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...params });
}
