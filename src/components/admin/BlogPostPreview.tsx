"use client";

import { sanitizeBlogHtml } from "@/lib/blog-sanitize";
import { BLOCK_TYPE_OPTIONS, type CmsBlock } from "@/lib/cms/blocks";

type Props = {
  title: string;
  description: string;
  date: string;
  readTime: string;
  authorName: string;
  bodyHtml: string;
  coverImage?: { url: string; alt?: string; title?: string };
  /** Content blocks that follow the body on the live post. */
  blocks?: CmsBlock[];
};

function Html({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`blog-article ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(html) }} />;
}

/** Simplified, client-only rendering of one block — the live page uses `BlockRenderer` (a server
 *  component with full-width bands), so this shows the content and order, not the exact layout. */
function BlockPreview({ block }: { block: CmsBlock }) {
  switch (block.type) {
    case "summary":
      return (
        <ol className="list-decimal space-y-2 pl-5 text-foreground">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    case "contentSection":
      return (
        <>
          <Html html={block.bodyHtml} />
          {block.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.image.url}
              alt={block.image.alt ?? ""}
              title={block.image.title || undefined}
              className="mt-4 max-h-72 w-auto rounded-md border border-border"
            />
          ) : null}
        </>
      );
    case "featureGrid":
      return (
        <ul className="grid gap-3 sm:grid-cols-2">
          {block.items.map((item, i) => (
            <li key={i} className="rounded-md border border-border p-3">
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ul>
      );
    case "faq":
      return (
        <dl className="space-y-4">
          {block.items.map((item, i) => (
            <div key={i}>
              <dt className="font-medium text-foreground">{item.question}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                <Html html={item.answer} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case "cta":
      return (
        <>
          {block.body ? <Html html={block.body} /> : null}
          {block.primaryCtaLabel ? (
            <span className="btn-base btn-primary mt-3 inline-flex">{block.primaryCtaLabel}</span>
          ) : null}
        </>
      );
    case "entityGrid":
      return (
        <p className="text-sm text-muted-foreground">
          Live {block.kind.toLowerCase()} cards from Admin → CMS → Entities appear here.
        </p>
      );
    default:
      return null;
  }
}

export function BlogPostPreview({
  title,
  description,
  date,
  readTime,
  authorName,
  bodyHtml,
  coverImage,
  blocks = [],
}: Props) {
  return (
    <article className="rounded-xl border border-border bg-background p-6 text-left text-foreground">
      <p className="text-sm text-muted-foreground">
        {date} · {readTime}
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold text-foreground">{title || "Untitled"}</h1>
      {authorName ? (
        <p className="mt-2 text-sm text-muted-foreground">
          By <span className="text-foreground/90">{authorName}</span>
        </p>
      ) : null}
      <p className="mt-4 text-muted-foreground">{description}</p>
      {coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage.url}
          alt={coverImage.alt || title}
          title={coverImage.title || undefined}
          className="mt-6 aspect-[1200/630] w-full rounded-md border border-border object-cover"
        />
      ) : null}
      <Html html={bodyHtml} className="mt-8 border-t border-border/50 pt-8" />
      {blocks.map((block) => (
        <section key={block.id} className="mt-8 border-t border-border/50 pt-8">
          <p className="mono-label text-muted-foreground">
            {(BLOCK_TYPE_OPTIONS.find((o) => o.type === block.type)?.label ?? block.type).toUpperCase()}
          </p>
          {"heading" in block && block.heading ? (
            <h2 className="mb-3 mt-2 font-display text-xl font-semibold text-foreground">{block.heading}</h2>
          ) : null}
          <BlockPreview block={block} />
        </section>
      ))}
    </article>
  );
}
