"use client";

/**
 * Thin wrapper around Meta Pixel's `fbq` global. Every call no-ops safely when the pixel isn't
 * installed (NEXT_PUBLIC_META_PIXEL_ID unset — see src/components/MetaPixel.tsx), so call sites
 * never need to branch on whether the Pixel is configured.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackPixelEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", eventName, params);
}
