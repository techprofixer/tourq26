import Link from "next/link";

export type OfferBannerProps = {
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
};

/**
 * Slim promo strip pinned above the fixed marketing header — enabled from
 * Admin → Homepage → Offer banner. Fixed at a constant height (h-10) so the
 * header (offset via its `bannerActive` prop) and Hero (via its own prop)
 * can reserve exactly matching space instead of guessing at render time.
 */
export default function OfferBanner({ text, ctaLabel, ctaHref }: OfferBannerProps) {
  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex h-10 items-center justify-center gap-x-2 overflow-hidden px-4 text-center text-[13px] font-medium text-white"
      style={{ background: "var(--brand-gradient)" }}
    >
      <span className="min-w-0 truncate">{text}</span>
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} className="shrink-0 underline underline-offset-2 hover:no-underline">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
