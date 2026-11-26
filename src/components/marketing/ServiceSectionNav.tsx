"use client";

import { useEffect, useState } from "react";

export function ServiceSectionNav({
  sections,
}: {
  sections: { id: string; heading: string }[];
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el != null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Section navigation" className="hidden lg:sticky lg:top-28 lg:block">
      <p className="mono-eyebrow text-muted-foreground">ON THIS PAGE</p>
      <ol className="relative mt-5 space-y-1 border-l border-black/10">
        {sections.map((s, i) => {
          const active = activeId === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active ? "true" : undefined}
                className={`-ml-px flex gap-3 border-l-2 py-2 pl-4 pr-2 text-[14px] leading-snug transition-colors ${
                  active
                    ? "border-[var(--brand-mint)] font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="mono-label shrink-0 pt-0.5 text-foreground/50">{String(i + 1).padStart(2, "0")}</span>
                <span>{s.heading}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
