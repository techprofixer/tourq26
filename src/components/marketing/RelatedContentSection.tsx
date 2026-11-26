import Link from "next/link";
import type { RelatedLinkGroup } from "@/lib/related-links";
import Reveal from "@/components/motion/Reveal";
import SpotlightGrid from "@/components/motion/SpotlightGrid";

/** Entities whose name is still a raw slug ("web-development") read badly as a link title. */
function prettyTitle(t: string): string {
  if (!/^[a-z0-9]+(-[a-z0-9]+)+$/.test(t)) return t;
  return t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Related content as scannable link lists: one card per content type, each row a full-width
 * target with a title, a one-line summary and an arrow — instead of underlined text in a 2-col grid.
 */
export function RelatedContentSection({ groups }: { groups: RelatedLinkGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section className="border-t border-hairline bg-[var(--app-muted)]">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mono-eyebrow text-muted-foreground">EXPLORE MORE</p>
            <h2 className="display-xl mt-4 text-foreground">Keep exploring.</h2>
          </div>
          <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Services, proof and reading that sit alongside this page.
          </p>
        </div>
        <SpotlightGrid className="mt-10 gap-4 md:columns-2 lg:columns-3 [&>li]:mb-4 [&>li]:break-inside-avoid">
          {groups.map((group, gi) => (
            <li key={group.key}>
              <Reveal delay={(gi % 3) * 80} className="h-full">
                <div className="card-flat spotlight-card !p-0">
                  <div className="p-6 pb-4">
                    <h3 className="display-sm text-foreground">{group.heading}</h3>
                    <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{group.description}</p>
                  </div>
                  <ul className="divide-y divide-[var(--app-border)] border-t border-hairline">
                    {group.links.slice(0, 4).map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="group flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-[var(--app-muted)]"
                        >
                          <span className="min-w-0">
                            <span className="block text-[15px] font-medium leading-snug text-foreground">
                              {prettyTitle(link.title)}
                            </span>
                            {link.description ? (
                              <span className="mt-1 line-clamp-1 block text-[13px] text-muted-foreground">
                                {link.description}
                              </span>
                            ) : null}
                          </span>
                          <span
                            className="mt-0.5 shrink-0 text-foreground/40 transition-all group-hover:translate-x-1 group-hover:text-foreground"
                            aria-hidden
                          >
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </li>
          ))}
        </SpotlightGrid>
      </div>
    </section>
  );
}
