import Image from "next/image";
import Link from "next/link";
import type { HomeContent } from "@/lib/home-content";
import Reveal from "@/components/motion/Reveal";
import SpotlightGrid from "@/components/motion/SpotlightGrid";

/**
 * Services section. Bento grid: the first card spans two columns on desktop, the rest tile
 * evenly. Cards get a cursor-following spotlight and a lift on hover. Items are admin-editable
 * (Admin → Homepage → Services).
 */

export type ServicesProps = Pick<
  HomeContent,
  "servicesEyebrow" | "servicesHeading" | "servicesIntro" | "servicesItems"
>;

export default function Services({
  servicesEyebrow,
  servicesHeading,
  servicesIntro,
  servicesItems,
}: ServicesProps) {
  return (
    <section id="services" className="band-light border-t border-hairline">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <header className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mono-eyebrow text-muted-foreground">{servicesEyebrow}</p>
            <h2 className="display-xl mt-4 text-foreground">
              {servicesHeading}
            </h2>
          </div>
          <div className="flex flex-col justify-end gap-3 lg:col-span-5">
            <p className="text-[16px] leading-[1.4] text-muted-foreground">
              {servicesIntro}
            </p>
            <Link
              href="/services"
              className="mono-button inline-flex items-center gap-1 text-foreground hover:underline"
            >
              FULL SERVICE OVERVIEWS →
            </Link>
          </div>
        </header>

        <SpotlightGrid className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicesItems.map((service, i) => (
            <li key={service.slug} className={i === 0 ? "lg:col-span-2" : ""}>
              <Reveal delay={(i % 3) * 80} className="h-full">
              <Link
                href={`/services/${service.slug}`}
                className={`card-flat card-hover spotlight-card group flex h-full flex-col ${i === 0 ? "lg:p-8" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="mono-eyebrow text-muted-foreground">{service.category}</p>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-hairline bg-background">
                    <Image
                      src={service.icon}
                      alt=""
                      width={18}
                      height={18}
                      className="opacity-80"
                      unoptimized
                    />
                  </span>
                </div>
                <h3 className={`mb-0 mt-5 text-foreground ${i === 0 ? "display-lg" : "display-md"}`}>{service.title}</h3>
                <p className="mb-6 mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-hairline pt-4">
                  <span className="mono-label text-muted-foreground">{service.result}</span>
                  <span className="mono-button text-foreground transition-transform group-hover:translate-x-0.5">
                    LEARN MORE →
                  </span>
                </div>
              </Link>
              </Reveal>
            </li>
          ))}
        </SpotlightGrid>
      </div>
    </section>
  );
}
