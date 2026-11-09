"use client";

import { useEffect } from "react";
import { captureUtmParams } from "@/lib/business-systems/utm";
import { track } from "@/lib/analytics";
import { trackPixelEvent } from "@/lib/meta-pixel";

/** Fires once per landing on /business-systems: UTM capture + page/view analytics + Pixel ViewContent. */
export default function BusinessSystemsAnalytics() {
  useEffect(() => {
    captureUtmParams();
    track("page_view");
    track("business_systems_view");
    trackPixelEvent("ViewContent", { content_name: "business_systems_landing" });
  }, []);

  return null;
}
