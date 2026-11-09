"use client";

/**
 * UTM attribution for the /business-systems funnel. Captured once on landing (from the URL
 * query string) and persisted in sessionStorage so it survives the /business-systems ->
 * /business-systems/audit navigation without being passed through links or re-typed.
 */

const STORAGE_KEY = "torq_business_systems_utm";

export type StoredUtm = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPage?: string;
};

/** Call once on /business-systems mount. No-ops (keeps the first-touch values) if nothing new is present. */
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
