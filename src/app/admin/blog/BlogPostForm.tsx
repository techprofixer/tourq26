"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BlogPost, BlogStatus } from "@/lib/content";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { BlogEditorInsights } from "@/components/admin/BlogEditorInsights";
import { BlogPostPreview } from "@/components/admin/BlogPostPreview";
import { SerpPreview } from "@/components/admin/SerpPreview";
import { SocialPreview } from "@/components/admin/SocialPreview";
import { TagInput } from "@/components/admin/TagInput";
import { AiGenerateButton } from "@/components/admin/AiGenerateButton";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { generateSeoFromContent, stripHtmlToText } from "@/lib/seo-generate";

type Props = {
  post?: BlogPost;
  siteUrl: string;
  siteName: string;
};

type Tab = "write" | "preview" | "seo";

function slugify(value: string) {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function stripHtml(html: string) {
  return stripHtmlToText(html);
}

function deriveReadTime(html: string) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

function readLocalDraft(key: string): Partial<BlogPost> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<BlogPost>) : null;
  } catch {
    return null;
  }
}

export function BlogPostForm({ post, siteUrl, siteName }: Props) {
  const router = useRouter();
  const isNew = !post;
  const draftKey = `torq.admin.blog.draft.${post?.slug ?? "new"}`;
  const savedDraft = isNew ? readLocalDraft(draftKey) : null;

  const [tab, setTab] = useState<Tab>("write");
  const [slug, setSlug] = useState(post?.slug ?? savedDraft?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew || !!savedDraft?.slug);
  const [title, setTitle] = useState(post?.title ?? savedDraft?.title ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? savedDraft?.seoTitle ?? "");
  const [description, setDescription] = useState(
    post?.description ?? savedDraft?.description ?? "",
  );
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? savedDraft?.excerpt ?? "");
  const [date, setDate] = useState(post?.date ?? new Date().toISOString().slice(0, 10));
  const [readTime, setReadTime] = useState(post?.readTime ?? "5 min read");
  const [readTimeTouched, setReadTimeTouched] = useState(!isNew);
  const [authorName, setAuthorName] = useState(post?.authorName ?? "");
  const [body, setBody] = useState(post?.body ?? savedDraft?.body ?? "");
  const [status, setStatus] = useState<BlogStatus>(post?.status ?? "draft");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? savedDraft?.coverImage ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? savedDraft?.tags ?? []);
  const [focusKeyword, setFocusKeyword] = useState(
    post?.focusKeyword ?? savedDraft?.focusKeyword ?? "",
  );

  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<"draft" | "publish" | "save" | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const effectiveSlug = slugTouched ? slug : slugify(title);
  const effectiveReadTime = readTimeTouched ? readTime : deriveReadTime(body);

  function generateSeo() {
    const generated = generateSeoFromContent({
      title,
      excerpt: excerpt || description,
      bodyText: stripHtml(body),
      focusKeyword,
    });
    setSeoTitle(generated.metaTitle);
    setDescription(generated.metaDescription);
    if (!excerpt.trim()) {
      setExcerpt(generated.metaDescription);
    }
    setTab("seo");
  }

  // Draft autosave to localStorage (new posts only)
  const skipFirstAutosave = useRef(true);
  useEffect(() => {
    if (!isNew || typeof window === "undefined") return;
    if (skipFirstAutosave.current) {
      skipFirstAutosave.current = false;
      return;
    }
    const payload = {
      title,
      description,
      excerpt,
      seoTitle,
      body,
      slug: effectiveSlug,
      tags,
      coverImage,
      focusKeyword,
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(payload));
    } catch {
      /* noop */
    }
  }, [
    isNew,
    title,
    description,
    excerpt,
    seoTitle,
    body,
    effectiveSlug,
    tags,
    coverImage,
    focusKeyword,
    draftKey,
  ]);

  const submit = useCallback(
    async (nextStatus: BlogStatus) => {
      setError("");
      setSuccessMsg("");
      setSaving(true);
      setPendingAction(isNew ? (nextStatus === "draft" ? "draft" : "publish") : "save");
      const url = post
        ? `/api/admin/content/blog/${encodeURIComponent(post.slug)}`
        : "/api/admin/content/blog";
      const method = post ? "PUT" : "POST";
      const payload = {
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
        tags,
        focusKeyword: focusKeyword.trim() || undefined,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      setSaving(false);
      setPendingAction(null);
      if (!res.ok) {
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
        router.push(`/admin/blog/${encodeURIComponent(data.slug)}/edit`);
        router.refresh();
      } else {
        setSuccessMsg(
          nextStatus === "published"
            ? "Saved and published."
            : "Draft saved.",
        );
        router.refresh();
      }
    },
    [
      isNew,
      post,
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
      tags,
      focusKeyword,
      draftKey,
      router,
    ],
  );

  const wordCount = useMemo(() => stripHtml(body).split(/\s+/).filter(Boolean).length, [body]);

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
          <Link
            href="/admin/blog"
            className="mono-button text-muted-foreground transition-colors hover:text-foreground"
          >
            ← BLOG
          </Link>
          <span className="hidden text-muted-foreground sm:inline">|</span>
          <p className="hidden truncate text-[14px] font-medium text-foreground sm:block">
            {title || (isNew ? "New post" : post?.title)}
          </p>
          <StatusPill status={status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && post ? (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              className="btn-base btn-outline"
            >
              View
            </Link>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => submit("draft")}
            className="btn-base btn-outline"
          >
            {saving && pendingAction === "draft" ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => submit("published")}
            className="btn-base btn-primary"
          >
            {saving && pendingAction === "publish"
              ? "Publishing…"
              : status === "published"
                ? "Update"
                : "Publish"}
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
                  tab === t
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
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
                  placeholder="Write a title that names the outcome…"
                />
              </Field>

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

              <Field
                label="Body"
                hint="Rich text: H2–H3, lists, blockquote, code, links. Don't add another H1."
              >
                <div className="mb-2 flex justify-end">
                  <AiGenerateButton<string>
                    task="longFormBody"
                    variant="inline"
                    context={{
                      title,
                      contentType: "blog",
                      brief: [description, focusKeyword && `Focus keyword: ${focusKeyword}`, tags.length && `Tags: ${tags.join(", ")}`]
                        .filter(Boolean)
                        .join(". "),
                    }}
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
              description={description}
              date={date}
              readTime={effectiveReadTime}
              authorName={authorName.trim()}
              bodyHtml={body}
            />
          ) : null}

          {tab === "seo" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Live Google and social previews. Generate meta from the post body anytime.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-base btn-secondary"
                    onClick={generateSeo}
                    disabled={!title.trim() && !body.trim()}
                  >
                    Generate from content
                  </button>
                  <AiGenerateButton<{ metaTitle: string; metaDescription: string }>
                    task="seoMetaPair"
                    context={{ title, focusKeyword, bodyText: stripHtml(body) || excerpt || description }}
                    onResult={({ metaTitle, metaDescription }) => {
                      setSeoTitle(metaTitle);
                      setDescription(metaDescription);
                    }}
                    label="Generate with AI"
                    disabled={!title.trim() && !body.trim()}
                  />
                </div>
              </div>
              <SerpPreview
                siteUrl={siteUrl}
                path={effectiveSlug ? `/blog/${effectiveSlug}` : "/blog"}
                title={(seoTitle.trim() || title) + (siteName ? ` | ${siteName}` : "")}
                description={description}
              />
              <SocialPreview
                siteUrl={siteUrl}
                slug={effectiveSlug}
                title={seoTitle.trim() || title}
                description={description}
                coverImage={coverImage.trim() || undefined}
                siteName={siteName}
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
              <Row
                label="Last updated"
                value={new Date(post.dateUpdated).toLocaleString()}
              />
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
                /BLOG/{effectiveSlug.toUpperCase()}
              </p>
            ) : null}
          </Card>

          <Card title="SEO">
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-base btn-secondary mb-3 w-full"
                onClick={generateSeo}
                disabled={!title.trim() && !body.trim()}
              >
                Generate from content
              </button>
              <AiGenerateButton<{ metaTitle: string; metaDescription: string }>
                task="seoMetaPair"
                variant="inline"
                context={{ title, focusKeyword, bodyText: stripHtml(body) || excerpt || description }}
                onResult={({ metaTitle, metaDescription }) => {
                  setSeoTitle(metaTitle);
                  setDescription(metaDescription);
                }}
                label="AI"
                disabled={!title.trim() && !body.trim()}
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
              <p className="mono-label mt-1 text-muted-foreground">
                {seoTitle.length || title.length} / 60 CHARS
              </p>
            </SidebarField>
            <SidebarField label="EXCERPT (CARDS)">
              <div className="mb-1 flex justify-end">
                <AiGenerateButton<string>
                  task="excerpt"
                  variant="inline"
                  context={{ title, bodyText: stripHtml(body) || description }}
                  onResult={setExcerpt}
                  disabled={!title.trim() && !body.trim()}
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
                placeholder="e.g. mvp vs full product"
                className="text-input text-[13px]"
              />
              <p className="mono-label mt-1 text-muted-foreground">
                USED FOR CONTENT-SCORE CHECKS ONLY
              </p>
            </SidebarField>
            <SidebarField label="TAGS">
              <div className="mb-1 flex justify-end">
                <AiGenerateButton<{ keywords: string[] }>
                  task="keywordSuggestions"
                  variant="inline"
                  label="Suggest"
                  context={{ title, bodyText: stripHtml(body) || description }}
                  onResult={({ keywords }) => setTags(Array.from(new Set([...tags, ...keywords])))}
                  disabled={!title.trim() && !body.trim()}
                />
              </div>
              <TagInput value={tags} onChange={setTags} />
            </SidebarField>
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
              <p className="mono-label mt-1 text-muted-foreground">
                USED IN ARTICLE SCHEMA + AUTHOR BYLINE
              </p>
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
          <span
            className={`mono-label tabular-nums ${
              over ? "text-[color:var(--app-destructive)]" : "text-muted-foreground"
            }`}
          >
            {charCount} / ~{softMax}
          </span>
        ) : null}
      </div>
      <div className="mt-1.5">{children}</div>
      {hint ? <p className="mt-1.5 text-[12.5px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-flat p-4">
      <p className="mono-eyebrow text-muted-foreground">{title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  control,
}: {
  label: string;
  value?: string | number;
  control?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="mono-label text-muted-foreground">{label.toUpperCase()}</span>
      {control ? control : <span className="text-[13px] text-foreground">{value}</span>}
    </div>
  );
}

function SidebarField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mono-label text-muted-foreground">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: BlogStatus }) {
  const isPub = status === "published";
  return (
    <span
      className={`mono-label inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${
        isPub
          ? "bg-[color:var(--brand-mint)] text-[color:var(--app-fg)]"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          isPub ? "bg-[color:var(--app-success)]" : "bg-[color:var(--app-muted-fg)]"
        }`}
      />
      {isPub ? "LIVE" : "DRAFT"}
    </span>
  );
}
