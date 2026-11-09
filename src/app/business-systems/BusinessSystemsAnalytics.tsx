"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { trackPixelEvent } from "@/lib/meta-pixel";

/** Fires once per landing on /business-systems: page/view analytics (UTM capture is site-wide via <UtmCapture />) + Pixel ViewContent. */
export default function BusinessSystemsAnalytics() {
  useEffect(() => {
    track("page_view");
    track("business_systems_view");
    trackPixelEvent("ViewContent", { content_name: "business_systems_landing" });
  }, []);

  return null;
}
