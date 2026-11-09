import Image from "next/image";
import Link from "next/link";
import type { CmsBlock } from "@/lib/cms/blocks";
import { sanitizeBlogHtml } from "@/lib/blog-sanitize";
import { getEntityCatalogCards, ENTITY_HUB_PATH, type EntityCatalogKind } from "@/lib/entity-catalog";

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
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

export function BlockRenderer({ blocks }: { blocks: CmsBlock[] }) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case "hero":
            return (
              <section key={block.id} className="hero-band">
                <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pt-32 pb-16 sm:px-6 sm:pt-36 sm:pb-20 lg:px-8 lg:pt-40 lg:pb-[80px]">
                  {block.eyebrow ? (
                    <p className="mono-eyebrow text-white/55">{block.eyebrow}</p>
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

          case "contentSection":
            return (
              <section key={block.id} className="band-light border-t border-hairline">
                <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
                  <div
                    className={
                      block.image
                        ? "grid gap-10 lg:grid-cols-12 lg:items-start"
                        : "max-w-[680px]"
                    }
                  >
                    <div className={block.image ? "lg:col-span-6" : undefined}>
                      {block.eyebrow ? (
                        <p className="mono-eyebrow text-muted-foreground">{block.eyebrow}</p>
                      ) : null}
                      {block.heading ? (
                        <h2 className="display-lg mt-4 text-foreground">{block.heading}</h2>
                      ) : null}
                      <div
                        className="blog-article mt-5 max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeBlogHtml(block.bodyHtml),
                        }}
                      />
                    </div>
                    {block.image ? (
                      <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-sm)] border border-hairline lg:col-span-6">
                        <Image
                          src={block.image.url}
                          alt={block.image.alt || ""}
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

          case "featureGrid":
            return (
              <section key={block.id} className="band-light border-t border-hairline">
                <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
                  {block.heading ? (
                    <h2 className="display-xl text-foreground">{block.heading}</h2>
                  ) : null}
                  <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {block.items.map((item) => (
                      <li key={item.title} className="border-t border-hairline pt-5">
                        <h3 className="display-sm text-foreground">{item.title}</h3>
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
                    <ul className="space-y-8 lg:col-span-8 lg:max-w-[680px]">
                      {block.items.map((f) => (
                        <li
                          key={f.question}
                          className="border-t border-hairline pt-6 first:border-t-0 first:pt-0"
                        >
                          <h3 className="display-sm text-foreground">{f.question}</h3>
                          {looksLikeHtml(f.answer) ? (
                            <div
                              className="blog-article mt-3 max-w-none text-[15px] leading-relaxed text-muted-foreground"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeBlogHtml(f.answer),
                              }}
                            />
                          ) : (
                            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                              {f.answer}
                            </p>
                          )}
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
