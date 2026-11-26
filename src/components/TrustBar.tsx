import CountUp from "@/components/motion/CountUp";
import Reveal from "@/components/motion/Reveal";

/**
 * Proof strip. Animated stat counters in a single divided strip, then a looping regions marquee.
 * Stats and regions are editable in Admin → Homepage → Proof strip. Only publish claims you can
 * back up; add client logos / a review-site rating here once there are real ones to show.
 */

export default function TrustBar({
  stats,
  regions,
}: {
  stats: { value: string; label: string }[];
  regions: string[];
}) {
  return (
    <section className="band-light border-y border-hairline" aria-label="Results and reach">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <Reveal>
          <dl className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-md)] border border-hairline lg:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`group relative bg-white p-6 transition-colors hover:bg-[var(--app-muted)] sm:p-8 ${
                  i % 2 === 1 ? "border-l border-hairline" : ""
                } ${i > 0 ? "lg:border-l" : ""} ${i > 1 ? "border-t border-hairline lg:border-t-0" : ""}`}
              >
                <dd className="stat-number order-1 text-[40px] leading-none tracking-[-0.03em] sm:text-[52px]">
                  <CountUp value={s.value} />
                </dd>
                <dt className="mono-label mt-4 text-muted-foreground">{s.label}</dt>
                <span className="absolute bottom-0 left-0 h-[3px] w-0 bg-[var(--brand-mint)] transition-all duration-500 group-hover:w-full" />
              </div>
            ))}
          </dl>
        </Reveal>

        {regions.length ? (
        <div className="mt-8 flex items-center gap-6">
          <p className="mono-eyebrow shrink-0 text-muted-foreground">SERVING</p>
          <div className="marquee-mask relative min-w-0 flex-1 overflow-hidden">
            <ul className="marquee-track flex w-max items-center gap-12 text-[15px] tracking-tight text-foreground/80">
              {[...regions, ...regions, ...regions, ...regions].map((r, i) => (
                <li key={`${r}-${i}`} aria-hidden={i >= regions.length} className="whitespace-nowrap">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
        ) : null}
      </div>
    </section>
  );
}
