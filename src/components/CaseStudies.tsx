import Image from "next/image";
import Link from "next/link";
import type { CaseStudy } from "@/lib/case-studies-content";
import type { HomeContent } from "@/lib/home-content";

/**
 * Case studies section (DESIGN.md → article-card).
 * Light band hosting the brand's canonical article card: 16:9 image at top,
 * mono eyebrow tag, display-md title, body summary, mono caption byline.
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

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {items.map((study) => (
            <li key={study.slug}>
              <article className="card-flat card-hover group flex h-full flex-col p-0 overflow-hidden">
                <Link
                  href={`/case-studies/${study.slug}`}
                  className="flex h-full flex-col"
                >
                  <div className="relative aspect-[16/9] overflow-hidden border-b border-hairline">
                    <Image
                      src={study.coverImage}
                      alt={study.coverAlt}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-7">
                    <div className="flex items-center justify-between gap-3">
                      <p className="mono-eyebrow text-muted-foreground">
                        {study.industry.toUpperCase()}
                      </p>
                      <span className="mono-label text-muted-foreground">
                        {study.metricLabel.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="display-md mt-5 text-foreground">{study.title}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                      {study.challenge}
                    </p>
                    <p className="mt-5 text-[15px] leading-relaxed text-foreground">
                      <span className="mono-label text-muted-foreground">RESULT · </span>
                      {study.outcome}
                    </p>
                    <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4">
                      <span className="stat-number text-[28px] leading-none text-foreground">
                        {study.metric}
                      </span>
                      <span className="mono-button text-foreground transition-transform group-hover:translate-x-0.5">
                        READ CASE STUDY →
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
