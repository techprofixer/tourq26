import Image from "next/image";
import Link from "next/link";
import type { CaseStudy } from "@/lib/case-studies-content";
import type { HomeContent } from "@/lib/home-content";
import Reveal from "@/components/motion/Reveal";

/**
 * Case studies. The first study is a wide featured card (image + big metric); the rest tile in
 * two columns. Metric is the visual lead — evidence first, prose second.
 */

export type CaseStudiesProps = Pick<
  HomeContent,
  "caseStudiesEyebrow" | "caseStudiesHeading" | "caseStudiesIntro"
> & {
  items: CaseStudy[];
};

export default function CaseStudies({
  caseStudiesEyebrow,
  caseStudiesHeading,
  caseStudiesIntro,
  items,
}: CaseStudiesProps) {
  return (
    <section
      id="case-studies"
      className="band-light border-t border-hairline"
      aria-labelledby="case-studies-heading"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <header className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="mono-eyebrow text-muted-foreground">{caseStudiesEyebrow}</p>
            <h2 id="case-studies-heading" className="display-xl mt-4 text-foreground">
              {caseStudiesHeading}
            </h2>
          </div>
          <div className="flex flex-col justify-end gap-3 lg:col-span-4">
            <p className="text-[16px] leading-[1.5] text-muted-foreground">
              {caseStudiesIntro}
            </p>
            <Link
              href="/case-studies"
              className="mono-button inline-flex items-center gap-1 text-foreground hover:underline"
            >
              ALL CASE STUDIES →
            </Link>
          </div>
        </header>

        <ul className="mt-10 grid gap-4 md:grid-cols-6">
          {items.map((study, i) => {
            const featured = i === 0 && items.length > 2;
            // Rest of the grid: 3-up when the remainder divides by 3 (no orphan card), else 2-up.
            const restCount = items.length - (items.length > 2 ? 1 : 0);
            const span = featured ? "md:col-span-6" : restCount % 3 === 0 ? "md:col-span-2" : "md:col-span-3";
            return (
              <li key={study.slug} className={span}>
                <Reveal delay={(i % 2) * 90} className="h-full">
                  <article className="card-flat card-hover group h-full overflow-hidden !p-0">
                    <Link
                      href={`/case-studies/${study.slug}`}
                      className={`flex h-full flex-col ${featured ? "md:grid md:grid-cols-12" : ""}`}
                    >
                      <div
                        className={`relative aspect-[16/9] overflow-hidden border-b border-hairline ${
                          featured ? "md:col-span-7 md:aspect-auto md:min-h-[360px] md:border-b-0 md:border-r" : ""
                        }`}
                      >
                        <Image
                          src={study.coverImage}
                          alt={study.coverAlt}
                          fill
                          className="object-cover transition duration-700 group-hover:scale-[1.04]"
                          sizes={featured ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 100vw, 33vw"}
                        />
                        <span className="mono-label absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-black">
                          {study.industry.toUpperCase()}
                        </span>
                      </div>
                      <div className={`flex flex-1 flex-col p-6 sm:p-7 ${featured ? "md:col-span-5 md:justify-center md:p-10" : ""}`}>
                        <p className="stat-number text-[44px] leading-none tracking-[-0.03em] text-foreground">
                          {study.metric}
                        </p>
                        <p className="mono-label mt-2 text-muted-foreground">{study.metricLabel.toUpperCase()}</p>
                        <h3 className={`mt-6 text-foreground ${featured ? "display-lg" : "display-md"}`}>{study.title}</h3>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{study.challenge}</p>
                        <p className="mt-4 text-[15px] leading-relaxed text-foreground">
                          <span className="mono-label text-muted-foreground">RESULT · </span>
                          {study.outcome}
                        </p>
                        <span className="mono-button mt-6 inline-flex items-center gap-1 text-foreground">
                          READ CASE STUDY
                          <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
                        </span>
                      </div>
                    </Link>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
