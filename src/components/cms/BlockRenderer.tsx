import Image from "next/image";
import Link from "next/link";
import type { CmsBlock } from "@/lib/cms/blocks";
import { sanitizeBlogHtml } from "@/lib/blog-sanitize";
import { getEntityCatalogCards, ENTITY_HUB_PATH, type EntityCatalogKind } from "@/lib/entity-catalog";
import { ServiceSectionNav } from "@/components/marketing/ServiceSectionNav";
import { slugify } from "@/lib/slug";

type ContentSectionBlock = Extract<CmsBlock, { type: "contentSection" }>;
type Breadcrumb = { name: string; path: string };

/** A run of consecutive content sections, rendered as one article with a sticky section index. */
type RenderUnit = CmsBlock | { type: "article"; id: string; sections: ContentSectionBlock[] };

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/** `createDefaultBlock` seeds eyebrows like "02 · SECTION"; the section index already numbers
 *  sections, so those placeholders add noise rather than meaning. Custom eyebrows still render. */
function isPlaceholderEyebrow(eyebrow?: string): boolean {
  return !eyebrow || /^\d{1,2}\s*·\s*SECTION$/i.test(eyebrow.trim());
}

function groupBlocks(blocks: CmsBlock[]): RenderUnit[] {
  const units: RenderUnit[] = [];
  let run: ContentSectionBlock[] = [];
  const flush = () => {
    if (run.length >= 2) units.push({ type: "article", id: `article_${run[0].id}`, sections: run });
    else units.push(...run);
    run = [];
  };
  for (const block of blocks) {
    if (block.type === "contentSection") {
      run.push(block);
      continue;
    }
    flush();
    units.push(block);
  }
  flush();
  return units;
}

function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb">
      <ol className="mono-button flex flex-wrap items-center gap-2 text-white/55">
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className="text-white/85">
                  {c.name.toUpperCase()}
                </span>
              ) : (
                <>
                  <Link href={c.path} className="transition-colors hover:text-white">
                    {c.name.toUpperCase()}
                  </Link>
                  <span aria-hidden="true" className="text-white/30">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SectionImage({ image }: { image: NonNullable<ContentSectionBlock["image"]> }) {
  return (
    <figure className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-sm)] border border-hairline">
      <Image
        src={image.url}
        alt={image.alt || ""}
        title={image.title || undefined}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 680px"
      />
    </figure>
  );
}

/** Two or more consecutive content sections: sticky section index on the left, prose on the right
 *  (same layout as the static service detail pages), instead of a stack of half-empty bands. */
function ArticleSections({ sections }: { sections: ContentSectionBlock[] }) {
  const seen = new Set<string>();
  const items = sections.map((s, i) => {
    let id = slugify(s.heading ?? "", s.id);
    if (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    return { block: s, id, heading: s.heading || `Section ${i + 1}` };
  });

  return (
    <section className="band-light border-t border-hairline">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <article className="grid gap-12 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <ServiceSectionNav sections={items.map(({ id, heading }) => ({ id, heading }))} />
          </aside>
          <div className="lg:col-span-8 lg:max-w-[720px]">
            {items.map(({ block, id }, i) => (
              <section
                key={block.id}
                id={id}
                aria-labelledby={block.heading ? `${id}-title` : undefined}
                className={i === 0 ? "scroll-mt-28" : "mt-14 scroll-mt-28 border-t border-hairline pt-14"}
              >
                <p className="mono-eyebrow text-muted-foreground">
                  {isPlaceholderEyebrow(block.eyebrow)
                    ? String(i + 1).padStart(2, "0")
                    : block.eyebrow}
                </p>
                {block.heading ? (
                  <h2 id={`${id}-title`} className="display-lg mt-3 text-foreground">
                    {block.heading}
                  </h2>
                ) : null}
                <div
                  className="blog-article mt-5 max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(block.bodyHtml) }}
                />
                {block.image ? <SectionImage image={block.image} /> : null}
              </section>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

async function EntityGridBlock({
  kind,
  eyebrow,
  heading,
}: {
  kind: EntityCatalogKind;
  eyebrow?: string;
  heading?: string;
}) {
  const cards = await getEntityCatalogCards(kind);
  if (cards.length === 0) return null;
  const prefix = ENTITY_HUB_PATH[kind];

  return (
    <section className="band-light border-t border-hairline">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        {eyebrow || heading ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            {eyebrow ? <p className="mono-eyebrow text-muted-foreground">{eyebrow}</p> : null}
            {heading ? <p className="display-md max-w-md text-foreground">{heading}</p> : null}
          </div>
        ) : null}
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <li key={c.slug}>
              <Link
                href={`${prefix}/${c.slug}`}
                className="card-flat card-hover group flex h-full flex-col"
              >
                <div className="flex items-center justify-between">
                  <p className="mono-eyebrow text-muted-foreground">{c.category ?? kind}</p>
                  {c.icon ? (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-hairline bg-background">
                      <Image src={c.icon} alt="" width={20} height={20} className="opacity-80" unoptimized />
                    </span>
                  ) : null}
                </div>
                <h3 className="display-md mt-6 text-foreground">{c.title}</h3>
                {c.description ? (
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{c.description}</p>
                ) : null}
                <span className="mono-button mt-6 inline-flex items-center gap-1 border-t border-hairline pt-4 text-foreground transition-transform group-hover:translate-x-0.5">
                  VIEW →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CtaButtons({
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  onDark,
}: {
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  onDark?: boolean;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {primaryLabel && primaryHref ? (
        <Link href={primaryHref} className={`btn-base ${onDark ? "btn-white" : "btn-primary"}`}>
          {primaryLabel}
        </Link>
      ) : null}
      {secondaryLabel && secondaryHref ? (
        <Link
          href={secondaryHref}
          className={`btn-base ${onDark ? "btn-ghost-on-dark" : "btn-secondary"}`}
        >
          {secondaryLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function BlockRenderer({
  blocks,
  breadcrumbs = [],
}: {
  blocks: CmsBlock[];
  /** Rendered in the hero; pass the same trail used for BreadcrumbList JSON-LD. */
  breadcrumbs?: Breadcrumb[];
}) {
  return (
    <>
      {groupBlocks(blocks).map((block) => {
        switch (block.type) {
          case "article":
            return <ArticleSections key={block.id} sections={block.sections} />;

          case "hero":
            return (
              <section key={block.id} className="hero-band">
                <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pt-32 pb-16 sm:px-6 sm:pt-36 sm:pb-20 lg:px-8 lg:pt-40 lg:pb-[80px]">
                  <Breadcrumbs items={breadcrumbs} />
                  {block.eyebrow ? (
                    <p className={`mono-eyebrow text-white/55 ${breadcrumbs.length > 1 ? "mt-8" : ""}`}>
                      {block.eyebrow}
                    </p>
                  ) : null}
                  <h1 className="display-xxl mt-5 max-w-[20ch] text-white">{block.heading}</h1>
                  {block.subheading ? (
                    <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
                      {block.subheading}
                    </p>
                  ) : null}
                  <CtaButtons
                    primaryLabel={block.primaryCtaLabel}
                    primaryHref={block.primaryCtaHref}
                    secondaryLabel={block.secondaryCtaLabel}
                    secondaryHref={block.secondaryCtaHref}
                    onDark
                  />
                </div>
              </section>
            );

          case "summary":
            return (
              <section
                key={block.id}
                aria-labelledby={`${block.id}-heading`}
                className="band-light border-t border-hairline"
                data-speakable="summary"
              >
                <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-16">
                  <h2
                    id={`${block.id}-heading`}
                    className="mono-eyebrow text-muted-foreground lg:col-span-4"
                  >
                    {(block.heading || "Key takeaways").toUpperCase()}
                  </h2>
                  <ul className="space-y-4 lg:col-span-8 lg:max-w-[720px]">
                    {block.items.map((item, i) => (
                      <li
                        key={`${block.id}-${i}`}
                        className="flex gap-4 border-t border-hairline pt-4 text-[17px] leading-[1.5] text-foreground first:border-t-0 first:pt-0"
                      >
                        <span aria-hidden="true" className="mono-label pt-1 text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );

          case "contentSection":
            return (
              <section key={block.id} className="band-light border-t border-hairline">
                <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
                  {/* With an image: text and image side by side. Text only: heading left, prose
                      right — fills the row instead of leaving half the band empty on desktop. */}
                  <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
                    <div className={block.image ? "lg:col-span-6" : "lg:col-span-4"}>
                      {!isPlaceholderEyebrow(block.eyebrow) ? (
                        <p className="mono-eyebrow text-muted-foreground">{block.eyebrow}</p>
                      ) : null}
                      {block.heading ? (
                        <h2 className="display-lg mt-3 text-foreground">{block.heading}</h2>
                      ) : null}
                      {block.image ? (
                        <div
                          className="blog-article mt-5 max-w-none"
                          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(block.bodyHtml) }}
                        />
                      ) : null}
                    </div>
                    {block.image ? (
                      <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-sm)] border border-hairline lg:col-span-6">
                        <Image
                          src={block.image.url}
                          alt={block.image.alt || ""}
                          title={block.image.title || undefined}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      </figure>
                    ) : (
                      <div
                        className="blog-article max-w-none lg:col-span-8 lg:max-w-[720px]"
                        dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(block.bodyHtml) }}
                      />
                    )}
                  </div>
                </div>
              </section>
            );

          case "featureGrid":
            return (
              <section key={block.id} className="band-light border-t border-hairline">
                <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    {block.heading ? (
                      <h2 className="display-xl max-w-[22ch] text-foreground">{block.heading}</h2>
                    ) : null}
                    <p className="mono-eyebrow text-muted-foreground">
                      {String(block.items.length).padStart(2, "0")} CAPABILITIES
                    </p>
                  </div>
                  <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {block.items.map((item, i) => (
                      <li key={item.title} className="card-flat flex h-full flex-col">
                        <div className="flex items-center justify-between">
                          <span className="mono-label text-muted-foreground">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span
                            aria-hidden="true"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-foreground"
                          >
                            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                              <path
                                d="M3.5 8.5l3 3 6-7"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </div>
                        <h3 className="display-sm mt-6 text-foreground">{item.title}</h3>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );

          case "entityGrid":
            return (
              <EntityGridBlock
                key={block.id}
                kind={block.kind}
                eyebrow={block.eyebrow}
                heading={block.heading}
              />
            );

          case "faq":
            return (
              <section key={block.id} className="band-light border-t border-hairline">
                <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
                  <div className="grid gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                      <p className="mono-eyebrow text-muted-foreground">FAQ</p>
                      <h2 className="display-xl mt-4 text-foreground">
                        {block.heading ?? "Frequently asked questions"}
                      </h2>
                    </div>
                    {/* Native <details> accordion: keyboard/screen-reader accessible with no JS, and
                        the answers stay in the HTML so crawlers and FAQPage JSON-LD still match. */}
                    <ul className="border-b border-hairline lg:col-span-8 lg:max-w-[720px]">
                      {block.items.map((f, i) => (
                        <li key={f.question} className="border-t border-hairline">
                          <details className="group" open={i === 0}>
                            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                              <h3 className="display-sm text-foreground">{f.question}</h3>
                              <span
                                aria-hidden="true"
                                className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline text-foreground transition-transform duration-200 group-open:rotate-45"
                              >
                                <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
                                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                              </span>
                            </summary>
                            {looksLikeHtml(f.answer) ? (
                              <div
                                className="blog-article max-w-none pb-6 pr-12 text-[15px] leading-relaxed text-muted-foreground"
                                dangerouslySetInnerHTML={{
                                  __html: sanitizeBlogHtml(f.answer),
                                }}
                              />
                            ) : (
                              <p className="pb-6 pr-12 text-[15px] leading-relaxed text-muted-foreground">
                                {f.answer}
                              </p>
                            )}
                          </details>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            );

          case "cta":
            return (
              <section
                key={block.id}
                className={
                  block.dark
                    ? "hero-band border-t border-[var(--brand-hairline-on-dark)]"
                    : "band-light border-t border-hairline"
                }
              >
                <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-[80px]">
                  <div className="lg:col-span-7">
                    {block.eyebrow ? (
                      <p
                        className={`mono-eyebrow ${block.dark ? "text-white/55" : "text-muted-foreground"}`}
                      >
                        {block.eyebrow}
                      </p>
                    ) : null}
                    <h2
                      className={`display-xl mt-4 ${block.dark ? "text-white" : "text-foreground"}`}
                    >
                      {block.heading}
                    </h2>
                    {block.body ? (
                      looksLikeHtml(block.body) ? (
                        <div
                          className={`blog-article mt-4 max-w-xl text-[15px] leading-relaxed ${
                            block.dark ? "[&_*]:text-white/70" : "text-muted-foreground"
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: sanitizeBlogHtml(block.body),
                          }}
                        />
                      ) : (
                        <p
                          className={`mt-4 max-w-xl text-[15px] leading-relaxed ${
                            block.dark ? "text-white/70" : "text-muted-foreground"
                          }`}
                        >
                          {block.body}
                        </p>
                      )
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end lg:pt-8">
                    {block.primaryCtaLabel && block.primaryCtaHref ? (
                      <Link
                        href={block.primaryCtaHref}
                        className={`btn-base ${block.dark ? "btn-white" : "btn-primary"}`}
                      >
                        {block.primaryCtaLabel}
                      </Link>
                    ) : null}
                    {block.secondaryCtaLabel && block.secondaryCtaHref ? (
                      <Link
                        href={block.secondaryCtaHref}
                        className={`btn-base ${block.dark ? "btn-ghost-on-dark" : "btn-secondary"}`}
                      >
                        {block.secondaryCtaLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
