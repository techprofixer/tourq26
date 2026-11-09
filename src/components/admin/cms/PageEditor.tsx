"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BLOCK_TYPE_OPTIONS,
  createDefaultBlock,
  type BlockTypeKey,
  type CmsBlock,
} from "@/lib/cms/blocks";
import type { LinkSuggestion } from "@/lib/cms/link-suggestions";
import {
  extractTextFromCmsBlocks,
  generateSeoFromContent,
} from "@/lib/seo-generate";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { SerpPreview } from "@/components/admin/SerpPreview";
import { AiGenerateButton } from "@/components/admin/AiGenerateButton";
import { SeoAnalysisSidebar } from "@/components/admin/cms/SeoAnalysisSidebar";
import { SuggestedLinksBar } from "@/components/admin/cms/SuggestedLinksBar";

type PageEditorProps = {
  mode: "create" | "edit";
  pageId?: string;
  siteUrl?: string;
  siteName?: string;
  initial?: {
    title: string;
    slug: string;
    type: string;
    status: string;
    path: string;
    excerpt: string;
    blocks: CmsBlock[];
    seo: {
      metaTitle: string;
      metaDescription: string;
      focusKeyword: string;
      robotsIndex: boolean;
      robotsFollow: boolean;
    };
    brief: {
      targetKeyword: string;
      secondaryKeywords: string;
    };
  };
};

const PAGE_TYPES = [
  "SERVICE",
  "SOLUTION",
  "INDUSTRY",
  "TECHNOLOGY",
  "LOCATION",
  "LANDING",
  "COMPANY",
  "CUSTOM",
] as const;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function blockSummary(block: CmsBlock): string {
  switch (block.type) {
    case "hero":
      return block.heading || "Untitled hero";
    case "contentSection":
      return block.heading || stripHtml(block.bodyHtml).slice(0, 70) || "Untitled section";
    case "cta":
      return block.heading || "Untitled CTA";
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

const SECTIONS = [
  { id: "section-basics", label: "Basics" },
  { id: "section-blocks", label: "Blocks" },
  { id: "section-seo", label: "SEO & brief" },
];

export function PageEditor({
  mode,
  pageId,
  siteUrl = "https://example.com",
  siteName = "",
  initial,
}: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [type, setType] = useState(initial?.type ?? "SERVICE");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [path, setPath] = useState(initial?.path ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [blocks, setBlocks] = useState<CmsBlock[]>(initial?.blocks ?? []);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragFromIndex = useRef<number | null>(null);
  const [metaTitle, setMetaTitle] = useState(initial?.seo.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initial?.seo.metaDescription ?? "",
  );
  const [focusKeyword, setFocusKeyword] = useState(initial?.seo.focusKeyword ?? "");
  const [robotsIndex, setRobotsIndex] = useState(initial?.seo.robotsIndex ?? true);
  const [robotsFollow, setRobotsFollow] = useState(initial?.seo.robotsFollow ?? true);
  const [targetKeyword, setTargetKeyword] = useState(
    initial?.brief.targetKeyword ?? "",
  );
  const [secondaryKeywords, setSecondaryKeywords] = useState(
    initial?.brief.secondaryKeywords ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleInvalid, setTitleInvalid] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [addType, setAddType] = useState<BlockTypeKey>("hero");
  const titleRef = useRef<HTMLInputElement>(null);

  const previewPath = useMemo(() => path || `/${slug}`, [path, slug]);

  function onTitleChange(value: string) {
    setTitle(value);
    if (value.trim()) setTitleInvalid(false);
    if (mode === "create" && !slugTouched) {
      setSlug(slugify(value));
    }
  }

  function onSlugChange(value: string) {
    setSlug(value);
    setSlugTouched(true);
  }

  function generateSeo() {
    const generated = generateSeoFromContent({
      title,
      excerpt,
      bodyText: extractTextFromCmsBlocks(blocks),
      focusKeyword: focusKeyword || targetKeyword,
    });
    setMetaTitle(generated.metaTitle);
    setMetaDescription(generated.metaDescription);
    if (!focusKeyword.trim() && targetKeyword.trim()) {
      setFocusKeyword(targetKeyword.trim());
    }
  }

  async function save(publish = false) {
    if (!title.trim()) {
      setError("Title is required before saving.");
      setTitleInvalid(true);
      titleRef.current?.focus();
      return;
    }
    setSaving(true);
    setError(null);
    setSavedNotice(null);
    const payload = {
      title,
      slug,
      type,
      status: publish ? "PUBLISHED" : status,
      path: path || undefined,
      excerpt,
      blocks,
      seo: {
        metaTitle: metaTitle || title,
        metaDescription,
        focusKeyword,
        robotsIndex,
        robotsFollow,
        schemaKeys: type === "SERVICE" || type === "LOCATION" ? ["Service", "FAQPage"] : [],
      },
      brief: {
        targetKeyword: targetKeyword || focusKeyword,
        secondaryKeywords: secondaryKeywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    };

    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/cms/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
        if (publish) {
          await fetch(`/api/admin/cms/pages/${data.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "publish" }),
          });
        }
        router.push(`/admin/cms/pages/${data.id}`);
        router.refresh();
      } else if (pageId) {
        const res = await fetch(`/api/admin/cms/pages/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
        if (publish) {
          await fetch(`/api/admin/cms/pages/${pageId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "publish" }),
          });
        }
        setSavedNotice(publish ? "Published." : "Draft saved.");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function updateBlock(id: string, patch: Partial<CmsBlock>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, ...patch } as CmsBlock) : b)),
    );
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
      const clone = { ...prev[idx], id: newBlockId() } as CmsBlock;
      const copy = [...prev];
      copy.splice(idx + 1, 0, clone);
      return copy;
    });
  }

  function insertLinkSuggestion(suggestion: LinkSuggestion) {
    setBlocks((prev) => {
      const targetIndex = prev.map((b) => b.type).lastIndexOf("contentSection");
      if (targetIndex < 0) return prev;
      const target = prev[targetIndex];
      if (target.type !== "contentSection") return prev;
      const next = [...prev];
      next[targetIndex] = {
        ...target,
        bodyHtml: `${target.bodyHtml}<p><a href="${suggestion.path}">${suggestion.anchor}</a></p>`,
      };
      return next;
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

  const seoAnalysisInput = useMemo(() => {
    const heroBlock = blocks.find((b) => b.type === "hero");
    const hasHeading = blocks.some(
      (b) => (b.type === "contentSection" || b.type === "hero") && Boolean(b.heading?.trim()),
    );
    const rawHtml = blocks
      .map((b) => {
        if (b.type === "contentSection") return b.bodyHtml;
        if (b.type === "cta") return b.body ?? "";
        return "";
      })
      .filter(Boolean)
      .join(" ");
    const blockTypesPresent = Array.from(new Set(blocks.map((b) => b.type)));
    return {
      bodyText: extractTextFromCmsBlocks(blocks),
      heroHeading: heroBlock?.type === "hero" ? heroBlock.heading : "",
      hasHeading,
      rawHtml,
      blockTypesPresent,
    };
  }, [blocks]);

  const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[] | null>(null);
  const [linkSuggestionsLoading, setLinkSuggestionsLoading] = useState(false);
  const effectiveFocusKeyword = focusKeyword || targetKeyword;
  const { bodyText } = seoAnalysisInput;

  useEffect(() => {
    if (!effectiveFocusKeyword.trim() && bodyText.trim().length < 20) {
      setLinkSuggestions(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLinkSuggestionsLoading(true);
      const params = new URLSearchParams({
        focusKeyword: effectiveFocusKeyword,
        secondary: secondaryKeywords,
        bodyText: bodyText.slice(0, 1000),
        ...(mode === "edit" && previewPath ? { excludePath: previewPath } : {}),
      });
      fetch(`/api/admin/cms/link-suggestions?${params.toString()}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => setLinkSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []))
        .catch(() => {})
        .finally(() => setLinkSuggestionsLoading(false));
    }, 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [effectiveFocusKeyword, secondaryKeywords, bodyText, previewPath, mode]);

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <nav
        aria-label="Jump to section"
        className="sticky top-0 z-10 -mx-5 flex items-center gap-1 border-b border-border/60 bg-background/95 px-5 py-2.5 backdrop-blur lg:-mx-8 lg:px-8"
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="mono-label rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
      <div className="space-y-8 lg:col-span-8">

      <section id="section-basics" className="card-flat scroll-mt-16 space-y-6">
        <div>
          <h2 className="display-sm text-foreground">Basics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Title, URL, and the short excerpt used in previews and generated SEO copy.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <label className="block text-sm">
            <span className="flex items-center justify-between gap-2">
              <span className="mono-label text-muted-foreground">
                Title <span className="text-[color:var(--app-destructive)]">*</span>
              </span>
            </span>
            <input
              ref={titleRef}
              className={`mt-1.5 w-full rounded-md border bg-background px-3 py-2 ${
                titleInvalid ? "border-[color:var(--app-destructive)]" : "border-border"
              }`}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              aria-invalid={titleInvalid}
            />
            {titleInvalid ? (
              <span className="mt-1 block text-xs text-[color:var(--app-destructive)]">
                Title is required.
              </span>
            ) : null}
          </label>
          <label className="block text-sm">
            <span className="flex items-center justify-between gap-2">
              <span className="mono-label text-muted-foreground">Slug</span>
              {mode === "create" && slugTouched ? (
                <button
                  type="button"
                  className="mono-label text-muted-foreground/80 underline decoration-dotted underline-offset-2 hover:text-foreground"
                  onClick={() => {
                    setSlugTouched(false);
                    setSlug(slugify(title));
                  }}
                >
                  Reset to auto
                </button>
              ) : null}
            </span>
            <input
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
              value={slug}
              placeholder="auto from title"
              onChange={(e) => onSlugChange(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mono-label text-muted-foreground">Type</span>
            <select
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {PAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mono-label text-muted-foreground">Path</span>
            <input
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
              value={path}
              placeholder="auto from type + slug"
              onChange={(e) => setPath(e.target.value)}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Resolves to <span className="font-mono">{previewPath}</span>
            </span>
          </label>
          <label className="block text-sm lg:col-span-2">
            <span className="flex items-baseline justify-between gap-2">
              <span className="mono-label text-muted-foreground">Excerpt</span>
              <AiGenerateButton<string>
                task="excerpt"
                variant="inline"
                context={{ title, bodyText: extractTextFromCmsBlocks(blocks) }}
                onResult={setExcerpt}
                disabled={!title.trim() && blocks.length === 0}
              />
            </span>
            <textarea
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section id="section-blocks" className="card-flat scroll-mt-16 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="display-sm text-foreground">Blocks</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Compose the page from reusable sections. Drag the grip to reorder.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {blocks.length > 1 ? (
              <button
                type="button"
                className="mono-label text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                onClick={() =>
                  setCollapsedIds(
                    collapsedIds.size === blocks.length
                      ? new Set()
                      : new Set(blocks.map((b) => b.id)),
                  )
                }
              >
                {collapsedIds.size === blocks.length ? "Expand all" : "Collapse all"}
              </button>
            ) : null}
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={addType}
              onChange={(e) => setAddType(e.target.value as BlockTypeKey)}
            >
              {BLOCK_TYPE_OPTIONS.map((o) => (
                <option key={o.type} value={o.type}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-base btn-secondary"
              onClick={() => setBlocks((prev) => [...prev, createDefaultBlock(addType, prev)])}
            >
              Add block
            </button>
          </div>
        </div>

        {blocks.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
            No blocks yet — add one above to start building the page.
          </p>
        ) : (
          <ul className="space-y-3">
            {blocks.map((block, index) => {
              const collapsed = collapsedIds.has(block.id);
              const label = BLOCK_TYPE_OPTIONS.find((o) => o.type === block.type)?.label ?? block.type;
              return (
                <li
                  key={block.id}
                  className={`rounded-md border border-border/60 bg-muted/20 transition-opacity ${
                    draggingId === block.id ? "opacity-40" : ""
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
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        draggable
                        role="button"
                        aria-label="Drag to reorder"
                        title="Drag to reorder"
                        className="cursor-grab select-none px-1 py-1 text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
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
                        ⠿
                      </span>
                      <button
                        type="button"
                        className="flex min-w-0 items-center gap-2 text-left"
                        onClick={() => toggleCollapsed(block.id)}
                        aria-expanded={!collapsed}
                      >
                        <span
                          className="inline-block shrink-0 text-muted-foreground transition-transform"
                          style={{ transform: collapsed ? "rotate(-90deg)" : "none" }}
                          aria-hidden
                        >
                          ▾
                        </span>
                        <span className="mono-eyebrow shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-muted-foreground">
                          {String(index + 1).padStart(2, "0")} · {label}
                        </span>
                        <span className="truncate text-sm text-foreground/80">
                          {blockSummary(block)}
                        </span>
                      </button>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        className="btn-base btn-secondary !px-2 !py-1 text-xs"
                        title="Move up"
                        aria-label="Move block up"
                        disabled={index === 0}
                        onClick={() => moveBlock(block.id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn-base btn-secondary !px-2 !py-1 text-xs"
                        title="Move down"
                        aria-label="Move block down"
                        disabled={index === blocks.length - 1}
                        onClick={() => moveBlock(block.id, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn-base btn-secondary !px-2 !py-1 text-xs"
                        title="Duplicate block"
                        onClick={() => duplicateBlock(block.id)}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        className="btn-base btn-secondary !px-2 !py-1 text-xs"
                        title="Remove block"
                        onClick={() => setBlocks((prev) => prev.filter((b) => b.id !== block.id))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {collapsed ? null : (
                    <div className="border-t border-border/50 p-4">
                      <BlockFields
                        block={block}
                        pageTitle={title}
                        pageContext={excerpt}
                        pageFocusKeyword={focusKeyword || targetKeyword}
                        pageSecondaryKeywords={secondaryKeywords}
                        onChange={(patch) => updateBlock(block.id, patch)}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="section-seo" className="card-flat scroll-mt-16 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="display-sm text-foreground">SEO & brief</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate meta from title, excerpt, and page blocks, then refine below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-base btn-secondary"
              onClick={generateSeo}
              disabled={!title.trim() && !excerpt.trim() && blocks.length === 0}
            >
              Generate from content
            </button>
            <AiGenerateButton<{ metaTitle: string; metaDescription: string }>
              task="seoMetaPair"
              context={{ title, focusKeyword: focusKeyword || targetKeyword, bodyText: extractTextFromCmsBlocks(blocks) || excerpt }}
              onResult={({ metaTitle: mt, metaDescription: md }) => {
                setMetaTitle(mt);
                setMetaDescription(md);
              }}
              label="Generate with AI"
              disabled={!title.trim() && !excerpt.trim() && blocks.length === 0}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <SerpPreview
              siteUrl={siteUrl}
              path={previewPath}
              title={
                (metaTitle.trim() || title || "Page title") +
                (siteName ? ` | ${siteName}` : "")
              }
              description={metaDescription || excerpt}
            />
          </div>

          <label className="block text-sm">
            <span className="flex items-center justify-between gap-2">
              <span className="mono-label text-muted-foreground">Meta title</span>
              <span
                className={`mono-label tabular-nums ${
                  (metaTitle || title).length > 60
                    ? "text-[color:var(--app-destructive)]"
                    : "text-muted-foreground"
                }`}
              >
                {(metaTitle || title).length} / ~60
              </span>
            </span>
            <input
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
              value={metaTitle}
              placeholder={title || "Defaults to page title"}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mono-label text-muted-foreground">Focus keyword</span>
            <input
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
            />
          </label>
          <label className="block text-sm lg:col-span-2">
            <span className="flex items-center justify-between gap-2">
              <span className="mono-label text-muted-foreground">Meta description</span>
              <span
                className={`mono-label tabular-nums ${
                  metaDescription.length > 160
                    ? "text-[color:var(--app-destructive)]"
                    : "text-muted-foreground"
                }`}
              >
                {metaDescription.length} / ~160
              </span>
            </span>
            <textarea
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
              rows={3}
              value={metaDescription}
              placeholder="Write or generate from page content"
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </label>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={robotsIndex}
                onChange={(e) => setRobotsIndex(e.target.checked)}
              />
              Index
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={robotsFollow}
                onChange={(e) => setRobotsFollow(e.target.checked)}
              />
              Follow
            </label>
          </div>
          <label className="block text-sm">
            <span className="mono-label text-muted-foreground">Brief target keyword</span>
            <input
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="flex items-baseline justify-between gap-2">
              <span className="mono-label text-muted-foreground">
                Secondary keywords (comma-separated)
              </span>
              <AiGenerateButton<{ keywords: string[] }>
                task="keywordSuggestions"
                variant="inline"
                label="Suggest"
                context={{ title, bodyText: extractTextFromCmsBlocks(blocks) || excerpt }}
                onResult={({ keywords }) =>
                  setSecondaryKeywords(
                    Array.from(
                      new Set([
                        ...secondaryKeywords.split(",").map((s) => s.trim()).filter(Boolean),
                        ...keywords,
                      ]),
                    ).join(", "),
                  )
                }
                disabled={!title.trim() && blocks.length === 0}
              />
            </span>
            <input
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2"
              value={secondaryKeywords}
              onChange={(e) => setSecondaryKeywords(e.target.value)}
            />
          </label>
        </div>
      </section>

      </div>

      <div className="lg:sticky lg:top-16 lg:col-span-4">
        <SeoAnalysisSidebar
          title={title}
          slug={slug}
          metaTitle={metaTitle}
          metaDescription={metaDescription}
          focusKeyword={focusKeyword || targetKeyword}
          secondaryKeywords={secondaryKeywords.split(",").map((s) => s.trim()).filter(Boolean)}
          bodyText={seoAnalysisInput.bodyText}
          heroHeading={seoAnalysisInput.heroHeading}
          hasHeading={seoAnalysisInput.hasHeading}
          rawHtml={seoAnalysisInput.rawHtml}
          siteUrl={siteUrl}
          blockTypesPresent={seoAnalysisInput.blockTypesPresent}
        />
      </div>

      </div>

      <div className="sticky bottom-0 z-10 -mx-5 border-t border-border bg-background/95 px-5 backdrop-blur lg:-mx-8 lg:px-8">
        <SuggestedLinksBar
          suggestions={linkSuggestions}
          loading={linkSuggestionsLoading}
          onInsert={insertLinkSuggestion}
        />
        <div className="flex flex-wrap items-center gap-3 py-4">
        <button
          type="button"
          className="btn-base btn-primary"
          disabled={saving}
          onClick={() => void save(false)}
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          className="btn-base btn-secondary"
          disabled={saving}
          onClick={() => void save(true)}
        >
          Save & publish
        </button>
        {mode === "edit" && path ? (
          <Link href={path} className="btn-base btn-secondary" target="_blank">
            View live
          </Link>
        ) : null}
        {savedNotice ? (
          <span className="mono-label text-muted-foreground">{savedNotice}</span>
        ) : null}
        </div>
      </div>
    </div>
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
              context={{ title: block.heading || pageTitle, contentType: "section", brief: pageContext || block.heading || pageTitle }}
              onResult={(html) => onChange({ bodyHtml: html })}
              extraFields={[
                {
                  key: "primaryKeyword",
                  label: "Primary keyword",
                  type: "text",
                  defaultValue: pageFocusKeyword,
                  placeholder: "e.g. CRM development",
                },
                {
                  key: "secondaryKeywords",
                  label: "Secondary keywords",
                  type: "text",
                  defaultValue: pageSecondaryKeywords,
                  placeholder: "comma-separated",
                },
                {
                  key: "paragraphCount",
                  label: "Paragraphs",
                  type: "number",
                  defaultValue: "4",
                },
                {
                  key: "targetWords",
                  label: "Target length (words)",
                  type: "number",
                  defaultValue: "500",
                },
                {
                  key: "avoid",
                  label: "Avoid",
                  type: "textarea",
                  placeholder: "e.g. don't mention pricing, avoid buzzwords like \"revolutionary\", no fabricated stats",
                },
              ]}
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
        <div className="grid gap-3 sm:grid-cols-2">
          <ImageUploadField
            label="Image (optional)"
            value={block.image?.url ?? ""}
            onChange={(url) =>
              onChange({ image: url ? { url, alt: block.image?.alt ?? "" } : undefined })
            }
            helpText="Shown on the right side of this section, next to the body text."
          />
          <Field
            label="Image alt text"
            value={block.image?.alt ?? ""}
            onChange={(alt) =>
              onChange({ image: block.image?.url ? { ...block.image, alt } : block.image })
            }
          />
        </div>
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
                    context={{ topic: block.heading || pageTitle, pageContext }}
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
                  context={{ theme: block.heading || pageTitle, kind: "feature" }}
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
