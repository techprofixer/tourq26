"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";
import { trackPixelEvent } from "@/lib/meta-pixel";

export default function SuccessActions({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("whatsapp_click")}
          className="btn-base btn-outline"
        >
          Chat on WhatsApp
        </a>
      ) : null}
      <Link
        href="/contact"
        onClick={() => {
          track("booking_click");
          trackPixelEvent("Schedule");
        }}
        className="btn-base btn-primary"
      >
        Book a Call
      </Link>
    </div>
  );
}
