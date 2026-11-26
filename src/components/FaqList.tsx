"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type FaqRendered = { question: string; html: string; text: string };

/**
 * Interactive part of the FAQ: live search, expand/collapse all, numbered accordion cards.
 * Built on native <details>, so every answer is in the server HTML (crawlers, no-JS) and the
 * accordion stays keyboard/screen-reader accessible. Filtering only toggles `hidden`.
 */
export default function FaqList({
  items,
  groupName,
  openFirst,
}: {
  items: FaqRendered[];
  groupName: string;
  openFirst: boolean;
}) {
  const [query, setQuery] = useState("");
  const [openAll, setOpenAll] = useState(false);
  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => items.map((f) => !q || f.question.toLowerCase().includes(q) || f.text.toLowerCase().includes(q)),
    [items, q],
  );
  const shown = matches.filter(Boolean).length;
  const searchable = items.length >= 6;

  return (
    <div>
      {searchable ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Search questions</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions…"
              className="text-input !rounded-full !bg-white !py-3 !pl-11"
            />
          </label>
          <button
            type="button"
            onClick={() => setOpenAll((v) => !v)}
            className="mono-label rounded-full border border-black/15 bg-white px-4 py-3 text-foreground transition-colors hover:border-foreground"
          >
            {openAll ? "COLLAPSE ALL" : "EXPAND ALL"}
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((f, i) => (
          <details
            key={f.question}
            // name = exclusive accordion; dropped while "expand all" is on so all can be open at once.
            name={openAll ? undefined : groupName}
            open={openAll || (openFirst && i === 0 && !q) || undefined}
            hidden={!matches[i]}
            className="faq-item group"
          >
            <summary className="flex cursor-pointer list-none items-center gap-4 p-5 text-left sm:gap-5 sm:p-6 [&::-webkit-details-marker]:hidden">
              <span className="mono-label hidden w-7 shrink-0 text-muted-foreground sm:block">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="display-sm flex-1 text-foreground">{f.question}</span>
              <span className="faq-icon" aria-hidden />
            </summary>
            <div className="faq-body">
              <div
                className="blog-article max-w-none px-5 pb-6 !text-[15px] !leading-[1.65] sm:pl-[4.5rem] sm:pr-6 [&>*+*]:!mt-3"
                dangerouslySetInnerHTML={{ __html: f.html }}
              />
            </div>
          </details>
        ))}
      </div>

      {q && shown === 0 ? (
        <p role="status" className="rounded-[var(--radius-md)] border border-dashed border-black/20 bg-white p-6 text-[15px] text-muted-foreground">
          No questions match &ldquo;{query}&rdquo;.{" "}
          <Link href="/contact" className="text-foreground underline underline-offset-4">
            Ask us directly
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
