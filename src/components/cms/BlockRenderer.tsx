import Image from "next/image";
import Link from "next/link";
import type { CmsBlock } from "@/lib/cms/blocks";
import { sanitizeBlogHtml } from "@/lib/blog-sanitize";
import { getEntityCatalogCards, ENTITY_HUB_PATH, type EntityCatalogKind } from "@/lib/entity-catalog";
import { ServiceSectionNav } from "@/components/marketing/ServiceSectionNav";
import { slugify } from "@/lib/slug";
import Reveal from "@/components/motion/Reveal";
import CountUp from "@/components/motion/CountUp";
import SpotlightGrid from "@/components/motion/SpotlightGrid";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Faq from "@/components/Faq";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buildWhatsAppMessage } from "@/lib/contact-topics";

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

/** Editors sometimes leave the seeded "Section heading" in place. */
function isPlaceholderHeading(h?: string): boolean {
  return !h || /^section heading$/i.test(h.trim());
}

const stripTags = (v: string) => v.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();

/**
 * Long prose is hard to scan. Split sanitized HTML at each <h3> so the sub-topics can render as a
 * card grid. Falls back to plain prose when there are fewer than 3 sub-topics. When the section's own
 * heading is a placeholder, the first <h3> is promoted to be the section heading.
 */
function shapeSection(block: ContentSectionBlock) {
  const html = sanitizeBlogHtml(block.bodyHtml);
  const parts = html.split(/(?=<h3[\s>])/i).filter((p) => p.trim());
  const firstIsH3 = parts[0]?.trimStart().toLowerCase().startsWith("<h3");
  let intro = firstIsH3 ? "" : (parts.shift() ?? "");
  let cards = parts;
  if (cards.length < 3) return { heading: block.heading, intro: html, cards: [] as string[] };
  let heading = block.heading;
  if (isPlaceholderHeading(block.heading) && !intro.trim()) {
    const m = cards[0].match(/^\s*<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*)$/i);
    if (m) {
      heading = stripTags(m[1]);
      intro = m[2];
      cards = cards.slice(1);
    }
  }
  return { heading: isPlaceholderHeading(heading) ? undefined : heading, intro, cards };
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

/** Rich-text body: intro prose, then (when the copy has 3+ sub-topics) a scannable card grid. */
function SectionBody({ shaped, image }: { shaped: ReturnType<typeof shapeSection>; image?: ContentSectionBlock["image"] }) {
  return (
    <>
      {shaped.intro.trim() ? (
        <div className="blog-article mt-5 max-w-[68ch]" dangerouslySetInnerHTML={{ __html: shaped.intro }} />
      ) : null}
      {shaped.cards.length ? (
        <SpotlightGrid className="mt-8 grid gap-4 sm:grid-cols-2">
          {shaped.cards.map((html, i) => (
            <li key={i} className={shaped.cards.length % 2 === 1 && i === shaped.cards.length - 1 ? "sm:col-span-2" : ""}>
              <Reveal delay={(i % 2) * 80} className="h-full">
                <div className="card-flat card-hover spotlight-card flex h-full flex-col gap-4 sm:p-7">
                  <span className="mono-label flex h-8 w-8 items-center justify-center rounded-full border border-black/15 text-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div
                    className="blog-article max-w-none !text-[15px] !leading-[1.6] [&_h3]:!mt-0 [&_h3]:!mb-2 [&_h3]:!text-[18px] [&>*+*]:!mt-2"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              </Reveal>
            </li>
          ))}
        </SpotlightGrid>
      ) : null}
      {image ? <SectionImage image={image} /> : null}
    </>
  );
}

/** Two or more consecutive content sections: sticky section index on the left, content on the right. */
function ArticleSections({ sections }: { sections: ContentSectionBlock[] }) {
  const seen = new Set<string>();
  const items = sections.map((s, i) => {
    const shaped = shapeSection(s);
    let id = slugify(shaped.heading ?? "", s.id);
    if (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    return { block: s, shaped, id, heading: shaped.heading || `Part ${i + 1}` };
  });

  return (
    <section className="band-light border-t border-hairline">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <article className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <aside className="lg:col-span-3">
            <ServiceSectionNav sections={items.map(({ id, heading }) => ({ id, heading }))} />
          </aside>
          <div className="lg:col-span-9">
            {items.map(({ block, shaped, id }, i) => (
              <section
                key={block.id}
                id={id}
                aria-labelledby={shaped.heading ? `${id}-title` : undefined}
                className={i === 0 ? "scroll-mt-28" : "mt-16 scroll-mt-28 border-t border-hairline pt-16"}
              >
                <p className="mono-eyebrow flex items-center gap-3 text-muted-foreground">
                  <span className="h-px w-8 bg-foreground/30" aria-hidden />
                  {isPlaceholderEyebrow(block.eyebrow) ? String(i + 1).padStart(2, "0") : block.eyebrow}
                </p>
                {shaped.heading ? (
                  <h2 id={`${id}-title`} className="display-xl mt-4 max-w-[26ch] text-foreground">
                    {shaped.heading}
                  </h2>
                ) : null}
                <SectionBody shaped={shaped} image={block.image} />
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
        <SpotlightGrid className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <li key={c.slug}>
              <Link
                href={`${prefix}/${c.slug}`}
                className="card-flat card-hover spotlight-card group flex h-full flex-col"
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
        </SpotlightGrid>
      </div>
    </section>
  );
}

const HERO_STATS = [
  { value: "50+", label: "Launches shipped" },
  { value: "40%", label: "Lower cost vs. local-only hire" },
  { value: "24h", label: "Average first reply" },
];

/** Right-hand panel in the hero: a low-friction way to start, using only commitments made elsewhere on the site. */
function StartCard({ topic }: { topic: string }) {
  const wa = buildWhatsAppUrl(buildWhatsAppMessage({ category: topic, message: `I'd like to talk about ${topic}.` }));
  return (
    <div className="float-slow rounded-[var(--radius-md)] border border-white/12 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl sm:p-7">
      <p className="mono-eyebrow inline-flex items-center gap-2 text-white/65">
        <span className="pulse-dot" aria-hidden /> START HERE
      </p>
      <p className="display-md mt-3 text-white">Free 30-minute consultation</p>
      <ul className="mt-5 space-y-3 text-[14px] text-white/80">
        {["Reply within 24 hours", "NDA — standard or yours", "Written scope & acceptance criteria"].map((t) => (
          <li key={t} className="flex items-center gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-mint)] text-black" aria-hidden>
              <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
                <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col gap-3">
        <Link href="/contact" className="btn-base btn-mint btn-shine w-full !py-3.5">
          Book a call <span aria-hidden>→</span>
        </Link>
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-base w-full !bg-whatsapp !py-3.5 text-white hover:brightness-95">
            <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
          </a>
        ) : null}
      </div>
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
  const units = groupBlocks(blocks);
  return (
    <>
      {units.map((block, index) => {
        const prev = units[index - 1];
        switch (block.type) {
          case "article":
            return <ArticleSections key={block.id} sections={block.sections} />;

          case "hero":
            return (
              <section key={block.id} className="hero-band hero-grid">
                <div className="hero-orb hero-orb-a" aria-hidden />
                <div className="hero-orb hero-orb-b" aria-hidden />
                <div className="relative z-10 mx-auto grid w-full max-w-[1280px] items-center gap-12 px-4 pb-14 pt-28 sm:px-6 sm:pb-16 sm:pt-32 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pb-20 lg:pt-36">
                  <div className="lg:col-span-7">
                    <Breadcrumbs items={breadcrumbs} />
                    {block.eyebrow ? (
                      <p
                        className={`mono-eyebrow animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white/75 opacity-0 animate-delay-1 ${
                          breadcrumbs.length > 1 ? "mt-8" : ""
                        }`}
                      >
                        <span className="pulse-dot" aria-hidden /> {block.eyebrow}
                      </p>
                    ) : null}
                    <h1 className="display-xxl animate-fade-up mt-6 max-w-[16ch] text-white opacity-0 animate-delay-2">
                      {block.heading}
                    </h1>
                    {block.subheading ? (
                      <p className="animate-fade-up mt-6 max-w-xl text-[17px] leading-[1.55] text-white/70 opacity-0 animate-delay-3">
                        {block.subheading}
                      </p>
                    ) : null}
                    <div className="animate-fade-up opacity-0 animate-delay-4">
                      <div className="mt-8 flex flex-wrap items-center gap-3">
                        {block.primaryCtaLabel && block.primaryCtaHref ? (
                          <Link href={block.primaryCtaHref} className="btn-base btn-mint btn-shine">
                            {block.primaryCtaLabel} <span aria-hidden>→</span>
                          </Link>
                        ) : null}
                        {block.secondaryCtaLabel && block.secondaryCtaHref ? (
                          <Link href={block.secondaryCtaHref} className="btn-base btn-ghost-on-dark">
                            {block.secondaryCtaLabel}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="animate-scale-in opacity-0 animate-delay-2 lg:col-span-5">
                    <StartCard topic={block.heading} />
                  </div>
                </div>
                <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-sm">
                  <dl className="mx-auto grid w-full max-w-[1280px] grid-cols-3 divide-x divide-white/10 px-4 sm:px-6 lg:px-8">
                    {HERO_STATS.map((st) => (
                      <div key={st.label} className="px-3 py-5 first:pl-0 sm:px-6 sm:py-6">
                        <dd className="stat-number text-[24px] leading-none text-white sm:text-[32px]">
                          <CountUp value={st.value} />
                        </dd>
                        <dt className="mono-label mt-2 text-white/55">{st.label}</dt>
                      </div>
                    ))}
                  </dl>
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
                <div className="mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
                  <h2 id={`${block.id}-heading`} className="mono-eyebrow text-muted-foreground">
                    {(block.heading || "Key takeaways").toUpperCase()}
                  </h2>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {block.items.map((item, i) => (
                      <li key={`${block.id}-${i}`}>
                        <Reveal delay={i * 70} className="h-full">
                          <div className="card-flat h-full">
                            <span aria-hidden="true" className="stat-number text-[28px] leading-none text-foreground/25">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <p className="mt-4 text-[16px] leading-[1.5] text-foreground">{item}</p>
                          </div>
                        </Reveal>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );

          case "contentSection": {
            const shaped = shapeSection(block);
            return (
              <section key={block.id} className="band-light border-t border-hairline">
                <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
                  <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
                    <div className={block.image ? "lg:col-span-6" : "lg:col-span-12"}>
                      {!isPlaceholderEyebrow(block.eyebrow) ? (
                        <p className="mono-eyebrow text-muted-foreground">{block.eyebrow}</p>
                      ) : null}
                      {shaped.heading ? (
                        <h2 className="display-xl mt-3 max-w-[26ch] text-foreground">{shaped.heading}</h2>
                      ) : null}
                      <SectionBody shaped={shaped} />
                    </div>
                    {block.image ? (
                      <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-md)] border border-hairline lg:col-span-6">
                        <Image
                          src={block.image.url}
                          alt={block.image.alt || ""}
                          title={block.image.title || undefined}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      </figure>
                    ) : null}
                  </div>
                </div>
              </section>
            );
          }

          case "featureGrid":
            return (
              <section key={block.id} className="border-t border-hairline bg-[var(--app-muted)]">
                <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    {block.heading ? (
                      <h2 className="display-xl max-w-[22ch] text-foreground">{block.heading}</h2>
                    ) : null}
                    <p className="mono-eyebrow text-muted-foreground">
                      {String(block.items.length).padStart(2, "0")} CAPABILITIES
                    </p>
                  </div>
                  <SpotlightGrid className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {block.items.map((item, i) => (
                      <li key={item.title}>
                        <Reveal delay={(i % 3) * 80} className="h-full">
                          <div className="card-flat card-hover spotlight-card flex h-full flex-col">
                            <div className="flex items-center justify-between">
                              <span className="mono-label text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                              <span aria-hidden="true" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-mint)] text-black">
                                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                                  <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            </div>
                            <h3 className="display-sm mt-6 text-foreground">{item.title}</h3>
                            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{item.description}</p>
                          </div>
                        </Reveal>
                      </li>
                    ))}
                  </SpotlightGrid>
                </div>
              </section>
            );

          case "entityGrid":
            return <EntityGridBlock key={block.id} kind={block.kind} eyebrow={block.eyebrow} heading={block.heading} />;

          case "faq":
            return (
              <Faq
                key={block.id}
                id={`faq-${block.id}`}
                groupName={`faq-${block.id}`}
                heading={block.heading ?? "Frequently asked questions"}
                intro="Straight answers on scope, process and pricing for this service."
                items={block.items}
                openFirst
              />
            );

          case "cta": {
            // Directly under the hero (which already has CTAs) a full band is redundant: render a slim strip.
            if (prev?.type === "hero") {
              return (
                <section key={block.id} className="border-t border-hairline bg-white">
                  <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
                    <div className="min-w-0">
                      <h2 className="display-md text-foreground">{block.heading}</h2>
                      {block.body && !looksLikeHtml(block.body) ? (
                        <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{block.body}</p>
                      ) : null}
                    </div>
                    {block.primaryCtaLabel && block.primaryCtaHref ? (
                      <Link href={block.primaryCtaHref} className="btn-base btn-primary shrink-0">
                        {block.primaryCtaLabel} <span aria-hidden>→</span>
                      </Link>
                    ) : null}
                  </div>
                </section>
              );
            }
            return (
              <section
                key={block.id}
                className={
                  block.dark
                    ? "hero-band hero-grid border-t border-[var(--brand-hairline-on-dark)]"
                    : "band-light border-t border-hairline"
                }
              >
                {block.dark ? <div className="hero-orb hero-orb-a" aria-hidden /> : null}
                <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-[80px]">
                  <div className="lg:col-span-7">
                    {block.eyebrow ? (
                      <p className={`mono-eyebrow ${block.dark ? "text-white/55" : "text-muted-foreground"}`}>{block.eyebrow}</p>
                    ) : null}
                    <h2 className={`display-xl mt-4 max-w-[22ch] ${block.dark ? "text-white" : "text-foreground"}`}>{block.heading}</h2>
                    {block.body ? (
                      looksLikeHtml(block.body) ? (
                        <div
                          className={`blog-article mt-4 max-w-xl text-[15px] leading-relaxed ${block.dark ? "[&_*]:text-white/70" : "text-muted-foreground"}`}
                          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(block.body) }}
                        />
                      ) : (
                        <p className={`mt-4 max-w-xl text-[15px] leading-relaxed ${block.dark ? "text-white/70" : "text-muted-foreground"}`}>{block.body}</p>
                      )
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end lg:pt-8">
                    {block.primaryCtaLabel && block.primaryCtaHref ? (
                      <Link href={block.primaryCtaHref} className={`btn-base btn-shine ${block.dark ? "btn-mint" : "btn-primary"}`}>
                        {block.primaryCtaLabel} <span aria-hidden>→</span>
                      </Link>
                    ) : null}
                    {block.secondaryCtaLabel && block.secondaryCtaHref ? (
                      <Link href={block.secondaryCtaHref} className={`btn-base ${block.dark ? "btn-white" : "btn-secondary"}`}>
                        {block.secondaryCtaLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>
            );
          }

          default:
            return null;
        }
      })}
    </>
  );
}
