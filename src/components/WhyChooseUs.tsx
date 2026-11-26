import type { HomeContent } from "@/lib/home-content";
import CountUp from "@/components/motion/CountUp";
import Reveal from "@/components/motion/Reveal";
import SpotlightGrid from "@/components/motion/SpotlightGrid";

/**
 * Why-us research band (DESIGN.md → research-band-dark + research-card).
 * Polarity-flipped dark navy band with a 3-up grid of hairline-on-dark cards.
 * Each card has a mono eyebrow label, a display-md stat, and body copy.
 */

export type WhyChooseUsProps = Pick<
  HomeContent,
  "whyUsEyebrow" | "whyUsHeading" | "whyUsIntro" | "whyUsItems"
>;

export default function WhyChooseUs({
  whyUsEyebrow,
  whyUsHeading,
  whyUsIntro,
  whyUsItems,
}: WhyChooseUsProps) {
  return (
    <section
      id="why-us"
      className="band-dark relative overflow-hidden"
      aria-labelledby="why-us-heading"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <header className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mono-eyebrow text-white/55">{whyUsEyebrow}</p>
            <h2 id="why-us-heading" className="display-xl mt-4 text-white">
              {whyUsHeading}
            </h2>
          </div>
          <p className="text-[16px] leading-[1.5] text-white/65 lg:col-span-5 lg:self-end">
            {whyUsIntro}
          </p>
        </header>

        <SpotlightGrid className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {whyUsItems.map((item, i) => (
            <li key={item.title}>
              <Reveal delay={i * 90} className="h-full">
              <div className="card-flat-on-dark card-hover spotlight-card flex h-full flex-col">
              <p className="mono-eyebrow text-white/55">{item.eyebrow}</p>
              <p className="stat-number brand-gradient-text mt-6 text-[56px] leading-none">
                <CountUp value={item.stat} />
              </p>
              <h3 className="display-md mt-6 text-white">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/65">
                {item.description}
              </p>
              </div>
              </Reveal>
            </li>
          ))}
        </SpotlightGrid>
      </div>
    </section>
  );
}
