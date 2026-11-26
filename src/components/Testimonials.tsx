import Reveal from "@/components/motion/Reveal";

export type TestimonialItem = {
  id?: string;
  quote: string;
  result: string;
  name: string;
  role: string;
  company: string;
  rating: number;
};

const defaultTestimonials: TestimonialItem[] = [
  {
    quote:
      "Torq Studio delivered our mobile app on time and under budget. The team understood our vision from day one and the quality exceeded our expectations.",
    result: "On time, under budget",
    name: "Sarah Al-Rashid",
    role: "Product Director",
    company: "FinTech, UAE",
    rating: 5,
  },
  {
    quote:
      "We needed a partner who could scale with us. Their remote developers integrated seamlessly and we cut our development costs significantly without compromising on delivery.",
    result: "Costs cut, delivery intact",
    name: "Marcus Weber",
    role: "CTO",
    company: "E-commerce, Germany",
    rating: 5,
  },
  {
    quote:
      "From concept to launch, Torq Studio was professional and responsive. The AI solution they built has transformed how we handle customer support.",
    result: "Transformed our operations",
    name: "Layla Hassan",
    role: "Operations Lead",
    company: "Logistics, Saudi Arabia",
    rating: 5,
  },
];

type Props = { items?: TestimonialItem[]; eyebrow?: string; heading?: string; intro?: string };

/**
 * Testimonials (DESIGN.md → testimonial-card).
 * Light band, 3-up of hairline-bordered cards. Each card has a quote, a mono
 * "result" caption, and a portrait + display-md name row at the bottom.
 */
export default function Testimonials({
  items,
  eyebrow = "CLIENT VOICE",
  heading = "Teams that shipped with us.",
  intro = "Founders, CTOs, and operations leads on what changed in their stack after we shipped — and what they kept.",
}: Props) {
  const testimonials = items?.length ? items : defaultTestimonials;
  return (
    <section
      id="testimonials"
      className="band-light border-t border-hairline"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <header className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mono-eyebrow text-muted-foreground">{eyebrow}</p>
            <h2 id="testimonials-heading" className="display-xl mt-4 text-foreground">
              {heading}
            </h2>
          </div>
          <p className="text-[16px] leading-[1.5] text-muted-foreground lg:col-span-5 lg:self-end">
            {intro}
          </p>
        </header>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <li key={t.id ?? t.name}>
              <Reveal delay={i * 90} className="h-full">
              <div className="card-flat card-hover flex h-full flex-col">
              <p className="text-[15px] tracking-[0.15em] text-[var(--brand-mint)]" aria-label={`${t.rating} out of 5`}>
                {"★".repeat(Math.max(0, Math.min(5, t.rating || 5)))}
              </p>
              <blockquote className="mt-4 flex-1 text-[16px] leading-[1.5] tracking-[-0.005em] text-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-4 border-t border-hairline pt-5">
                <span
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-canvas-dark)] text-[14px] font-medium text-white"
                >
                  {t.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="display-sm truncate text-foreground">{t.name}</p>
                  <p className="mono-label truncate text-muted-foreground">
                    {t.role.toUpperCase()} · {t.company.toUpperCase()}
                  </p>
                </div>
              </div>
              <p className="mono-label mt-4 text-muted-foreground">RESULT · {t.result.toUpperCase()}</p>
              </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
