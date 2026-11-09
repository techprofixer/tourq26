"use client";

import { useMemo, useRef, useState } from "react";
import { useAdminMutation } from "@/hooks/useAdminMutation";

type DocDto = { sourceId: string; title: string; url: string | null; chunkCount: number; updatedAt: string };

// Mirrors MAX_CUSTOM_CONTENT_LENGTH in src/lib/rag/custom-knowledge.ts — duplicated rather than
// imported so this client bundle never pulls in that (server-only, Prisma-importing) module.
const MAX_CONTENT_LENGTH = 200_000;
const CHUNK_SIZE_ESTIMATE = 1200; // matches chunkText()'s default in src/lib/rag/chunk.ts
const ACCEPTED_EXTENSIONS = [".txt", ".md", ".pdf"];

const inputClass =
  "mt-1.5 w-full rounded-sm border border-border bg-surface/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-[var(--app-primary)]";

function formatRelativeTime(iso: string): string {
  const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4 shrink-0" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V4h6v3m-8 0l1 13a1 1 0 001 1h6a1 1 0 001-1l1-13" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A1 1 0 003 19.5h18a1 1 0 00.89-1.64l-8.18-14a1 1 0 00-1.72 0z" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3 w-3 shrink-0" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l6-6m-4-2l1.5-1.5a3.54 3.54 0 115 5L16 12m-8 2l-1.5 1.5a3.54 3.54 0 105 5L13 19" />
    </svg>
  );
}

export function KnowledgeBaseClient({ initialDocs }: { initialDocs: DocDto[] }) {
  const [docs, setDocs] = useState<DocDto[]>(initialDocs);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [success, setSuccess] = useState("");
  const { saving, error, setError, run } = useAdminMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const overLimit = content.length > MAX_CONTENT_LENGTH;
  const chunkEstimate = Math.max(1, Math.ceil(content.length / CHUNK_SIZE_ESTIMATE));

  const urlError = useMemo(
    () => (url.trim() && !/^https?:\/\//i.test(url.trim()) ? "Must start with http:// or https://" : ""),
    [url],
  );

  const attachFile = (f: File) => {
    setError("");
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(`"${f.name}" isn't a .txt, .md, or .pdf file.`);
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const add = async () => {
    setSuccess("");
    const form = new FormData();
    form.set("title", title);
    form.set("url", url);
    form.set("content", content);
    if (file) form.set("file", file);

    const data = await run<{ sourceId: string; chunkCount?: number }>(
      () => fetch("/api/admin/knowledge-base", { method: "POST", body: form }),
      "Failed to add knowledge.",
    );
    if (!data) return;
    const chunkCount = typeof data.chunkCount === "number" ? data.chunkCount : chunkEstimate;
    setDocs((prev) => [
      { sourceId: data.sourceId, title, url: url || null, chunkCount, updatedAt: new Date().toISOString() },
      ...prev,
    ]);
    setSuccess(`Added "${title}" — embedded as ${chunkCount} chunk${chunkCount === 1 ? "" : "s"}.`);
    setTitle("");
    setUrl("");
    setContent("");
    clearFile();
  };

  const remove = async (doc: DocDto) => {
    if (!window.confirm(`Remove "${doc.title}" from the chat assistant's knowledge?`)) return;
    setDocs((prev) => prev.filter((d) => d.sourceId !== doc.sourceId));
    await fetch(`/api/admin/knowledge-base/${doc.sourceId}`, { method: "DELETE" });
  };

  const canSubmit = !saving && !!title.trim() && (!!content.trim() || !!file) && !overLimit && !urlError;

  return (
    <div className="mt-6 space-y-6">
      <section className="card-flat space-y-5">
        <div>
          <p className="mono-eyebrow text-muted-foreground/80">Knowledge entry</p>
          <h2 className="display-sm mt-1 text-foreground">Add knowledge</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="kb-title" className="text-sm font-medium text-foreground/90">
              Title
            </label>
            <input
              id="kb-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Refund policy"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="kb-url" className="text-sm font-medium text-foreground/90">
              Source URL <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="kb-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              aria-invalid={!!urlError}
              className={`${inputClass} ${urlError ? "border-destructive" : ""}`}
            />
            {urlError ? <p className="mt-1 text-xs text-destructive">{urlError}</p> : null}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="kb-content" className="text-sm font-medium text-foreground/90">
              Content
            </label>
            <p className={`text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}>
              {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()} chars
              {content.trim() && !file ? ` · ~${chunkEstimate} chunk${chunkEstimate === 1 ? "" : "s"}` : ""}
            </p>
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) attachFile(dropped);
            }}
            className={`mt-1.5 rounded-sm border transition-colors ${
              dragging ? "border-[var(--app-primary)] bg-[var(--app-primary-muted)]" : "border-border"
            }`}
          >
            <textarea
              id="kb-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Paste text here, or drag a .txt / .md / .pdf file anywhere in this box."
              className="block w-full resize-y bg-surface/50 px-3.5 py-2.5 text-sm text-foreground outline-none"
            />
          </div>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
            className="hidden"
            onChange={(e) => {
              const picked = e.target.files?.[0];
              if (picked) attachFile(picked);
            }}
          />
          {file ? (
            <div className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface/50 px-3 py-1.5 text-xs text-foreground">
              <IconFile />
              <span className="max-w-[16rem] truncate">{file.name}</span>
              <span className="text-muted-foreground">will be extracted on submit</span>
              <button
                type="button"
                onClick={clearFile}
                aria-label="Remove file"
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-base btn-outline inline-flex items-center gap-2"
            >
              <IconUpload />
              Upload .txt / .md / .pdf file
            </button>
          )}
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            <IconAlert />
            <span>{error}</span>
          </div>
        ) : null}
        {success ? (
          <div className="flex items-start gap-2 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-700">
            <IconCheck />
            <span>{success}</span>
          </div>
        ) : null}

        <button type="button" disabled={!canSubmit} onClick={add} className="btn-base btn-primary">
          {saving ? "Embedding…" : "Add to knowledge base"}
        </button>
      </section>

      <section className="card-flat space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="mono-eyebrow text-muted-foreground/80">Indexed manually</p>
            <h2 className="display-sm mt-1 text-foreground">Custom entries</h2>
          </div>
          <p className="mono-label text-muted-foreground">
            {docs.length} entr{docs.length === 1 ? "y" : "ies"}
          </p>
        </div>

        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No custom knowledge yet — anything added above will show up here.
          </p>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <div
                key={d.sourceId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border/60 bg-background/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
                  <p className="mono-label mt-0.5 flex flex-wrap items-center gap-x-2 text-muted-foreground">
                    <span>
                      {d.chunkCount} chunk{d.chunkCount === 1 ? "" : "s"}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{formatRelativeTime(d.updatedAt)}</span>
                    {d.url ? (
                      <>
                        <span aria-hidden>·</span>
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 underline hover:text-foreground"
                        >
                          <IconLink />
                          source
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(d)}
                  aria-label={`Delete "${d.title}"`}
                  className="btn-base btn-secondary inline-flex items-center gap-1.5 !px-2.5 !py-1.5 text-xs text-destructive"
                >
                  <IconTrash />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
