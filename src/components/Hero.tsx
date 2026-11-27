import Link from "next/link";
import type { HomeContent } from "@/lib/home-content";

/**
 * Hero band (DESIGN.md → hero-band-dark).
 * Left: eyebrow, H1, sub-line, CTAs. Right: an animated
 * "delivery pipeline" panel (pure CSS) — or an uploaded hero image when one is configured.
 */

export type HeroProps = Pick<
  HomeContent,
  | "heroEyebrow"
  | "heroHeading"
  | "heroSubheading"
  | "heroPrimaryCtaLabel"
  | "heroPrimaryCtaHref"
  | "heroSecondaryCtaLabel"
  | "heroSecondaryCtaHref"
  | "heroTertiaryCtaLabel"
  | "heroTertiaryCtaHref"
  | "heroImageEnabled"
  | "heroImageUrl"
  | "heroImageAlt"
> & {
  /** Adds the OfferBanner's height (h-10) to the top padding so it doesn't sit under it. */
  bannerActive?: boolean;
};

const PIPELINE = [
  { step: "Discover", note: "Scope + risks", w: "100%" },
  { step: "Design", note: "Flows + architecture", w: "100%" },
  { step: "Build", note: "Weekly releases", w: "72%" },
  { step: "Ship", note: "Store + production", w: "38%" },
];

export default function Hero({
  heroEyebrow,
  heroHeading,
  heroSubheading,
  heroPrimaryCtaLabel,
  heroPrimaryCtaHref,
  heroSecondaryCtaLabel,
  heroSecondaryCtaHref,
  heroTertiaryCtaLabel,
  heroTertiaryCtaHref,
  heroImageEnabled,
  heroImageUrl,
  heroImageAlt,
  bannerActive = false,
}: HeroProps) {
  const showImage = heroImageEnabled && heroImageUrl.trim().length > 0;
  return (
    <section className="hero-band hero-grid relative">
      <div className="hero-orb hero-orb-a" aria-hidden />
      <div className="hero-orb hero-orb-b" aria-hidden />
      <div
        className={`relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-4 pb-16 sm:px-6 sm:pb-20 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pb-24 ${
          bannerActive ? "pt-[10.5rem] sm:pt-[11.5rem] lg:pt-[12.5rem]" : "pt-32 sm:pt-36 lg:pt-40"
        }`}
      >
        <div className="lg:col-span-7">
          <p className="mono-eyebrow animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white/75 opacity-0 animate-delay-1">
            <span className="pulse-dot" aria-hidden />
            {heroEyebrow}
          </p>
          <h1 className="display-xxl animate-fade-up mt-6 max-w-[17ch] text-white opacity-0 animate-delay-2">
            {heroHeading}
          </h1>
          <p className="animate-fade-up mt-4 max-w-xl text-[17px] leading-[1.55] tracking-[-0.01em] text-white/65 opacity-0 animate-delay-3">
            {heroSubheading}
          </p>

          <div className="animate-fade-up mt-8 flex flex-wrap items-center gap-3 opacity-0 animate-delay-4">
            <Link href={heroPrimaryCtaHref} className="btn-base btn-mint btn-shine">
              {heroPrimaryCtaLabel} <span aria-hidden>→</span>
            </Link>
            <Link href={heroSecondaryCtaHref} className="btn-base btn-white">
              {heroSecondaryCtaLabel}
            </Link>
            <Link href={heroTertiaryCtaHref} className="btn-base btn-ghost-on-dark">
              {heroTertiaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="animate-scale-in relative opacity-0 animate-delay-2">
            {showImage ? (
              <div className="overflow-hidden rounded-[var(--radius-md)] border border-white/10 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImageUrl} alt={heroImageAlt} className="aspect-[4/3] w-full object-cover sm:aspect-[4/5]" />
              </div>
            ) : (
              <div className="relative" aria-hidden>
                <div className="float-slow rounded-[var(--radius-md)] border border-white/12 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                    </div>
                    <span className="mono-label text-white/50">DELIVERY · WEEK 6</span>
                  </div>
                  <ul className="mt-6 space-y-5">
                    {PIPELINE.map((p, i) => (
                      <li key={p.step}>
                        <div className="flex items-baseline justify-between">
                          <span className="display-sm text-white">{p.step}</span>
                          <span className="mono-label text-white/45">{p.note}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="pipeline-bar h-full rounded-full"
                            style={{ ["--w" as string]: p.w, animationDelay: `${0.5 + i * 0.25}s` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="float-fast absolute -left-3 -top-5 rounded-full border border-white/15 bg-black/70 px-3.5 py-2 backdrop-blur sm:-left-8">
              <span className="mono-label inline-flex items-center gap-2 text-white">
                <span className="pulse-dot" /> SENIOR ENGINEERS ONLINE
              </span>
            </div>
            <div className="float-slow absolute -bottom-5 right-3 rounded-[var(--radius-sm)] bg-[var(--brand-mint)] px-4 py-3 text-black shadow-xl sm:-right-6">
              <p className="stat-number text-[26px] leading-none">50+</p>
              <p className="mono-label mt-1">LAUNCHES SHIPPED</p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
