import Link from "next/link";
import type { HomeContent } from "@/lib/home-content";

/**
 * Marketing CTA band (DESIGN.md → hero-band-dark + button-primary).
 * Closing dark band before the footer: sentence-case display-xl headline,
 * primary black/white pill, and a single mint pill for the secondary CTA.
 */

export type CTAProps = Pick<
  HomeContent,
  | "ctaEyebrow"
  | "ctaHeading"
  | "ctaBody"
  | "ctaPrimaryLabel"
  | "ctaPrimaryHref"
  | "ctaSecondaryLabel"
  | "ctaSecondaryHref"
  | "ctaEmail"
  | "ctaFootnote"
>;

export default function CTA({
  ctaEyebrow,
  ctaHeading,
  ctaBody,
  ctaPrimaryLabel,
  ctaPrimaryHref,
  ctaSecondaryLabel,
  ctaSecondaryHref,
  ctaEmail,
  ctaFootnote,
}: CTAProps) {
  return (
    <section className="hero-band border-t border-[var(--brand-hairline-on-dark)]">
      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-[80px]">
        <div className="lg:col-span-7">
          <p className="mono-eyebrow text-white/55">{ctaEyebrow}</p>
          <h2 className="display-xl mt-4 max-w-[20ch] text-white">
            {ctaHeading}
          </h2>
          <p className="mt-5 max-w-xl text-[17px] leading-[1.5] text-white/65">
            {ctaBody}
          </p>
        </div>
        <div className="flex flex-col items-start gap-4 lg:col-span-5 lg:items-end lg:justify-center">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={ctaPrimaryHref} className="btn-base btn-white">
              {ctaPrimaryLabel}
            </Link>
            <Link href={ctaSecondaryHref} className="btn-base btn-mint">
              {ctaSecondaryLabel}
            </Link>
          </div>
          <a
            href={`mailto:${ctaEmail}`}
            className="mono-label text-white/55 underline-offset-4 hover:text-white hover:underline"
          >
            {ctaEmail.toUpperCase()}
          </a>
          <p className="mono-label text-white/40">
            {ctaFootnote}
          </p>
        </div>
      </div>
    </section>
  );
}
