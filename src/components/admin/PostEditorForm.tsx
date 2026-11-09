"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BlogPost } from "@/lib/content";
import {
  TECH_NEWS_CATEGORIES,
  type TechNewsCategory,
  type TechNewsPost,
} from "@/lib/tech-news-content";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { BlogEditorInsights } from "@/components/admin/BlogEditorInsights";
import { BlogPostPreview } from "@/components/admin/BlogPostPreview";
import { SerpPreview } from "@/components/admin/SerpPreview";
import { SocialPreview } from "@/components/admin/SocialPreview";
import { TagInput } from "@/components/admin/TagInput";
import { AiGenerateButton } from "@/components/admin/AiGenerateButton";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { generateSeoFromContent, stripHtmlToText } from "@/lib/seo-generate";
import { countWords, readTimeFromWordCount } from "@/lib/blog-server";
import { slugify } from "@/lib/slug";
import { Card, Row, SidebarField, StatusPill } from "@/components/admin/EditorPanels";

type PostStatus = "draft" | "published";

/**
 * Editor for article-style content (blog posts and tech-news stories). Everything that differs
 * between kinds lives in `POST_KINDS`; kind-specific fields (blog tags, tech-news dek + category)
 * are toggled by `kind`.
 */
export type PostEditorProps =
  | { kind: "blog"; post?: BlogPost; siteUrl: string; siteName: string }
  | { kind: "tech-news"; post?: TechNewsPost; siteUrl: string; siteName: string };

type DraftFields = Partial<BlogPost & TechNewsPost>;

const POST_KINDS = {
  blog: {
    publicBase: "/blog",
    adminBase: "/admin/blog",
    apiBase: "/api/admin/content/blog",
    backLabel: "← BLOG",
    newLabel: "New post",
    kicker: "BLOG",
    titlePlaceholder: "Write a title that names the outcome…",
    focusKeywordPlaceholder: "e.g. mvp vs full product",
    seoHint: "Live Google and social previews. Generate meta from the post body anytime.",
    authorHint: "USED IN ARTICLE SCHEMA + AUTHOR BYLINE",
  },
  "tech-news": {
    publicBase: "/tech-news",
    adminBase: "/admin/tech-news",
    apiBase: "/api/admin/content/tech-news",
    backLabel: "← TECH NEWS",
    newLabel: "New story",
    kicker: "TECH NEWS",
    titlePlaceholder: "Write a headline that names what changed…",
    focusKeywordPlaceholder: "e.g. post-quantum tls",
    seoHint: "Live Google and social previews. Generate meta from the story body anytime.",
    authorHint: "USED IN ARTICLE SCHEMA + BYLINE",
  },
} as const;

type Tab = "write" | "preview" | "seo";

function readLocalDraft(key: string): DraftFields | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as DraftFields) : null;
  } catch {
    return null;
  }
}

export function PostEditorForm(props: PostEditorProps) {
  const { kind, siteUrl, siteName } = props;
  const post: DraftFields | undefined = props.post;
  const cfg = POST_KINDS[kind];
  const isBlog = kind === "blog";

  const router = useRouter();
  const isNew = !post;
  const draftKey = `torq.admin.${kind}.draft.${post?.slug ?? "new"}`;
  const savedDraft = isNew ? readLocalDraft(draftKey) : null;

  const [tab, setTab] = useState<Tab>("write");
  const [slug, setSlug] = useState(post?.slug ?? savedDraft?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew || !!savedDraft?.slug);
  const [title, setTitle] = useState(post?.title ?? savedDraft?.title ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? savedDraft?.seoTitle ?? "");
  const [description, setDescription] = useState(post?.description ?? savedDraft?.description ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? savedDraft?.excerpt ?? "");
  const [date, setDate] = useState(post?.date ?? new Date().toISOString().slice(0, 10));
  const [readTime, setReadTime] = useState(post?.readTime ?? "5 min read");
  const [readTimeTouched, setReadTimeTouched] = useState(!isNew);
  const [authorName, setAuthorName] = useState(post?.authorName ?? "");
  const [body, setBody] = useState(post?.body ?? savedDraft?.body ?? "");
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? savedDraft?.coverImage ?? "");
  const [focusKeyword, setFocusKeyword] = useState(post?.focusKeyword ?? savedDraft?.focusKeyword ?? "");
  // Blog-only
  const [tags, setTags] = useState<string[]>(post?.tags ?? savedDraft?.tags ?? []);
  // Tech-news-only
  const [dek, setDek] = useState(post?.dek ?? savedDraft?.dek ?? "");
  const [category, setCategory] = useState<TechNewsCategory>(post?.category ?? savedDraft?.category ?? "AI & ML");

  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<"draft" | "publish" | "save" | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const wordCount = useMemo(() => countWords(body), [body]);
  const effectiveSlug = slugTouched ? slug : slugify(title);
  const effectiveReadTime = readTimeTouched ? readTime : readTimeFromWordCount(wordCount);
  const kindFields = useMemo(() => (isBlog ? { tags } : { dek, category }), [isBlog, tags, dek, category]);
  const bodyText = stripHtmlToText(body);
  const noContent = !title.trim() && !body.trim();

  function generateSeo() {
    const generated = generateSeoFromContent({
      title,
      excerpt: excerpt || description,
      bodyText,
      focusKeyword,
    });
    setSeoTitle(generated.metaTitle);
    setDescription(generated.metaDescription);
    if (!excerpt.trim()) setExcerpt(generated.metaDescription);
    setTab("seo");
  }

  function applyAiMeta({ metaTitle, metaDescription }: { metaTitle: string; metaDescription: string }) {
    setSeoTitle(metaTitle);
    setDescription(metaDescription);
  }

  // Draft autosave to localStorage (new posts only)
  const skipFirstAutosave = useRef(true);
  useEffect(() => {
    if (!isNew || typeof window === "undefined") return;
    if (skipFirstAutosave.current) {
      skipFirstAutosave.current = false;
      return;
    }
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          title,
          description,
          excerpt,
          seoTitle,
          body,
          slug: effectiveSlug,
          coverImage,
          focusKeyword,
          ...kindFields,
        }),
      );
    } catch {
      /* storage full or blocked — autosave is best-effort */
    }
  }, [isNew, title, description, excerpt, seoTitle, body, effectiveSlug, coverImage, focusKeyword, kindFields, draftKey]);

  const submit = useCallback(
    async (nextStatus: PostStatus) => {
      setError("");
      setSuccessMsg("");
      setSaving(true);
      setPendingAction(isNew ? (nextStatus === "draft" ? "draft" : "publish") : "save");
      const res = await fetch(post?.slug ? `${cfg.apiBase}/${encodeURIComponent(post.slug)}` : cfg.apiBase, {
        method: post ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: effectiveSlug || undefined,
          title,
          seoTitle: seoTitle.trim() || undefined,
          description,
          excerpt: excerpt.trim() || undefined,
          date,
          readTime: effectiveReadTime,
          body,
          authorName: authorName.trim() || undefined,
          status: nextStatus,
          coverImage: coverImage.trim() || undefined,
          focusKeyword: focusKeyword.trim() || undefined,
          ...kindFields,
        }),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      setSaving(false);
      setPendingAction(null);
      if (!res?.ok) {
        setError(data.error || "Save failed");
        return;
      }
      setStatus(nextStatus);
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* noop */
      }
      if (isNew && data?.slug) {
        router.push(`${cfg.adminBase}/${encodeURIComponent(data.slug)}/edit`);
      } else {
        setSuccessMsg(nextStatus === "published" ? "Saved and published." : "Draft saved.");
      }
      router.refresh();
    },
    [
      isNew,
      post,
      cfg,
      effectiveSlug,
      title,
      seoTitle,
      description,
      excerpt,
      date,
      effectiveReadTime,
      body,
      authorName,
      coverImage,
      focusKeyword,
      kindFields,
      draftKey,
      router,
    ],
  );

  const bodyBrief = [
    description,
    !isBlog && dek,
    focusKeyword && `Focus keyword: ${focusKeyword}`,
    isBlog ? tags.length > 0 && `Tags: ${tags.join(", ")}` : `Category: ${category}`,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(status);
      }}
    >
      {/* Sticky publish bar */}
      <div className="sticky top-0 z-20 -mx-5 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/95 px-5 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={cfg.adminBase} className="mono-button text-muted-foreground transition-colors hover:text-foreground">
            {cfg.backLabel}
          </Link>
          <span className="hidden text-muted-foreground sm:inline">|</span>
          <p className="hidden truncate text-[14px] font-medium text-foreground sm:block">
            {title || (isNew ? cfg.newLabel : post?.title)}
          </p>
          <StatusPill status={status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && post ? (
            <Link href={`${cfg.publicBase}/${post.slug}`} target="_blank" className="btn-base btn-outline">
              View
            </Link>
          ) : null}
          <button type="button" disabled={saving} onClick={() => submit("draft")} className="btn-base btn-outline">
            {saving && pendingAction === "draft" ? "Saving…" : "Save draft"}
          </button>
          <button type="button" disabled={saving} onClick={() => submit("published")} className="btn-base btn-primary">
            {saving && pendingAction === "publish" ? "Publishing…" : status === "published" ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-[color:var(--app-destructive)] bg-[color:rgba(220,38,38,0.06)] px-3 py-2 text-[13px] text-[color:var(--app-destructive)]">
          {error}
        </p>
      ) : null}
      {successMsg ? (
        <p className="mb-4 rounded-md border border-[color:var(--app-success)] bg-[color:rgba(5,150,105,0.06)] px-3 py-2 text-[13px] text-[color:var(--app-success)]">
          {successMsg}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Editor column */}
        <div className="min-w-0 space-y-5">
          <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-1">
            {(["write", "preview", "seo"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`mono-button rounded-sm px-3 py-1.5 transition-colors ${
                  tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
            <span className="ml-auto mr-2 mono-label text-muted-foreground">
              {wordCount.toLocaleString()} WORDS · {effectiveReadTime.toUpperCase()}
            </span>
          </div>

          {tab === "write" ? (
            <div className="space-y-5">
              <Field
                label="Title"
                hint="The on-page H1. 50–60 chars works best in search."
                charCount={title.length}
                softMax={65}
              >
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="text-input text-[18px] font-medium"
                  placeholder={cfg.titlePlaceholder}
                />
              </Field>

              {!isBlog ? (
                <Field
                  label="Dek"
                  hint="Short subtitle shown between the headline and the excerpt."
                  charCount={dek.length}
                  softMax={140}
                >
                  <textarea
                    value={dek}
                    onChange={(e) => setDek(e.target.value)}
                    rows={2}
                    className="text-input"
                    placeholder="One sentence on why this matters."
                  />
                </Field>
              ) : null}

              <Field
                label="Description (meta)"
                hint="Shown in Google & social cards. 120–160 chars is ideal."
                charCount={description.length}
                softMax={160}
              >
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="text-input"
                  placeholder="Promise the reader something concrete and unique."
                />
              </Field>

              <Field label="Body" hint="Rich text: H2–H3, lists, blockquote, code, links. Don't add another H1.">
                <div className="mb-2 flex justify-end">
                  <AiGenerateButton<string>
                    task="longFormBody"
                    variant="inline"
                    context={{ title, contentType: kind, brief: bodyBrief }}
                    onResult={setBody}
                    disabled={!title.trim()}
                  />
                </div>
                <div className="mt-1">
                  <RichTextEditor
                    value={body}
                    onChange={setBody}
                    placeholder="Open with the takeaway. Use H2/H3 for sections."
                    minHeight="28rem"
                  />
                </div>
              </Field>
            </div>
          ) : null}

          {tab === "preview" ? (
            <BlogPostPreview
              title={title}
              description={(!isBlog && dek) || description}
              date={date}
              readTime={effectiveReadTime}
              authorName={authorName.trim()}
              bodyHtml={body}
            />
          ) : null}

          {tab === "seo" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{cfg.seoHint}</p>
                <div className="flex items-center gap-2">
                  <button type="button" className="btn-base btn-secondary" onClick={generateSeo} disabled={noContent}>
                    Generate from content
                  </button>
                  <AiGenerateButton<{ metaTitle: string; metaDescription: string }>
                    task="seoMetaPair"
                    context={{ title, focusKeyword, bodyText: bodyText || excerpt || description }}
                    onResult={applyAiMeta}
                    label="Generate with AI"
                    disabled={noContent}
                  />
                </div>
              </div>
              <SerpPreview
                siteUrl={siteUrl}
                path={effectiveSlug ? `${cfg.publicBase}/${effectiveSlug}` : cfg.publicBase}
                title={(seoTitle.trim() || title) + (siteName ? ` | ${siteName}` : "")}
                description={description}
              />
              <SocialPreview
                siteUrl={siteUrl}
                path={`${cfg.publicBase}/${effectiveSlug || "your-slug"}`}
                title={seoTitle.trim() || title}
                description={description}
                coverImage={coverImage.trim() || undefined}
                siteName={siteName}
                kicker={cfg.kicker}
              />
              <BlogEditorInsights
                title={title}
                description={description}
                bodyHtml={body}
                focusKeyword={focusKeyword}
                slug={effectiveSlug}
                hasCoverImage={!!coverImage.trim()}
              />
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <Card title="PUBLISH">
            <Row label="Status" value={status === "published" ? "Published" : "Draft"} />
            <Row
              label="Date"
              control={
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-input w-auto px-2 py-1 text-[13px]"
                />
              }
            />
            <Row
              label="Read time"
              control={
                <input
                  type="text"
                  value={readTime}
                  onChange={(e) => {
                    setReadTime(e.target.value);
                    setReadTimeTouched(true);
                  }}
                  placeholder="auto"
                  className="text-input w-28 px-2 py-1 text-[13px]"
                />
              }
            />
            {post?.dateUpdated ? (
              <Row label="Last updated" value={new Date(post.dateUpdated).toLocaleString()} />
            ) : null}
            <Row label="Word count" value={wordCount.toLocaleString()} />
          </Card>

          <Card title="URL">
            <label className="mono-label block text-muted-foreground" htmlFor="slug-input">
              SLUG
            </label>
            <input
              id="slug-input"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="auto-generated from title"
              className="text-input mt-1.5 text-[13px]"
            />
            {effectiveSlug ? (
              <p className="mono-label mt-2 truncate text-muted-foreground">
                {cfg.publicBase.toUpperCase()}/{effectiveSlug.toUpperCase()}
              </p>
            ) : null}
          </Card>

          {!isBlog ? (
            <Card title="CATEGORY">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TechNewsCategory)}
                className="text-input text-[13px]"
              >
                {TECH_NEWS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Card>
          ) : null}

          <Card title="SEO">
            <div className="flex gap-2">
              <button type="button" className="btn-base btn-secondary mb-3 w-full" onClick={generateSeo} disabled={noContent}>
                Generate from content
              </button>
              <AiGenerateButton<{ metaTitle: string; metaDescription: string }>
                task="seoMetaPair"
                variant="inline"
                context={{ title, focusKeyword, bodyText: bodyText || excerpt || description }}
                onResult={applyAiMeta}
                label="AI"
                disabled={noContent}
              />
            </div>
            <SidebarField label="SEO TITLE">
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Defaults to title"
                className="text-input text-[13px]"
              />
              <p className="mono-label mt-1 text-muted-foreground">{seoTitle.length || title.length} / 60 CHARS</p>
            </SidebarField>
            <SidebarField label="EXCERPT (CARDS)">
              <div className="mb-1 flex justify-end">
                <AiGenerateButton<string>
                  task="excerpt"
                  variant="inline"
                  context={{ title, bodyText: bodyText || description }}
                  onResult={setExcerpt}
                  disabled={noContent}
                />
              </div>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                placeholder="Defaults to description"
                className="text-input text-[13px]"
              />
            </SidebarField>
            <SidebarField label="FOCUS KEYWORD">
              <input
                type="text"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder={cfg.focusKeywordPlaceholder}
                className="text-input text-[13px]"
              />
              <p className="mono-label mt-1 text-muted-foreground">USED FOR CONTENT-SCORE CHECKS ONLY</p>
            </SidebarField>
            {isBlog ? (
              <SidebarField label="TAGS">
                <div className="mb-1 flex justify-end">
                  <AiGenerateButton<{ keywords: string[] }>
                    task="keywordSuggestions"
                    variant="inline"
                    label="Suggest"
                    context={{ title, bodyText: bodyText || description }}
                    onResult={({ keywords }) => setTags(Array.from(new Set([...tags, ...keywords])))}
                    disabled={noContent}
                  />
                </div>
                <TagInput value={tags} onChange={setTags} />
              </SidebarField>
            ) : null}
            <SidebarField label="COVER IMAGE">
              <ImageUploadField
                value={coverImage}
                onChange={setCoverImage}
                placeholder="https://…/cover.jpg"
                previewClassName="mt-2 aspect-[1200/630] w-full rounded-[var(--radius-sm)] border border-border object-cover"
              />
            </SidebarField>
          </Card>

          <Card title="AUTHOR">
            <SidebarField label="DISPLAY NAME">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={`Defaults to ${siteName}`}
                className="text-input text-[13px]"
              />
              <p className="mono-label mt-1 text-muted-foreground">{cfg.authorHint}</p>
            </SidebarField>
          </Card>
        </aside>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  charCount,
  softMax,
  children,
}: {
  label: string;
  hint?: string;
  charCount?: number;
  softMax?: number;
  children: React.ReactNode;
}) {
  const over = typeof charCount === "number" && typeof softMax === "number" && charCount > softMax;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="mono-label text-muted-foreground">{label.toUpperCase()}</label>
        {typeof charCount === "number" && typeof softMax === "number" ? (
          <span className={`mono-label tabular-nums ${over ? "text-[color:var(--app-destructive)]" : "text-muted-foreground"}`}>
            {charCount} / ~{softMax}
          </span>
        ) : null}
      </div>
      <div className="mt-1.5">{children}</div>
      {hint ? <p className="mt-1.5 text-[12.5px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
