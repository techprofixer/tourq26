import Link from "next/link";
import type { OfferItem } from "@/lib/home-content";

export type OffersProps = {
  offersHeading: string;
  offersIntro: string;
  offersItems: OfferItem[];
};

/** Promo-card grid — enabled from Admin → Homepage → Offers. */
export default function Offers({ offersHeading, offersIntro, offersItems }: OffersProps) {
  if (offersItems.length === 0) return null;

  return (
    <section className="band-light border-t border-hairline">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <header className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mono-eyebrow text-muted-foreground">LIMITED-TIME</p>
            <h2 className="display-xl mt-4 text-foreground">{offersHeading}</h2>
          </div>
          <div className="flex items-end lg:col-span-5">
            <p className="text-[16px] leading-[1.4] text-muted-foreground">{offersIntro}</p>
          </div>
        </header>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offersItems.map((offer, i) => (
            <li key={i} className="card-flat card-hover flex h-full flex-col">
              {offer.badge ? (
                <span className="mono-eyebrow inline-flex w-fit rounded-full border border-hairline bg-background px-2.5 py-1 text-foreground">
                  {offer.badge}
                </span>
              ) : null}
              <h3 className="display-md mt-4 text-foreground">{offer.title}</h3>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">{offer.description}</p>
              {offer.ctaLabel && offer.ctaHref ? (
                <Link
                  href={offer.ctaHref}
                  className="mono-button mt-6 inline-flex items-center gap-1 text-foreground hover:underline"
                >
                  {offer.ctaLabel} →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
