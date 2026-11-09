import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import Footer from "@/components/Footer";
import { getSiteUrl } from "@/lib/site-url";
import { getEntityCatalogCards, ENTITY_HUB_PATH, type EntityCatalogKind } from "@/lib/entity-catalog";

function pathPrefix(kind: "SOLUTION" | "INDUSTRY" | "TECHNOLOGY" | "LOCATION") {
  return ENTITY_HUB_PATH[kind];
}

export function makeHubPage(opts: {
  kind: Exclude<EntityCatalogKind, "SERVICE">;
  title: string;
  description: string;
  eyebrow: string;
}) {
  async function generateMetadata(): Promise<Metadata> {
    const siteUrl = (await getSiteUrl()).replace(/\/$/, "");
    const path = pathPrefix(opts.kind);
    return {
      title: opts.title,
      description: opts.description,
      alternates: { canonical: `${siteUrl}${path}` },
      openGraph: {
        title: `${opts.title} | Torq Studio`,
        description: opts.description,
        url: `${siteUrl}${path}`,
      },
    };
  }

  async function Page() {
    const items = await getEntityCatalogCards(opts.kind);
    const prefix = pathPrefix(opts.kind);

    return (
      <div className="min-h-screen bg-background">
        <MarketingHeader />
        <main>
          <section className="hero-band">
            <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pt-32 pb-16 sm:px-6 sm:pt-36 lg:px-8 lg:pt-40">
              <p className="mono-eyebrow text-white/55">{opts.eyebrow}</p>
              <h1 className="display-xxl mt-5 max-w-[18ch] text-white">{opts.title}</h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-[1.5] text-white/70">
                {opts.description}
              </p>
            </div>
          </section>
          <section className="band-light border-t border-hairline">
            <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8">
              {items.length === 0 ? (
                <p className="text-muted-foreground">
                  Hub pages will appear after CMS entities are seeded and published.
                </p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`${prefix}/${item.slug}`}
                        className="card-flat card-hover group flex h-full flex-col"
                      >
                        <p className="mono-eyebrow text-muted-foreground">
                          {item.category ?? opts.kind}
                        </p>
                        <h2 className="display-sm mt-4 text-foreground">{item.title}</h2>
                        {item.description ? (
                          <p className="mt-3 flex-1 text-[14px] leading-relaxed text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                        <span className="mono-button mt-5 inline-flex border-t border-hairline pt-4 text-foreground transition-transform group-hover:translate-x-0.5">
                          VIEW →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return { generateMetadata, Page };
}
