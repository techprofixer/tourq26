import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import SpotlightGrid from "@/components/motion/SpotlightGrid";
import type { EntityCatalogCard } from "@/lib/entity-catalog";

/**
 * Industries — relevance for the visitor's own sector. Uses published industry entities
 * (Admin → CMS → Entities) so new sectors appear automatically. When fewer than 4 are published the
 * grid is padded from a static list (linking to the hub) so the section never looks half-empty.
 */

const FALLBACK: Pick<EntityCatalogCard, "title" | "description">[] = [
  { title: "Healthcare", description: "Patient apps, scheduling, and records integrations built with compliance in mind." },
  { title: "Fintech", description: "Payments, onboarding, and reporting where reliability and audit trails matter." },
  { title: "Retail & e-commerce", description: "Storefronts, catalog and order systems that stay fast at peak traffic." },
  { title: "Logistics", description: "Dispatch, tracking, and operations dashboards wired into existing systems." },
  { title: "Manufacturing", description: "Shop-floor tools, ERP integrations, and internal workflow automation." },
  { title: "Education", description: "Learning platforms, admin portals, and engagement apps for institutions." },
];

export default function Industries({
  items,
  eyebrow,
  heading,
  intro,
}: {
  items: EntityCatalogCard[];
  eyebrow: string;
  heading: string;
  intro: string;
}) {
  const real = items.slice(0, 8).map((i) => ({ ...i, href: `/industries/${i.slug}` }));
  const have = new Set(real.map((c) => c.title.toLowerCase()));
  const pad =
    real.length >= 4
      ? []
      : FALLBACK.filter((f) => !have.has(f.title.toLowerCase())).map((f) => ({
          ...f,
          slug: f.title,
          href: "/industries",
        }));
  const cards = [...real, ...pad].slice(0, 8);
  return (
    <section id="industries" className="band-light border-t border-hairline" aria-labelledby="industries-heading">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <header className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mono-eyebrow text-muted-foreground">{eyebrow}</p>
            <h2 id="industries-heading" className="display-xl mt-4 text-foreground">
              {heading}
            </h2>
          </div>
          <div className="flex flex-col justify-end gap-3 lg:col-span-5">
            <p className="text-[16px] leading-[1.5] text-muted-foreground">
              {intro}
            </p>
            <Link href="/industries" className="mono-button inline-flex items-center gap-1 text-foreground hover:underline">
              ALL INDUSTRIES →
            </Link>
          </div>
        </header>

        <SpotlightGrid
          className={`mt-10 grid gap-4 sm:grid-cols-2 ${cards.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
        >
          {cards.map((c, i) => (
            <li key={c.slug}>
              <Reveal delay={(i % 4) * 70} className="h-full">
                <Link href={c.href} className="card-flat card-hover spotlight-card group flex h-full flex-col">
                  <span className="mono-label text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="display-md mt-6 text-foreground">{c.title}</h3>
                  {c.description ? (
                    <p className="mb-6 mt-3 line-clamp-3 text-[14px] leading-relaxed text-muted-foreground">{c.description}</p>
                  ) : null}
                  <span className="mono-button mt-auto pt-6 text-foreground transition-transform group-hover:translate-x-1">
                    EXPLORE →
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </SpotlightGrid>
      </div>
    </section>
  );
}
