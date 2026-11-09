"use client";

import { useEffect } from "react";
import { captureUtmParams } from "@/lib/utm";

/** Mounted once in the root layout so UTM params are captured on first landing regardless of
 * which page a visitor enters through, not just the /business-systems funnel. */
export default function UtmCapture() {
  useEffect(() => {
    captureUtmParams();
  }, []);

  return null;
}
