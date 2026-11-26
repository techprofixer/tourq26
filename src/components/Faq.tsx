import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import FaqList, { type FaqRendered } from "@/components/FaqList";
import { sanitizeBlogHtml } from "@/lib/blog-sanitize";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buildWhatsAppMessage } from "@/lib/contact-topics";

export type FaqItem = { question: string; answer: string };

const looksLikeHtml = (v: string) => /<\/?[a-z][\s\S]*>/i.test(v);
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const toText = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/**
 * FAQ section (shared by the homepage and CMS FAQ blocks). Left: heading + a "still have questions"
 * contact card (sticky on desktop). Right: searchable numbered accordion. Answers are rendered
 * server-side, so on-page text always matches the page's FAQPage JSON-LD and crawlers see it all.
 */
export default function Faq({
  items,
  heading = "Questions teams ask before we talk.",
  intro = "Straight answers on scope, pricing, timelines and how we work.",
  id = "faq",
  groupName = "home-faq",
  openFirst = false,
}: {
  items: FaqItem[];
  heading?: string;
  intro?: string;
  id?: string;
  /** Shared `name` makes the accordion exclusive; must be unique per FAQ on a page. */
  groupName?: string;
  openFirst?: boolean;
}) {
  if (items.length === 0) return null;

  const rendered: FaqRendered[] = items.map((f) => {
    const html = looksLikeHtml(f.answer) ? sanitizeBlogHtml(f.answer) : `<p>${escapeHtml(f.answer)}</p>`;
    return { question: f.question, html, text: toText(html) };
  });
  const wa = buildWhatsAppUrl(
    buildWhatsAppMessage({ category: "FAQ", message: "I have a question that wasn't answered in your FAQ." }),
  );

  return (
    <section id={id} className="border-t border-hairline bg-[var(--app-muted)]" aria-labelledby={`${id}-heading`}>
      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-14 lg:px-8 lg:py-[80px]">
        <header className="self-start lg:sticky lg:top-28 lg:col-span-4">
          <p className="mono-eyebrow flex items-center gap-3 text-muted-foreground">
            <span className="h-px w-8 bg-foreground/30" aria-hidden /> FAQ
          </p>
          <h2 id={`${id}-heading`} className="display-xl mt-4 text-foreground">
            {heading}
          </h2>
          {intro ? <p className="mt-4 text-[16px] leading-[1.55] text-muted-foreground">{intro}</p> : null}

          <div className="mt-8 rounded-[var(--radius-md)] border border-black/10 bg-white p-5 sm:p-6">
            <p className="display-sm text-foreground">Still have questions?</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
              Talk to an engineer — free 30-minute call, reply within 24 hours.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-base w-full !bg-whatsapp !py-3.5 text-white hover:brightness-95">
                  <WhatsAppIcon className="h-5 w-5" /> Ask on WhatsApp
                </a>
              ) : null}
              <Link href="/contact" className="btn-base btn-primary w-full !py-3.5">
                Book a call <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </header>

        <Reveal className="lg:col-span-8">
          <FaqList items={rendered} groupName={groupName} openFirst={openFirst} />
        </Reveal>
      </div>
    </section>
  );
}
