"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";

/** CTA link to the contact form (or a custom href) — fires booking_click before navigating. */
export default function DemoCta({
  className,
  children,
  ctaId,
  href = "/contact",
}: {
  className?: string;
  children: React.ReactNode;
  ctaId: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => track("booking_click", { cta_id: ctaId, product: "torqos" })}
    >
      {children}
    </Link>
  );
}
