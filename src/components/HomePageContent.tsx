/**
 * Homepage editorial (DESIGN.md → display sans body, mono-caps eyebrows,
 * left-aligned within a 12-col grid). Long-form copy improves text-to-code
 * ratio and reads as the "research" voice on the brand surface.
 */

export default function HomePageContent() {
  return (
    <section
      className="band-light border-t border-hairline"
      aria-labelledby="homepage-about-heading"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <header className="grid gap-6 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="mono-eyebrow text-muted-foreground">ABOUT THE STUDIO</p>
            <h2 id="homepage-about-heading" className="display-xl mt-4 text-foreground">
              Production work with product and engineering teams.
            </h2>
          </div>
          <div className="lg:col-span-8 lg:max-w-[680px]">
            <div className="space-y-5 text-[16px] leading-[1.6] text-muted-foreground">
              <p>
                Torq Studio is a senior-engineering-led practice focused on shipping software you can
                run in production — not slide decks that never become code. Whether you are validating
                an MVP, replacing a fragile legacy stack, or adding capacity without a six-month hiring
                cycle, we start from constraints: timeline, risk, compliance, and the skills you
                already have in-house. That keeps estimates honest and avoids the pattern where scope
                silently doubles after kickoff.
              </p>
              <p>
                Our typical engagements combine <strong className="font-medium text-foreground">mobile applications</strong>,{" "}
                <strong className="font-medium text-foreground">web platforms</strong>,{" "}
                <strong className="font-medium text-foreground">public APIs</strong>, and{" "}
                <strong className="font-medium text-foreground">grounded AI workflows</strong>. We
                work alongside your designers and product owners, join stand-ups, and document
                decisions so your team can maintain the system long term. When advisory is the right
                first step — architecture review, vendor diligence, or rescue assessment — we say so
                up front instead of pushing a build contract you are not ready for.
              </p>
            </div>
          </div>
        </header>
      </div>
    </section>
  );
}
