"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * One delegated click listener that turns the site's contact links into GA4 events, so server-rendered
 * links (hero cards, category contact blocks, footer, floating button) need no per-link wiring.
 * Only the link *type* and page path are sent — never the phone number or message text in the URL.
 */
export default function AnalyticsClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      const params = { page_path: window.location.pathname };
      if (/^https?:\/\/(api\.whatsapp\.com|wa\.me)\//i.test(href)) track("whatsapp_click", params);
      else if (href.startsWith("mailto:")) track("email_click", params);
      else if (href.startsWith("tel:")) track("phone_click", params);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
