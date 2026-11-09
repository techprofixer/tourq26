"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import {
  BLOCK_TYPE_OPTIONS,
  createDefaultBlock,
  type BlockTypeKey,
  type CmsBlock,
} from "@/lib/cms/blocks";
import type { LinkSuggestion } from "@/lib/cms/link-suggestions";
import { normalizePagePath, pagePathError, pathFor } from "@/lib/cms/paths";
import type { PageType } from "@prisma/client";
import {
  extractTextFromCmsBlocks,
  generateSeoFromContent,
  stripHtmlToText,
} from "@/lib/seo-generate";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { SerpPreview } from "@/components/admin/SerpPreview";
import { AiGenerateButton } from "@/components/admin/AiGenerateButton";
import { SeoAnalysisSidebar } from "@/components/admin/cms/SeoAnalysisSidebar";
import { Card, Row, SidebarField, StatusPill } from "@/components/admin/EditorPanels";
import { analyzePageSeo, summarizeSeoChecks } from "@/lib/seo-analysis";
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
      canonical: string;
      ogImageUrl: string;
      breadcrumbLabel: string;
      authorName: string;
      jsonLdCustom: string;
    };
    brief: {
      targetKeyword: string;
      secondaryKeywords: string;
    };
  };
};

/** Types an editor can create. Each maps to a default URL (pathFor) and a JSON-LD type
 *  (src/lib/cms/metadata.ts). Blog posts / case studies have their own editors, not CMS pages. */
const PAGE_TYPES: { value: PageType; label: string; hint: string }[] = [
  { value: "SERVICE", label: "Service", hint: "/services/… · Service schema" },
  { value: "SOLUTION", label: "Solution", hint: "/solutions/… · Service schema" },
  { value: "INDUSTRY", label: "Industry", hint: "/industries/… · Service schema" },
  { value: "TECHNOLOGY", label: "Technology", hint: "/technologies/… · Service schema" },
  { value: "LOCATION", label: "Location", hint: "/locations/… · Service schema, area served" },
  { value: "GUIDE", label: "Guide", hint: "/resources/guides/… · Article schema" },
  { value: "COMPARISON", label: "Comparison", hint: "/compare/… · Article schema" },
  { value: "GLOSSARY", label: "Glossary term", hint: "/resources/glossary/… · DefinedTerm schema" },
  { value: "LANDING", label: "Landing page", hint: "/… · WebPage schema" },
  { value: "COMPANY", label: "Company page", hint: "/company/… · WebPage schema" },
];

const ARTICLE_LIKE = new Set<string>(["GUIDE", "COMPARISON", "GLOSSARY"]);

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

const INPUT = "mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2";
const SIDEBAR_INPUT = "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px]";

type SaveIntent = "keep" | "publish" | "unpublish";

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

function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

const ICON = {
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
}: {
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
          {BLOCK_TYPE_OPTIONS.map((o) => (
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

function CharCount({ value, max }: { value: number; max: number }) {
  return (
    <span
      className={`mono-label tabular-nums ${value > max ? "text-[color:var(--app-destructive)]" : "text-muted-foreground"}`}
    >
      {value} / {max}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block text-[13px] font-medium text-foreground">{label}</span>
        <span className="block text-[12px] leading-snug text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className="relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full bg-muted transition-colors peer-checked:bg-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-foreground/30 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-background after:shadow after:transition-transform peer-checked:after:translate-x-4"
      />
    </label>
  );
}

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
  const [livePath, setLivePath] = useState(initial?.path ?? "");
  const [path, setPath] = useState(initial?.path ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [blocks, setBlocks] = useState<CmsBlock[]>(initial?.blocks ?? []);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragFromIndex = useRef<number | null>(null);
  const [inserterAt, setInserterAt] = useState<number | null>(
    (initial?.blocks?.length ?? 0) === 0 ? 0 : null,
  );
  const [metaTitle, setMetaTitle] = useState(initial?.seo.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.seo.metaDescription ?? "");
  const [focusKeyword, setFocusKeyword] = useState(initial?.seo.focusKeyword ?? "");
  const [robotsIndex, setRobotsIndex] = useState(initial?.seo.robotsIndex ?? true);
  const [robotsFollow, setRobotsFollow] = useState(initial?.seo.robotsFollow ?? true);
  const [canonical, setCanonical] = useState(initial?.seo.canonical ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(initial?.seo.ogImageUrl ?? "");
  const [breadcrumbLabel, setBreadcrumbLabel] = useState(initial?.seo.breadcrumbLabel ?? "");
  const [authorName, setAuthorName] = useState(initial?.seo.authorName ?? "");
  const [jsonLdCustom, setJsonLdCustom] = useState(initial?.seo.jsonLdCustom ?? "");
  const [targetKeyword, setTargetKeyword] = useState(initial?.brief.targetKeyword ?? "");
  const [secondaryKeywords, setSecondaryKeywords] = useState(initial?.brief.secondaryKeywords ?? "");
  const [saving, setSaving] = useState<SaveIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [titleInvalid, setTitleInvalid] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"page" | "seo">("page");
  const titleRef = useRef<HTMLInputElement>(null);

  const isLive = status === "PUBLISHED";
  const typeMeta = PAGE_TYPES.find((t) => t.value === type);

  const previewPath = useMemo(
    () => (path.trim() ? normalizePagePath(path) : pathFor(type as PageType, slug || title)),
    [path, slug, title, type],
  );
  const pathError = pagePathError(previewPath);
  const siteHost = useMemo(() => {
    try {
      return new URL(siteUrl).host;
    } catch {
      return siteUrl;
    }
  }, [siteUrl]);
  const jsonLdError = useMemo(() => {
    if (!jsonLdCustom.trim()) return null;
    try {
      const parsed: unknown = JSON.parse(jsonLdCustom);
      return typeof parsed === "object" && parsed !== null ? null : "Must be a JSON object or array.";
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid JSON.";
    }
  }, [jsonLdCustom]);

  /** Everything the server persists, minus status — the basis for dirty tracking and the save payload. */
  const formPayload = useMemo(
    () => ({
      title,
      slug,
      type,
      path: path || undefined,
      excerpt,
      blocks,
      seo: {
        metaTitle: metaTitle || title,
        metaDescription,
        focusKeyword,
        robotsIndex,
        robotsFollow,
        canonical,
        ogImageUrl,
        breadcrumbLabel,
        authorName,
        jsonLdCustom,
      },
      brief: {
        targetKeyword: targetKeyword || focusKeyword,
        secondaryKeywords: secondaryKeywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    }),
    [
      title, slug, type, path, excerpt, blocks, metaTitle, metaDescription, focusKeyword, robotsIndex,
      robotsFollow, canonical, ogImageUrl, breadcrumbLabel, authorName, jsonLdCustom, targetKeyword,
      secondaryKeywords,
    ],
  );
  const snapshot = useMemo(() => JSON.stringify(formPayload), [formPayload]);
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);
  const dirty = mode === "create" || snapshot !== savedSnapshot;

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

  async function patchPage(id: string, body: unknown) {
    const res = await fetch(`/api/admin/cms/pages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Save failed");
    return data as { id: string; path: string; status: string };
  }

  /** `keep` saves without changing live state; `publish` / `unpublish` also flip status. */
  async function save(intent: SaveIntent) {
    if (!title.trim()) {
      setError("Add a page title before saving.");
      setTitleInvalid(true);
      titleRef.current?.focus();
      return;
    }
    if (pathError || jsonLdError) {
      setError(pathError ?? `Custom JSON-LD: ${jsonLdError}`);
      if (pathError) setSidebarTab("page");
      return;
    }
    setSaving(intent);
    setError(null);
    setSavedNotice(null);
    const savedAt = snapshot;

    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/cms/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formPayload, status: "DRAFT" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Create failed");
        if (intent === "publish") await patchPage(data.id, { action: "publish" });
        router.push(`/admin/cms/pages/${data.id}`);
        router.refresh();
        return;
      }
      if (!pageId) return;

      let page = await patchPage(pageId, formPayload);
      if (intent === "publish" && !isLive) page = await patchPage(pageId, { action: "publish" });
      if (intent === "unpublish") page = await patchPage(pageId, { action: "transition", toStatus: "DRAFT" });

      setStatus(page.status);
      setLivePath(page.path);
      setSavedSnapshot(savedAt);
      setSavedNotice(
        intent === "publish"
          ? isLive
            ? "Changes are live."
            : "Published — the page is live."
          : intent === "unpublish"
            ? "Unpublished — the page is now a draft."
            : isLive
              ? "Changes are live."
              : "Draft saved.",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  // ⌘S / Ctrl+S saves in place; warn before leaving with unsaved edits.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveRef.current("keep");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!dirty || mode === "create") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, mode]);
  useEffect(() => {
    if (!savedNotice) return;
    const t = setTimeout(() => setSavedNotice(null), 4000);
    return () => clearTimeout(t);
  }, [savedNotice]);

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
    return {
      bodyText: extractTextFromCmsBlocks(blocks),
      heroHeading: heroBlock?.type === "hero" ? heroBlock.heading : "",
      hasHeading,
      rawHtml,
      blockTypesPresent: Array.from(new Set(blocks.map((b) => b.type))),
      faqCount: blocks.reduce((n, b) => n + (b.type === "faq" ? b.items.length : 0), 0),
      summaryItems: blocks.reduce((n, b) => n + (b.type === "summary" ? b.items.length : 0), 0),
      questionHeadings: blocks.filter(
        (b) => b.type === "contentSection" && Boolean(b.heading?.trim().endsWith("?")),
      ).length,
    };
  }, [blocks]);

  const seoProps = {
    title,
    slug,
    metaTitle,
    metaDescription,
    focusKeyword: focusKeyword || targetKeyword,
    secondaryKeywords: secondaryKeywords.split(",").map((s) => s.trim()).filter(Boolean),
    siteUrl,
    hasSocialImage: Boolean(ogImageUrl.trim()),
    ...seoAnalysisInput,
  };
  const seoSummary = summarizeSeoChecks(analyzePageSeo(seoProps));
  const wordCount = seoAnalysisInput.bodyText ? seoAnalysisInput.bodyText.split(/\s+/).length : 0;

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

  const allCollapsed = blocks.length > 0 && collapsedIds.size === blocks.length;
  const pathMoved = mode === "edit" && isLive && Boolean(initial?.path) && previewPath !== initial?.path;

  return (
    <div>
      {/* Sticky publish bar */}
      <div className="sticky top-0 z-20 -mx-5 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/95 px-5 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/admin/cms/pages" className="mono-button text-muted-foreground transition-colors hover:text-foreground">
            ← PAGES
          </Link>
          <span className="hidden text-muted-foreground sm:inline">|</span>
          <p className="hidden max-w-[28ch] truncate text-[14px] font-medium text-foreground sm:block">
            {title || "Untitled page"}
          </p>
          <StatusPill status={isLive ? "published" : "draft"} />
          {mode === "edit" ? (
            <span className="mono-label hidden items-center gap-1.5 text-muted-foreground md:inline-flex" aria-live="polite">
              {dirty ? (
                <>
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  UNSAVED CHANGES
                </>
              ) : savedNotice ? (
                savedNotice.toUpperCase()
              ) : (
                "ALL CHANGES SAVED"
              )}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === "edit" && isLive && livePath ? (
            <Link href={livePath} target="_blank" className="btn-base btn-outline inline-flex items-center gap-1.5">
              View
              <Icon d={ICON.external} className="h-3.5 w-3.5" />
            </Link>
          ) : null}
          {isLive ? (
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => {
                if (window.confirm("Unpublish this page? It will be removed from the site and search engines will be notified.")) {
                  void save("unpublish");
                }
              }}
              className="btn-base btn-outline"
            >
              {saving === "unpublish" ? "Unpublishing…" : "Unpublish"}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving !== null || (mode === "edit" && !dirty)}
              onClick={() => void save("keep")}
              className="btn-base btn-outline"
              title="Save draft (⌘S)"
            >
              {saving === "keep" ? "Saving…" : "Save draft"}
            </button>
          )}
          <button
            type="button"
            disabled={saving !== null || (isLive && !dirty)}
            onClick={() => void save("publish")}
            className="btn-base btn-primary"
            title={isLive ? "Update live page (⌘S)" : "Publish"}
          >
            {saving === "publish" || (isLive && saving === "keep")
              ? isLive
                ? "Updating…"
                : "Publishing…"
              : isLive
                ? "Update"
                : "Publish"}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-md border border-[color:var(--app-destructive)] bg-[color:rgba(220,38,38,0.06)] px-3 py-2 text-[13px] text-[color:var(--app-destructive)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* ── Editor column ─────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <section className="card-flat space-y-4 p-5 sm:p-6">
            <div>
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Page title"
                aria-label="Page title"
                aria-invalid={titleInvalid}
                className={`w-full border-0 bg-transparent p-0 text-[28px] font-medium leading-tight tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50 ${
                  titleInvalid ? "placeholder:text-[color:var(--app-destructive)]" : ""
                }`}
              />
              <p
                className={`mt-2 truncate font-mono text-[12.5px] ${
                  pathError ? "text-[color:var(--app-destructive)]" : "text-muted-foreground"
                }`}
                title={`${siteHost}${previewPath}`}
              >
                {siteHost}
                <span className="text-foreground/80">{previewPath}</span>
              </p>
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="mono-label text-muted-foreground">Excerpt</span>
                <AiGenerateButton<string>
                  task="excerpt"
                  variant="inline"
                  context={{ title, bodyText: extractTextFromCmsBlocks(blocks) }}
                  onResult={setExcerpt}
                  disabled={!title.trim() && blocks.length === 0}
                />
              </div>
              <textarea
                className={INPUT}
                rows={2}
                value={excerpt}
                placeholder="One or two sentences — used in cards, link previews and as the fallback meta description."
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>
          </section>

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
                            pageTitle={title}
                            pageContext={excerpt}
                            pageFocusKeyword={focusKeyword || targetKeyword}
                            pageSecondaryKeywords={secondaryKeywords}
                            onChange={(patch) => updateBlock(block.id, patch)}
                          />
                        </div>
                      )}
                    </div>
                    {index < blocks.length - 1 ? (
                      <BlockInserter
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
                prominent
                open={inserterAt === blocks.length}
                onOpen={() => setInserterAt(blocks.length)}
                onClose={() => setInserterAt(null)}
                onPick={(t) => insertBlock(blocks.length, t)}
              />
            </div>
          </section>

          <section className="card-flat space-y-5 p-5 sm:p-6" aria-labelledby="search-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="search-heading" className="display-sm text-foreground">
                  Search appearance
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">How this page shows up in Google and AI answers.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-base btn-outline"
                  onClick={generateSeo}
                  disabled={!title.trim() && !excerpt.trim() && blocks.length === 0}
                >
                  From content
                </button>
                <AiGenerateButton<{ metaTitle: string; metaDescription: string }>
                  task="seoMetaPair"
                  context={{
                    title,
                    focusKeyword: focusKeyword || targetKeyword,
                    bodyText: extractTextFromCmsBlocks(blocks) || excerpt,
                  }}
                  onResult={({ metaTitle: mt, metaDescription: md }) => {
                    setMetaTitle(mt);
                    setMetaDescription(md);
                  }}
                  label="Write with AI"
                  disabled={!title.trim() && !excerpt.trim() && blocks.length === 0}
                />
              </div>
            </div>

            <SerpPreview
              siteUrl={siteUrl}
              path={previewPath}
              title={(metaTitle.trim() || title || "Page title") + (siteName ? ` | ${siteName}` : "")}
              description={metaDescription || excerpt}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="flex items-center justify-between gap-2">
                  <span className="mono-label text-muted-foreground">Meta title</span>
                  <CharCount value={(metaTitle || title).length} max={60} />
                </span>
                <input
                  className={INPUT}
                  value={metaTitle}
                  placeholder={title || "Defaults to page title"}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="flex items-center justify-between gap-2">
                  <span className="mono-label text-muted-foreground">Meta description</span>
                  <CharCount value={metaDescription.length} max={160} />
                </span>
                <textarea
                  className={INPUT}
                  rows={3}
                  value={metaDescription}
                  placeholder="Write or generate from page content"
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mono-label text-muted-foreground">Focus keyword</span>
                <input
                  className={INPUT}
                  value={focusKeyword}
                  placeholder="e.g. crm development"
                  onChange={(e) => setFocusKeyword(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mono-label text-muted-foreground">Brief target keyword</span>
                <input
                  className={INPUT}
                  value={targetKeyword}
                  placeholder={focusKeyword || "Defaults to focus keyword"}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="mono-label text-muted-foreground">Secondary keywords</span>
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
                  className={INPUT}
                  value={secondaryKeywords}
                  placeholder="Comma-separated"
                  onChange={(e) => setSecondaryKeywords(e.target.value)}
                />
              </label>
            </div>

            <details className="group rounded-md border border-border/70">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5">
                <span className="mono-label text-muted-foreground">Advanced — canonical & custom schema</span>
                <span className="text-muted-foreground transition-transform group-open:rotate-180">
                  <Icon d={ICON.chevron} />
                </span>
              </summary>
              <div className="space-y-4 border-t border-border/70 p-3">
                <label className="block text-sm">
                  <span className="mono-label text-muted-foreground">Canonical URL override</span>
                  <input
                    className={`${INPUT} font-mono text-[13px]`}
                    value={canonical}
                    placeholder={`${siteUrl.replace(/\/$/, "")}${previewPath}`}
                    onChange={(e) => setCanonical(e.target.value)}
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Leave blank (self-canonical). Only set this when the page duplicates another URL — it is then
                    left out of the sitemap and llms.txt.
                  </span>
                </label>
                <label className="block text-sm">
                  <span className="mono-label text-muted-foreground">Custom JSON-LD</span>
                  <textarea
                    className={`${INPUT} font-mono text-[12px]`}
                    rows={6}
                    value={jsonLdCustom}
                    placeholder={'{ "@context": "https://schema.org", "@type": "HowTo", ... }'}
                    onChange={(e) => setJsonLdCustom(e.target.value)}
                    spellCheck={false}
                  />
                  <span
                    className={`mt-1 block text-xs ${jsonLdError ? "text-[color:var(--app-destructive)]" : "text-muted-foreground"}`}
                  >
                    {jsonLdError ??
                      "Appended after the auto-generated WebPage, Service/Article, Breadcrumb and FAQ schema."}
                  </span>
                </label>
              </div>
            </details>
          </section>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pb-2">
          <div role="tablist" aria-label="Sidebar" className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-1">
            {(
              [
                { id: "page", label: "PAGE" },
                { id: "seo", label: `SEO · ${seoSummary.passed}/${seoSummary.total}` },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={sidebarTab === t.id}
                onClick={() => setSidebarTab(t.id)}
                className={`mono-button flex-1 rounded-sm px-3 py-1.5 transition-colors ${
                  sidebarTab === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {sidebarTab === "seo" ? (
            <SeoAnalysisSidebar {...seoProps} />
          ) : (
            <>
              <Card title="PUBLISH">
                <Row label="Status" value={isLive ? "Published" : "Draft"} />
                <Row label="Words" value={wordCount.toLocaleString()} />
                <Row label="Blocks" value={blocks.length} />
                <SidebarField label="Page type" hint={typeMeta?.hint ?? "Legacy type — pick a current one."}>
                  <select className={SIDEBAR_INPUT} value={type} onChange={(e) => setType(e.target.value)}>
                    {PAGE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                    {typeMeta ? null : <option value={type}>{type}</option>}
                  </select>
                </SidebarField>
              </Card>

              <Card
                title="URL"
                action={
                  mode === "create" && slugTouched ? (
                    <button
                      type="button"
                      className="mono-label text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setSlugTouched(false);
                        setSlug(slugify(title));
                      }}
                    >
                      Reset
                    </button>
                  ) : null
                }
              >
                <SidebarField label="Slug">
                  <input
                    className={`${SIDEBAR_INPUT} font-mono`}
                    value={slug}
                    placeholder="auto from title"
                    onChange={(e) => onSlugChange(e.target.value)}
                  />
                </SidebarField>
                <SidebarField
                  label="Custom path"
                  hint={
                    pathError ? (
                      <span className="text-[color:var(--app-destructive)]">{pathError}</span>
                    ) : pathMoved ? (
                      "The old URL will 301-redirect here automatically."
                    ) : (
                      "Optional. Leave blank to use the page type's folder."
                    )
                  }
                >
                  <input
                    className={`${SIDEBAR_INPUT} font-mono`}
                    value={path}
                    placeholder={pathFor(type as PageType, slug || title)}
                    onChange={(e) => setPath(e.target.value)}
                  />
                </SidebarField>
              </Card>

              <Card title="SOCIAL IMAGE">
                <ImageUploadField
                  label="Share image (1200×630)"
                  value={ogImageUrl}
                  onChange={setOgImageUrl}
                  helpText="Link previews, image sitemap and JSON-LD. Falls back to the site image."
                />
              </Card>

              <Card title="INDEXING">
                <Toggle
                  checked={robotsIndex}
                  onChange={setRobotsIndex}
                  label="Show in search engines"
                  description="Off adds noindex and removes the page from the sitemap and llms.txt."
                />
                <Toggle
                  checked={robotsFollow}
                  onChange={setRobotsFollow}
                  label="Follow links"
                  description="Let crawlers follow links on this page."
                />
                <SidebarField
                  label="Breadcrumb label"
                  hint={type === "LOCATION" ? "Also used as the Service “area served”." : undefined}
                >
                  <input
                    className={SIDEBAR_INPUT}
                    value={breadcrumbLabel}
                    placeholder={title || "Defaults to page title"}
                    onChange={(e) => setBreadcrumbLabel(e.target.value)}
                  />
                </SidebarField>
                {ARTICLE_LIKE.has(type) ? (
                  <SidebarField label="Author" hint="A named expert strengthens E-E-A-T for guides and comparisons.">
                    <input
                      className={SIDEBAR_INPUT}
                      value={authorName}
                      placeholder="Defaults to the organisation"
                      onChange={(e) => setAuthorName(e.target.value)}
                    />
                  </SidebarField>
                ) : null}
              </Card>
            </>
          )}
        </aside>
      </div>

      {linkSuggestions?.length || linkSuggestionsLoading ? (
        <div className="sticky bottom-0 z-10 -mx-5 mt-6 border-t border-border bg-background/95 px-5 backdrop-blur lg:-mx-8 lg:px-8">
          <SuggestedLinksBar
            suggestions={linkSuggestions}
            loading={linkSuggestionsLoading}
            onInsert={insertLinkSuggestion}
          />
        </div>
      ) : null}
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
