"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { trackPixelEvent } from "@/lib/meta-pixel";

/** Fires once per landing on /torqos: page/view analytics + Pixel ViewContent. */
export default function TorqosAnalytics() {
  useEffect(() => {
    track("page_view");
    track("torqos_view");
    trackPixelEvent("ViewContent", { content_name: "torqos_landing" });
  }, []);

  return null;
}
