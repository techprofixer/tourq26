import Link from "next/link";
import type { RelatedLinkGroup } from "@/lib/related-links";

export function RelatedContentSection({ groups }: { groups: RelatedLinkGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section className="band-light border-t border-hairline">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <p className="mono-eyebrow text-muted-foreground">EXPLORE MORE</p>
        <h2 className="display-xl mt-4 text-foreground">Related reading across Torq Studio.</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group.key} className="card-flat">
              <h3 className="display-sm text-foreground">{group.heading}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                {group.description}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="group block">
                    <span className="text-[15px] font-medium text-foreground underline decoration-muted-foreground/40 decoration-1 underline-offset-2 group-hover:decoration-foreground">
                      {link.title}
                    </span>
                    {link.description ? (
                      <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
                        {link.description}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
