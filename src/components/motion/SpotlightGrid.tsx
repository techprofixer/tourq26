"use client";

import type { ReactNode } from "react";

/**
 * List/grid wrapper that tracks the pointer and exposes --mx / --my on the hovered card so
 * `.spotlight-card` can paint a soft radial highlight that follows the cursor.
 */
export default function SpotlightGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul
      className={className}
      onPointerMove={(e) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>(".spotlight-card");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </ul>
  );
}
