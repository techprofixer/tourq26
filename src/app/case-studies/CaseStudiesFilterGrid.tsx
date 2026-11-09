"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CaseStudy } from "@/lib/case-studies-content";

export function CaseStudiesFilterGrid({ caseStudies }: { caseStudies: CaseStudy[] }) {
  const industries = useMemo(
    () => Array.from(new Set(caseStudies.flatMap((c) => c.industries))).sort(),
    [caseStudies],
  );
  const [active, setActive] = useState<string | null>(null);

  const visible = active ? caseStudies.filter((c) => c.industries.includes(active)) : caseStudies;

  return (
    <>
      <p className="display-md mt-4 max-w-2xl text-foreground">
        {visible.length} engagement{visible.length === 1 ? "" : "s"} you can read end-to-end.
      </p>

      {industries.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActive(null)}
            className={`mono-label rounded-full border px-3 py-1.5 transition-colors ${
              active === null
                ? "border-foreground bg-foreground text-background"
                : "border-hairline text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            ALL INDUSTRIES
          </button>
          {industries.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setActive(name)}
              className={`mono-label rounded-full border px-3 py-1.5 transition-colors ${
                active === name
                  ? "border-foreground bg-foreground text-background"
                  : "border-hairline text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {name.toUpperCase()}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {visible.map((study) => (
          <li key={study.slug}>
            <article className="card-flat card-hover group flex h-full flex-col overflow-hidden p-0">
              <Link href={`/case-studies/${study.slug}`} className="flex h-full flex-col">
                <div className="relative aspect-[16/9] overflow-hidden border-b border-hairline">
                  <Image
                    src={study.coverImage}
                    alt={study.coverAlt}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <p className="mono-eyebrow text-muted-foreground">
                      {study.industry.toUpperCase()}
                    </p>
                    <span className="mono-label text-muted-foreground">
                      {study.metricLabel.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="display-md mt-5 text-foreground">{study.title}</h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    {study.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {study.services.map((s) => (
                      <span
                        key={s}
                        className="mono-label rounded-[var(--radius-xs)] border border-hairline px-2 py-1 text-muted-foreground"
                      >
                        {s.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4">
                    <span className="stat-number text-[28px] leading-none text-foreground">
                      {study.metric}
                    </span>
                    <span className="mono-button text-foreground transition-transform group-hover:translate-x-0.5">
                      READ CASE STUDY →
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}
