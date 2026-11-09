"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";

/** CTA link to the audit form — fires cta_click before navigating. */
export default function AuditCta({
  className,
  children,
  ctaId,
}: {
  className?: string;
  children: React.ReactNode;
  ctaId: string;
}) {
  return (
    <Link
      href="/business-systems/audit"
      className={className}
      onClick={() => track("cta_click", { cta_id: ctaId })}
    >
      {children}
    </Link>
  );
}
