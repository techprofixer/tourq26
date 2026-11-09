"use client";

import { useState } from "react";
import type { LinkSuggestion } from "@/lib/cms/link-suggestions";

function LinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.4 5.1a3.5 3.5 0 0 1 5 5L16 11.5" />
      <path d="M13 17.5 11.6 18.9a3.5 3.5 0 0 1-5-5L8 12.5" />
    </svg>
  );
}

/**
 * Sticks to the bottom of the editor (rendered inside PageEditor's sticky footer) so link
 * suggestions stay visible without scrolling into a sidebar card.
 */
export function SuggestedLinksBar({
  suggestions,
  loading,
  onInsert,
}: {
  suggestions: LinkSuggestion[] | null;
  loading: boolean;
  onInsert: (suggestion: LinkSuggestion) => void;
}) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  if (!loading && (!suggestions || suggestions.length === 0)) return null;

  function copy(s: LinkSuggestion) {
    const html = `<a href="${s.path}">${s.anchor}</a>`;
    navigator.clipboard
      ?.writeText(html)
      .then(() => {
        setCopiedPath(s.path);
        setTimeout(() => setCopiedPath((p) => (p === s.path ? null : p)), 1500);
      })
      .catch(() => {});
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto border-b border-border/60 py-2.5">
      <span className="mono-label flex shrink-0 items-center gap-1.5 text-muted-foreground">
        <LinkIcon className="h-3.5 w-3.5 text-primary" aria-hidden />
        {loading ? "Scanning…" : "Suggested links"}
      </span>
      {suggestions?.map((s) => (
        <div
          key={s.path}
          className="flex shrink-0 items-center gap-2 rounded-full border border-primary/20 bg-primary/5 py-1 pl-3 pr-1.5"
        >
          <span className="whitespace-nowrap text-[13px] text-foreground">
            <span className="font-medium">{s.anchor}</span>
            <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">{s.path}</span>
          </span>
          <button
            type="button"
            className="btn-base btn-secondary !px-2 !py-1 text-xs"
            title="Append this link to the last content section"
            onClick={() => onInsert(s)}
          >
            Insert
          </button>
          <button
            type="button"
            className="btn-base btn-secondary !px-2 !py-1 text-xs"
            title="Copy link HTML"
            onClick={() => copy(s)}
          >
            {copiedPath === s.path ? "Copied" : "Copy"}
          </button>
        </div>
      ))}
    </div>
  );
}
