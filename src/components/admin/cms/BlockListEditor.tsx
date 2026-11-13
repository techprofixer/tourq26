"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  BLOCK_TYPE_OPTIONS,
  createDefaultBlock,
  type BlockTypeKey,
  type CmsBlock,
} from "@/lib/cms/blocks";
import { stripHtmlToText } from "@/lib/seo-generate";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { AiGenerateButton, longFormExtraFields } from "@/components/admin/AiGenerateButton";

function blockSummary(block: CmsBlock): string {
  switch (block.type) {
    case "hero":
      return block.heading || "Untitled hero";
    case "contentSection":
      return block.heading || stripHtmlToText(block.bodyHtml).slice(0, 70) || "Untitled section";
    case "cta":
      return block.heading || "Untitled CTA";
    case "summary":
      return `${block.items.length} takeaway${block.items.length === 1 ? "" : "s"}`;
    case "faq":
      return `${block.items.length} question${block.items.length === 1 ? "" : "s"}`;
    case "featureGrid":
      return `${block.items.length} feature${block.items.length === 1 ? "" : "s"}`;
    case "entityGrid":
      return `${block.kind.toLowerCase()} catalogue`;
    default:
      return "";
  }
}

function newBlockId(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Small stroke icons for the block picker / block headers (24px grid, currentColor). */
const BLOCK_ICONS: Record<BlockTypeKey, string> = {
  hero: "M3.5 5.5h17v8h-17zM7 17.5h10M9 20.5h6",
  summary: "M8 6.5h12.5M8 12h12.5M8 17.5h12.5M4 6.5h.01M4 12h.01M4 17.5h.01",
  contentSection: "M4 5.5h16M4 9.5h16M4 13.5h10M4 17.5h13",
  featureGrid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  entityGrid: "M4 5h16v4H4zM4 11h7v8H4zM13 11h7v8h-7z",
  faq: "M9.2 9a3 3 0 1 1 4.3 2.7c-.9.4-1.5 1.2-1.5 2.1v.7M12 18h.01M12 21.5a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19Z",
  cta: "M4 8h16v8H4zM14 12h3M15.5 10.5 17 12l-1.5 1.5",
};

export function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

export const ICON = {
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  chevron: "m6 9 6 6 6-6",
  up: "m6 15 6-6 6 6",
  down: "m6 9 6 6 6-6",
  copy: "M8 8h11v11H8zM5 16V5h11",
  trash: "M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13",
  plus: "M12 5v14M5 12h14",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
};

function IconButton({
  label,
  icon,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-30 ${
        danger ? "hover:text-[color:var(--app-destructive)]" : "hover:text-foreground"
      }`}
    >
      <Icon d={icon} />
    </button>
  );
}

/** "+" affordance between blocks; expands into a picker of block types. */
function BlockInserter({
  open,
  onOpen,
  onClose,
  onPick,
  prominent,
  options,
}: {
  options: typeof BLOCK_TYPE_OPTIONS;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPick: (type: BlockTypeKey) => void;
  /** Always-visible "Add block" button (end of list / empty page) instead of a hover line. */
  prominent?: boolean;
}) {
  if (open) {
    return (
      <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="mono-label text-muted-foreground">Add a block</p>
          <button type="button" onClick={onClose} className="mono-label text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {options.map((o) => (
            <li key={o.type}>
              <button
                type="button"
                onClick={() => onPick(o.type)}
                className="flex h-full w-full items-start gap-3 rounded-md border border-border/70 p-3 text-left transition-colors hover:border-foreground/40 hover:bg-muted/40"
              >
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                  <Icon d={BLOCK_ICONS[o.type]} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-foreground">{o.label}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">{o.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (prominent) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
      >
        <Icon d={ICON.plus} />
        Add block
      </button>
    );
  }
  return (
    <div className="group relative flex h-5 items-center justify-center">
      <span className="absolute inset-x-0 top-1/2 h-px bg-transparent transition-colors group-hover:bg-border" aria-hidden />
      <button
        type="button"
        onClick={onOpen}
        title="Insert block here"
        aria-label="Insert block here"
        className="relative inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus:opacity-100 group-hover:opacity-100"
      >
        <Icon d={ICON.plus} className="h-3 w-3" />
      </button>
    </div>
  );
}

/**
 * Ordered list of content blocks with insert / reorder / duplicate / remove and per-block field
 * editors. Shared by the CMS page editor and the blog post editor; `allowedTypes` narrows the
 * block picker (e.g. blog posts have their own H1, so they don't offer a hero).
 */
export function BlockListEditor({
  blocks,
  setBlocks,
  allowedTypes,
  pageTitle,
  pageContext,
  focusKeyword,
  secondaryKeywords = "",
  startOpen = false,
}: {
  blocks: CmsBlock[];
  setBlocks: Dispatch<SetStateAction<CmsBlock[]>>;
  allowedTypes?: readonly BlockTypeKey[];
  pageTitle: string;
  /** Short description of the page (excerpt / meta description) — grounds the AI prompts. */
  pageContext: string;
  focusKeyword: string;
  secondaryKeywords?: string;
  /** Open the block picker straight away when the list is empty. */
  startOpen?: boolean;
}) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragFromIndex = useRef<number | null>(null);
  const [inserterAt, setInserterAt] = useState<number | null>(
    startOpen && blocks.length === 0 ? 0 : null,
  );
  const options = allowedTypes
    ? BLOCK_TYPE_OPTIONS.filter((o) => allowedTypes.includes(o.type))
    : BLOCK_TYPE_OPTIONS;
  const allCollapsed = blocks.length > 0 && collapsedIds.size === blocks.length;

  function updateBlock(id: string, patch: Partial<CmsBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...patch } as CmsBlock) : b)));
  }

  function insertBlock(at: number, blockType: BlockTypeKey) {
    setBlocks((prev) => {
      const copy = [...prev];
      copy.splice(at, 0, createDefaultBlock(blockType, prev));
      return copy;
    });
    setInserterAt(null);
  }

  function removeBlock(block: CmsBlock) {
    if (!window.confirm(`Remove this ${BLOCK_TYPE_OPTIONS.find((o) => o.type === block.type)?.label ?? "block"}?`)) return;
    setBlocks((prev) => prev.filter((b) => b.id !== block.id));
  }

  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  }

  function reorderBlocks(from: number, to: number) {
    setBlocks((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length || from === to) {
        return prev;
      }
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }

  function duplicateBlock(id: string) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const clone = { ...structuredClone(prev[idx]), id: newBlockId() } as CmsBlock;
      const copy = [...prev];
      copy.splice(idx + 1, 0, clone);
      return copy;
    });
  }

  function toggleCollapsed(id: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section aria-labelledby="content-heading" className="space-y-2">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 id="content-heading" className="mono-eyebrow text-muted-foreground">
            CONTENT · {blocks.length} BLOCK{blocks.length === 1 ? "" : "S"}
          </h2>
        </div>
        {blocks.length > 1 ? (
          <button
            type="button"
            className="mono-label text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsedIds(allCollapsed ? new Set() : new Set(blocks.map((b) => b.id)))}
          >
            {allCollapsed ? "Expand all" : "Collapse all"}
          </button>
        ) : null}
      </div>

      {blocks.length > 0 ? (
        <BlockInserter
          options={options}
          open={inserterAt === 0}
          onOpen={() => setInserterAt(0)}
          onClose={() => setInserterAt(null)}
          onPick={(t) => insertBlock(0, t)}
        />
      ) : null}

      <ul>
        {blocks.map((block, index) => {
          const collapsed = collapsedIds.has(block.id);
          const option = BLOCK_TYPE_OPTIONS.find((o) => o.type === block.type);
          return (
            <li key={block.id}>
              <div
                className={`overflow-hidden rounded-lg border bg-background transition-opacity ${
                  draggingId === block.id ? "border-foreground/40 opacity-40" : "border-border"
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = dragFromIndex.current;
                  dragFromIndex.current = null;
                  setDraggingId(null);
                  if (from !== null) reorderBlocks(from, index);
                }}
              >
                <div className={`flex items-center gap-2 px-2 py-2 ${collapsed ? "" : "border-b border-border/60 bg-muted/30"}`}>
                  <span
                    draggable
                    role="button"
                    aria-label="Drag to reorder"
                    title="Drag to reorder"
                    className="inline-flex h-7 w-5 cursor-grab items-center justify-center text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
                    onDragStart={(e) => {
                      dragFromIndex.current = index;
                      setDraggingId(block.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      dragFromIndex.current = null;
                      setDraggingId(null);
                    }}
                  >
                    <Icon d={ICON.grip} />
                  </span>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    onClick={() => toggleCollapsed(block.id)}
                    aria-expanded={!collapsed}
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                      <Icon d={BLOCK_ICONS[block.type]} />
                    </span>
                    <span className="shrink-0 text-[13px] font-medium text-foreground">
                      {option?.label ?? block.type}
                    </span>
                    <span className="truncate text-[13px] text-muted-foreground">{blockSummary(block)}</span>
                    <span
                      className="ml-auto shrink-0 text-muted-foreground transition-transform"
                      style={{ transform: collapsed ? "rotate(-90deg)" : "none" }}
                    >
                      <Icon d={ICON.chevron} />
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center">
                    <IconButton label="Move up" icon={ICON.up} disabled={index === 0} onClick={() => moveBlock(block.id, -1)} />
                    <IconButton
                      label="Move down"
                      icon={ICON.down}
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(block.id, 1)}
                    />
                    <IconButton label="Duplicate" icon={ICON.copy} onClick={() => duplicateBlock(block.id)} />
                    <IconButton label="Remove" icon={ICON.trash} danger onClick={() => removeBlock(block)} />
                  </div>
                </div>
                {collapsed ? null : (
                  <div className="p-4 sm:p-5">
                    <BlockFields
                      block={block}
                      pageTitle={pageTitle}
                      pageContext={pageContext}
                      pageFocusKeyword={focusKeyword}
                      pageSecondaryKeywords={secondaryKeywords}
                      onChange={(patch) => updateBlock(block.id, patch)}
                    />
                  </div>
                )}
              </div>
              {index < blocks.length - 1 ? (
                <BlockInserter
                  options={options}
                  open={inserterAt === index + 1}
                  onOpen={() => setInserterAt(index + 1)}
                  onClose={() => setInserterAt(null)}
                  onPick={(t) => insertBlock(index + 1, t)}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="pt-2">
        <BlockInserter
          options={options}
          prominent
          open={inserterAt === blocks.length}
          onOpen={() => setInserterAt(blocks.length)}
          onClose={() => setInserterAt(null)}
          onPick={(t) => insertBlock(blocks.length, t)}
        />
      </div>
    </section>
  );
}

function BlockFields({
  block,
  pageTitle,
  pageContext,
  pageFocusKeyword,
  pageSecondaryKeywords,
  onChange,
}: {
  block: CmsBlock;
  pageTitle: string;
  pageContext: string;
  pageFocusKeyword: string;
  pageSecondaryKeywords: string;
  onChange: (patch: Partial<CmsBlock>) => void;
}) {
  if (block.type === "hero") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 flex justify-end">
          <AiGenerateButton<{ eyebrow: string; heading: string; subheading: string }>
            task="heroCopy"
            variant="inline"
            context={{
              topic: [pageTitle, pageContext].filter(Boolean).join(" — ") || "this page",
              purpose: "convert a first-time visitor into a lead",
            }}
            onResult={({ eyebrow, heading, subheading }) => onChange({ eyebrow, heading, subheading })}
          />
        </div>
        <Field label="Eyebrow" value={block.eyebrow ?? ""} onChange={(v) => onChange({ eyebrow: v })} />
        <Field label="Heading" value={block.heading} onChange={(v) => onChange({ heading: v })} />
        <Field
          label="Subheading"
          value={block.subheading ?? ""}
          onChange={(v) => onChange({ subheading: v })}
          className="sm:col-span-2"
          multiline
        />
        <Field
          label="Primary CTA label"
          value={block.primaryCtaLabel ?? ""}
          onChange={(v) => onChange({ primaryCtaLabel: v })}
        />
        <Field
          label="Primary CTA href"
          value={block.primaryCtaHref ?? ""}
          onChange={(v) => onChange({ primaryCtaHref: v })}
        />
        <Field
          label="Secondary CTA label"
          value={block.secondaryCtaLabel ?? ""}
          onChange={(v) => onChange({ secondaryCtaLabel: v })}
        />
        <Field
          label="Secondary CTA href"
          value={block.secondaryCtaHref ?? ""}
          onChange={(v) => onChange({ secondaryCtaHref: v })}
        />
      </div>
    );
  }

  if (block.type === "summary") {
    return (
      <div className="space-y-4">
        <Field
          label="Heading"
          value={block.heading ?? ""}
          onChange={(v) => onChange({ heading: v })}
        />
        <p className="text-xs text-muted-foreground">
          2–5 standalone sentences that directly answer the page&apos;s main question. Each should make sense
          quoted on its own — this is the text AI Overviews, ChatGPT and Perplexity are most likely to cite.
        </p>
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={`${block.id}-sum-${i}`} className="flex items-start gap-2">
              <span className="mono-label pt-2.5 text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                rows={2}
                value={item}
                onChange={(e) =>
                  onChange({ items: block.items.map((it, idx) => (idx === i ? e.target.value : it)) })
                }
              />
              <button
                type="button"
                className="btn-base btn-secondary !px-2 !py-1 text-xs"
                disabled={block.items.length <= 1}
                onClick={() => onChange({ items: block.items.filter((_, idx) => idx !== i) })}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn-base btn-secondary"
          onClick={() => onChange({ items: [...block.items, ""] })}
        >
          Add takeaway
        </button>
      </div>
    );
  }

  if (block.type === "contentSection") {
    return (
      <div className="grid gap-3">
        <Field label="Eyebrow" value={block.eyebrow ?? ""} onChange={(v) => onChange({ eyebrow: v })} />
        <Field label="Heading" value={block.heading ?? ""} onChange={(v) => onChange({ heading: v })} />
        <div className="block text-sm">
          <span className="flex items-baseline justify-between gap-2">
            <span className="mono-label text-muted-foreground">Body</span>
            <AiGenerateButton<string>
              task="longFormBody"
              variant="inline"
              context={{
                title: block.heading || pageTitle,
                contentType: pageTitle ? `section of the page "${pageTitle}"` : "page section",
                brief: pageContext || block.heading || pageTitle,
              }}
              onResult={(html) => onChange({ bodyHtml: html })}
              extraFields={longFormExtraFields({
                primaryKeyword: pageFocusKeyword,
                secondaryKeywords: pageSecondaryKeywords,
              })}
            />
          </span>
          <div className="mt-1.5">
            <RichTextEditor
              value={block.bodyHtml}
              onChange={(html) => onChange({ bodyHtml: html })}
              placeholder="Write the section body…"
              minHeight="12rem"
            />
          </div>
        </div>
        <ImageUploadField
          label="Image (optional)"
          value={block.image?.url ?? ""}
          onChange={(url, asset) =>
            onChange({
              image: url
                ? {
                    url,
                    alt: asset?.alt || block.image?.alt || "",
                    title: asset?.title || block.image?.title || undefined,
                  }
                : undefined,
            })
          }
          helpText="Shown on the right side of this section, next to the body text."
          meta={block.image?.url ? { alt: block.image.alt ?? "", title: block.image.title ?? "" } : undefined}
          onMetaChange={({ alt, title }) =>
            onChange({ image: block.image?.url ? { ...block.image, alt, title: title || undefined } : block.image })
          }
        />
      </div>
    );
  }

  if (block.type === "cta") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 flex justify-end">
          <AiGenerateButton<{ heading: string; body: string; primaryCtaLabel: string }>
            task="ctaCopy"
            variant="inline"
            context={{
              purpose: pageTitle
                ? `Convince a visitor to take the next step on the "${pageTitle}" page`
                : "Convince a visitor to take the next step",
              audience: "a prospective client evaluating this page",
            }}
            onResult={({ heading, body, primaryCtaLabel }) => onChange({ heading, body, primaryCtaLabel })}
          />
        </div>
        <Field label="Eyebrow" value={block.eyebrow ?? ""} onChange={(v) => onChange({ eyebrow: v })} />
        <Field label="Heading" value={block.heading} onChange={(v) => onChange({ heading: v })} />
        <div className="block text-sm sm:col-span-2">
          <span className="mono-label text-muted-foreground">Body</span>
          <div className="mt-1.5">
            <RichTextEditor
              value={block.body ?? ""}
              onChange={(html) => onChange({ body: html })}
              placeholder="Optional supporting copy…"
              minHeight="8rem"
            />
          </div>
        </div>
        <Field
          label="Primary CTA label"
          value={block.primaryCtaLabel ?? ""}
          onChange={(v) => onChange({ primaryCtaLabel: v })}
        />
        <Field
          label="Primary CTA href"
          value={block.primaryCtaHref ?? ""}
          onChange={(v) => onChange({ primaryCtaHref: v })}
        />
        <Field
          label="Secondary CTA label"
          value={block.secondaryCtaLabel ?? ""}
          onChange={(v) => onChange({ secondaryCtaLabel: v })}
        />
        <Field
          label="Secondary CTA href"
          value={block.secondaryCtaHref ?? ""}
          onChange={(v) => onChange({ secondaryCtaHref: v })}
        />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={!!block.dark}
            onChange={(e) => onChange({ dark: e.target.checked })}
          />
          Dark band
        </label>
      </div>
    );
  }

  if (block.type === "entityGrid") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mono-label text-muted-foreground">Catalogue</span>
          <select
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
            value={block.kind}
            onChange={(e) => onChange({ kind: e.target.value as typeof block.kind })}
          >
            <option value="SERVICE">Services</option>
            <option value="SOLUTION">Solutions</option>
            <option value="INDUSTRY">Industries</option>
            <option value="TECHNOLOGY">Technologies</option>
          </select>
          <span className="mt-1 block text-xs text-muted-foreground">
            Cards are pulled live from Admin → CMS → Entities — only entries with a
            published page show up.
          </span>
        </label>
        <Field label="Eyebrow" value={block.eyebrow ?? ""} onChange={(v) => onChange({ eyebrow: v })} />
        <Field
          label="Heading"
          value={block.heading ?? ""}
          onChange={(v) => onChange({ heading: v })}
          className="sm:col-span-2"
        />
      </div>
    );
  }

  if (block.type === "faq") {
    return (
      <div className="space-y-4">
        <Field
          label="Heading"
          value={block.heading ?? ""}
          onChange={(v) => onChange({ heading: v })}
        />
        <ul className="space-y-4">
          {block.items.map((item, i) => (
            <li
              key={`${block.id}-faq-${i}`}
              className="rounded-md border border-border/50 bg-background/60 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="mono-label text-muted-foreground">
                  Q{String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-2">
                  <AiGenerateButton<{ question: string; answer: string }>
                    task="faqItem"
                    variant="inline"
                    context={{
                      topic: pageTitle || block.heading,
                      pageContext,
                      existing: block.items
                        .filter((_, idx) => idx !== i)
                        .map((it) => it.question)
                        .join(" | "),
                    }}
                    onResult={({ question, answer }) => {
                      const items = block.items.map((it, idx) =>
                        idx === i ? { ...it, question, answer } : it,
                      );
                      onChange({ items });
                    }}
                  />
                  <button
                    type="button"
                    className="btn-base btn-secondary !px-2 !py-1 text-xs"
                    onClick={() =>
                      onChange({
                        items: block.items.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
              <Field
                label="Question"
                value={item.question}
                onChange={(v) => {
                  const items = block.items.map((it, idx) =>
                    idx === i ? { ...it, question: v } : it,
                  );
                  onChange({ items });
                }}
              />
              <div className="mt-3 block text-sm">
                <span className="mono-label text-muted-foreground">Answer</span>
                <div className="mt-1.5">
                  <RichTextEditor
                    value={item.answer}
                    onChange={(html) => {
                      const items = block.items.map((it, idx) =>
                        idx === i ? { ...it, answer: html } : it,
                      );
                      onChange({ items });
                    }}
                    placeholder="Write the answer…"
                    minHeight="7rem"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn-base btn-secondary"
          onClick={() =>
            onChange({
              items: [
                ...block.items,
                { question: "New question?", answer: "<p>Answer goes here.</p>" },
              ],
            })
          }
        >
          Add FAQ item
        </button>
      </div>
    );
  }

  if (block.type === "featureGrid") {
    return (
      <div className="space-y-4">
        <Field
          label="Heading"
          value={block.heading ?? ""}
          onChange={(v) => onChange({ heading: v })}
        />
        <ul className="space-y-3">
          {block.items.map((item, i) => (
            <li
              key={`${block.id}-feat-${i}`}
              className="rounded-md border border-border/50 bg-background/60 p-3"
            >
              <div className="mb-2 flex justify-end gap-2">
                <AiGenerateButton<{ title: string; description: string }>
                  task="itemCopy"
                  variant="inline"
                  context={{
                    theme: [block.heading, pageTitle].filter(Boolean).join(" — "),
                    kind: "feature",
                    existing: block.items.filter((_, idx) => idx !== i).map((it) => it.title),
                  }}
                  onResult={({ title: t, description }) => {
                    const items = block.items.map((it, idx) =>
                      idx === i ? { ...it, title: t, description } : it,
                    );
                    onChange({ items });
                  }}
                />
                <button
                  type="button"
                  className="btn-base btn-secondary !px-2 !py-1 text-xs"
                  onClick={() =>
                    onChange({
                      items: block.items.filter((_, idx) => idx !== i),
                    })
                  }
                >
                  Remove
                </button>
              </div>
              <Field
                label="Title"
                value={item.title}
                onChange={(v) => {
                  const items = block.items.map((it, idx) =>
                    idx === i ? { ...it, title: v } : it,
                  );
                  onChange({ items });
                }}
              />
              <Field
                label="Description"
                value={item.description}
                onChange={(v) => {
                  const items = block.items.map((it, idx) =>
                    idx === i ? { ...it, description: v } : it,
                  );
                  onChange({ items });
                }}
                multiline
                className="mt-2"
              />
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn-base btn-secondary"
          onClick={() =>
            onChange({
              items: [
                ...block.items,
                { title: "New feature", description: "Short description." },
              ],
            })
          }
        >
          Add feature
        </button>
      </div>
    );
  }

  return null;
}

function Field({
  label,
  value,
  onChange,
  multiline,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="mono-label text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea
          className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
