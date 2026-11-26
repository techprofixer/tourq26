import Link from "next/link";

/**
 * Homepage editorial (DESIGN.md → display sans body, mono-caps eyebrows,
 * left-aligned within a 12-col grid). Long-form copy improves text-to-code
 * ratio and reads as the "research" voice on the brand surface.
 */

const SECTION_LINK =
  "text-foreground underline decoration-[var(--app-hairline)] underline-offset-[3px] transition-colors hover:decoration-[var(--app-fg)]";

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

        <div className="mt-16 grid gap-10 border-t border-hairline pt-16 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="mono-eyebrow text-muted-foreground">ENGAGEMENT MODELS</p>
            <h3 className="display-lg mt-4 text-foreground">Match the model to the risk.</h3>
          </div>
          <ul className="space-y-6 lg:col-span-8 lg:max-w-[680px]">
            <li>
              <p className="mono-label text-muted-foreground">FIXED-SCOPE MVP</p>
              <p className="mt-2 text-[16px] leading-[1.6] text-muted-foreground">
                Bounded scope with written acceptance criteria. Finance and leadership get predictable
                spend and a clear definition of done.
              </p>
            </li>
            <li>
              <p className="mono-label text-muted-foreground">RETAINER OR EMBEDDED SQUAD</p>
              <p className="mt-2 text-[16px] leading-[1.6] text-muted-foreground">
                Steady velocity on features, hardening, and integrations — often a better fit than
                endless change orders once you are past v1.
              </p>
            </li>
            <li>
              <p className="mono-label text-muted-foreground">PAID DISCOVERY · ADVISORY</p>
              <p className="mt-2 text-[16px] leading-[1.6] text-muted-foreground">
                Short blocks where we document the system, flag risks, and produce a roadmap before
                recommending any build option.
              </p>
            </li>
          </ul>
        </div>

        <div className="mt-16 grid gap-10 border-t border-hairline pt-16 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="mono-eyebrow text-muted-foreground">WHERE WE ADD VALUE</p>
            <h3 className="display-lg mt-4 text-foreground">High-stakes delivery surfaces.</h3>
          </div>
          <div className="space-y-5 text-[16px] leading-[1.6] text-muted-foreground lg:col-span-8 lg:max-w-[680px]">
            <p>
              Teams usually bring us in when delivery risk is high: consumer or B2B mobile apps that
              must pass store review and handle real traffic; web platforms where SEO, performance,
              and admin UX all matter; public or partner APIs that cannot break existing
              integrations; and AI-assisted workflows that need evaluation metrics — not a chatbot
              demo that falls apart in production.
            </p>
            <p>
              We are not the right fit when you need a generic &ldquo;we do everything&rdquo; vendor, a
              race-to-the-bottom quote with no ownership, or a team that will disappear after handover
              without documentation. If your goal is lowest hourly rate regardless of outcome, you
              will find cheaper options — we optimize for{" "}
              <strong className="font-medium text-foreground">senior judgment</strong>,{" "}
              <strong className="font-medium text-foreground">maintainable code</strong>, and{" "}
              <strong className="font-medium text-foreground">clear accountability</strong>.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-10 border-t border-hairline pt-16 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="mono-eyebrow text-muted-foreground">TERMS BUYERS ASK ABOUT</p>
            <h3 className="display-lg mt-4 text-foreground">Working glossary.</h3>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2 lg:col-span-8">
            {[
              {
                term: "MVP (minimum viable product)",
                def: "The smallest version that proves value to users and stakeholders, with explicit out-of-scope items so the timeline is defensible.",
              },
              {
                term: "Technical debt",
                def: "Shortcuts taken under time pressure; we help you decide when to pay it down versus when it is acceptable risk for a learning phase.",
              },
              {
                term: "API versioning",
                def: "A strategy so mobile apps and partners can migrate without surprise breaking changes — often paired with documentation and sunset timelines.",
              },
              {
                term: "Retrieval-augmented AI",
                def: "Patterns where a model is grounded in your approved content or tools instead of hallucinating policies or live data it cannot see.",
              },
              {
                term: "Embedded team",
                def: "Engineers who work inside your rituals and systems with shared ownership, as opposed to throwing specs over a wall every sprint.",
              },
              {
                term: "Production readiness",
                def: "Checklist-style concerns: backups, secrets handling, rate limits, monitoring, rollback paths, and support expectations after launch.",
              },
            ].map((item) => (
              <div key={item.term} className="card-flat">
                <dt className="display-sm text-foreground">{item.term}</dt>
                <dd className="mt-2 text-[15px] leading-[1.55] text-muted-foreground">
                  {item.def}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-16 border-t border-hairline pt-10 text-[16px] leading-[1.6] text-muted-foreground">
          Detailed write-ups live on the{" "}
          <Link className={SECTION_LINK} href="/case-studies">
            case studies
          </Link>{" "}
          page. Explore{" "}
          <Link className={SECTION_LINK} href="/services">
            services and FAQs
          </Link>
          , browse the{" "}
          <Link className={SECTION_LINK} href="/blog">
            blog
          </Link>{" "}
          for longer-form guides, download{" "}
          <Link className={SECTION_LINK} href="/freebies">
            free checklists and templates
          </Link>
          , or{" "}
          <Link className={SECTION_LINK} href="/contact">
            book a free consultation
          </Link>{" "}
          to discuss your roadmap.
        </div>
      </div>
    </section>
  );
}
