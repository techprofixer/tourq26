"use client";

/**
 * Site-wide UTM attribution. Captured once per browser session (first touch wins) from the
 * URL query string and persisted in sessionStorage, so any lead form on the site can attach
 * it to a submission regardless of which page the visitor landed on or navigated through
 * before converting. Mirrors the pattern in `@/lib/business-systems/utm`, which stays scoped
 * to that funnel's own storage key.
 */

const STORAGE_KEY = "torq_utm";

export type StoredUtm = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPage?: string;
};

/** Call once per page load (e.g. from a root-layout client component). No-ops on subsequent
 * navigations once first-touch UTM values are stored, so later direct/organic visits within
 * the same session don't overwrite the original attribution. */
export function captureUtmParams(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const next: StoredUtm = {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    landingPage: `${window.location.pathname}${window.location.search}`,
  };
  const hasAnyUtm = Object.entries(next).some(([key, value]) => key !== "landingPage" && Boolean(value));
  if (!hasAnyUtm) {
    // Still record a landing page on true first touch so attribution isn't empty for direct/organic traffic.
    if (!readStoredUtmParams()) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function readStoredUtmParams(): StoredUtm | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredUtm) : null;
  } catch {
    return null;
  }
}
