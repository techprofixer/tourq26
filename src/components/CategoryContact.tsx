import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  CONTACT_CATEGORIES,
  CONTACT_EMAIL,
  buildWhatsAppMessage,
  type CategoryKey,
  type TopicKey,
} from "@/lib/contact-topics";

/**
 * Per-category "contact us" block, rendered at the bottom of every page in a category (services,
 * solutions, industries, technologies, locations, case studies, blog, tech news). Each category has
 * its own headline and pre-filled WhatsApp / email / form context, so the lead arrives already
 * labelled with what the visitor was reading.
 */
export default function CategoryContact({
  category,
  pageTitle,
  path,
  topic,
}: {
  category: CategoryKey;
  /** Title of the page being viewed (omit on hub pages). */
  pageTitle?: string;
  path?: string;
  topic?: TopicKey;
}) {
  const c = CONTACT_CATEGORIES[category];
  const subject = pageTitle ? `${c.label}: ${pageTitle}` : c.label;
  const wa = buildWhatsAppUrl(
    buildWhatsAppMessage({
      category: subject,
      from: path,
      message: `I'd like to talk about ${pageTitle ?? `your ${c.label.toLowerCase()}`}.`,
    }),
  );
  const mail = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Enquiry — ${subject}`)}`;
  const params = new URLSearchParams({ category });
  if (topic) params.set("topic", topic);
  if (path) params.set("from", path);

  return (
    <section
      id="contact-category"
      className="border-t border-hairline bg-[var(--app-muted)]"
      aria-labelledby="category-contact-heading"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <Reveal>
          <div className="grid gap-8 overflow-hidden rounded-[var(--radius-md)] border border-black/10 bg-white p-6 sm:p-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="mono-eyebrow text-muted-foreground">{c.eyebrow}</p>
              <h2 id="category-contact-heading" className="display-lg mt-4 max-w-[26ch] text-foreground">
                {c.headline}
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{c.blurb}</p>
              <p className="mono-label mt-6 text-muted-foreground">FREE 30-MIN CALL · REPLY WITHIN 24 HOURS</p>
            </div>
            <div className="flex flex-col justify-center gap-3 lg:col-span-5">
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-base btn-shine w-full !bg-whatsapp !py-4 text-white hover:brightness-95"
                >
                  <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
                </a>
              ) : null}
              <Link href={`/contact?${params.toString()}`} className="btn-base btn-primary w-full !py-4">
                Send an enquiry →
              </Link>
              <a href={mail} className="mono-label text-center text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                OR EMAIL {CONTACT_EMAIL.toUpperCase()}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
