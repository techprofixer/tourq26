import Reveal from "@/components/motion/Reveal";

/**
 * How we work — steps that de-risk the buy. Editable in Admin → Homepage → Process.
 */

export type ProcessProps = {
  eyebrow: string;
  heading: string;
  intro: string;
  steps: { title: string; body: string; tag: string }[];
};

export default function Process({ eyebrow, heading, intro, steps }: ProcessProps) {
  return (
    <section id="process" className="border-t border-hairline bg-[var(--app-muted)]" aria-labelledby="process-heading">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <header className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mono-eyebrow text-muted-foreground">{eyebrow}</p>
            <h2 id="process-heading" className="display-xl mt-4 text-foreground">
              {heading}
            </h2>
          </div>
          <p className="text-[16px] leading-[1.5] text-muted-foreground lg:col-span-5 lg:self-end">
            {intro}
          </p>
        </header>

        <Reveal className="process-rail mt-14">
          <ol style={{ ["--steps" as string]: steps.length }} className="relative grid gap-8 lg:[grid-template-columns:repeat(var(--steps),minmax(0,1fr))] lg:gap-6">
            <span className="process-line pointer-events-none absolute left-[22px] right-[calc(100%/var(--steps))] top-[21px] hidden h-px bg-foreground/25 lg:block" aria-hidden />
            {steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-5 lg:block">
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-foreground/20 bg-white text-[15px] font-medium transition-colors duration-300 hover:bg-[var(--brand-mint)]">
                  {i + 1}
                </span>
                <div className="lg:mt-6">
                  <p className="mono-label text-muted-foreground">{s.tag}</p>
                  <h3 className="display-md mt-2 text-foreground">{s.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
