"use client";

import { useId, useState } from "react";
import { MAX_CONTACT_MESSAGE_LENGTH } from "@/lib/constants";
import { readStoredUtmParams } from "@/lib/utm";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import {
  CONTACT_CATEGORIES,
  CONTACT_EMAIL,
  PROJECT_TOPICS,
  buildWhatsAppMessage,
  topicLabel,
  type CategoryKey,
} from "@/lib/contact-topics";

type FormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  topic: string;
  message: string;
  website: string;
};
type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;
type Mode = "whatsapp" | "email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Headroom for the "Topic / Phone / Source" header we prepend to the stored message. */
const META_HEADROOM = 300;
const MAX_MESSAGE = MAX_CONTACT_MESSAGE_LENGTH - META_HEADROOM;

function validate(data: FormData, mode: Mode): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.name.trim()) errors.name = "Please enter your name.";
  // WhatsApp delivers the message directly, so email is only mandatory for the email route.
  if (mode === "email" || data.email.trim()) {
    if (!data.email.trim()) errors.email = "Please enter your email.";
    else if (!EMAIL_RE.test(data.email.trim())) errors.email = "Enter a valid email address.";
  }
  if (!data.message.trim()) errors.message = "Tell us a little about the project.";
  return errors;
}

/**
 * Contact form. Primary action sends the enquiry to WhatsApp (pre-filled chat) and, when an email
 * was given, also records it as a lead. The secondary action emails/stores it without WhatsApp.
 * `category` / `from` arrive from the per-category contact blocks so leads carry page context.
 */
export default function ContactForm({
  initialTopic = "",
  category,
  from,
}: {
  initialTopic?: string;
  category?: string;
  from?: string;
}) {
  const categoryLabel = category && category in CONTACT_CATEGORIES ? CONTACT_CATEGORIES[category as CategoryKey].label : undefined;
  const [status, setStatus] = useState<"idle" | "sending" | "email-sent" | "wa-opened" | "error">("idle");
  const [waLink, setWaLink] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    topic: topicLabel(initialTopic) ? initialTopic : "",
    message: "",
    website: "",
  });
  const waAvailable = Boolean(buildWhatsAppUrl("x"));

  const setField = (key: keyof FormData) => (value: string) => {
    setFormData((p) => ({ ...p, [key]: value }));
    setErrors((p) => (p[key as keyof FieldErrors] ? { ...p, [key]: undefined } : p));
  };

  const fail = (next: FieldErrors) => {
    setErrors(next);
    document.getElementById(next.name ? "name" : next.email ? "email" : "message")?.focus();
  };

  /** Stores the enquiry as a lead via the existing API. Header lines keep topic/phone/source with it. */
  const saveLead = (keepalive: boolean) => {
    const utm = readStoredUtmParams();
    const header = [
      formData.topic && `Topic: ${topicLabel(formData.topic)}`,
      formData.phone.trim() && `Phone: ${formData.phone.trim()}`,
      categoryLabel && `Page: ${categoryLabel}${from ? ` (${from})` : ""}`,
    ].filter(Boolean);
    return fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive,
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        company: formData.company || undefined,
        message: header.length ? `${header.join("\n")}\n\n${formData.message}` : formData.message,
        website: formData.website,
        utmSource: utm?.utmSource,
        utmMedium: utm?.utmMedium,
        utmCampaign: utm?.utmCampaign,
        utmTerm: utm?.utmTerm,
        utmContent: utm?.utmContent,
        landingPage: utm?.landingPage,
      }),
    });
  };

  const sendWhatsApp = () => {
    const next = validate(formData, "whatsapp");
    if (Object.keys(next).length) return fail(next);
    const url = buildWhatsAppUrl(
      buildWhatsAppMessage({
        name: formData.name.trim(),
        company: formData.company.trim(),
        topic: topicLabel(formData.topic),
        category: categoryLabel,
        from,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        message: formData.message,
      }),
    );
    if (!url) return sendEmail();
    // Must happen synchronously inside the click so popup blockers allow it.
    window.open(url, "_blank", "noopener,noreferrer");
    setWaLink(url);
    setStatus("wa-opened");
    // Also keep a record when we have an email (best-effort; never blocks the WhatsApp hand-off).
    if (EMAIL_RE.test(formData.email.trim())) void saveLead(true).catch(() => {});
  };

  const sendEmail = async () => {
    const next = validate(formData, "email");
    if (Object.keys(next).length) return fail(next);
    setStatus("sending");
    setErrorMessage("");
    try {
      const res = await saveLead(false);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(
          typeof data.error === "string"
            ? data.error
            : `Something went wrong. Please try again or email ${CONTACT_EMAIL}.`,
        );
        return;
      }
      setStatus("email-sent");
    } catch {
      setStatus("error");
      setErrorMessage(`Something went wrong. Please try again or email ${CONTACT_EMAIL}.`);
    }
  };

  const reset = () => {
    setStatus("idle");
    setFormData((p) => ({ ...p, message: "" }));
    setErrors({});
  };

  const remaining = MAX_MESSAGE - formData.message.length;
  const nearLimit = remaining <= MAX_MESSAGE * 0.1;

  if (status === "email-sent" || status === "wa-opened") {
    const wa = status === "wa-opened";
    return (
      <div role="status" className="flex flex-col items-start gap-4 py-6">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: wa ? "var(--app-whatsapp)" : "var(--app-success)" }}
          aria-hidden
        >
          {wa ? (
            <WhatsAppIcon className="h-6 w-6" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <div>
          <p className="display-sm text-foreground">{wa ? "Opening WhatsApp…" : "Message sent."}</p>
          <p className="mt-2 max-w-md text-[15px] leading-[1.55] text-muted-foreground">
            {wa
              ? "Your message is pre-filled — just press send in WhatsApp. We'll reply there."
              : "Thanks — we've received it and will reply within 24 hours at the email address you gave us."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {wa ? (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-base btn-primary">
              WhatsApp didn&rsquo;t open? Tap here
            </a>
          ) : null}
          <button type="button" onClick={reset} className="btn-base btn-outline">
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (waAvailable) sendWhatsApp();
        else void sendEmail();
      }}
      className="relative space-y-6"
      noValidate
    >
      {/* Honeypot — off-screen rather than display:none so bots still fill it. */}
      <div aria-hidden className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={formData.website} onChange={(e) => setField("website")(e.target.value)} />
      </div>

      <fieldset>
        <legend className="mono-label text-muted-foreground">WHAT ARE YOU LOOKING FOR?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {PROJECT_TOPICS.map((t) => {
            const on = formData.topic === t.key;
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                onClick={() => setField("topic")(on ? "" : t.key)}
                className={`mono-label rounded-full border px-4 py-2.5 transition-all duration-200 ${
                  on
                    ? "border-foreground bg-foreground text-white"
                    : "border-black/15 text-foreground hover:-translate-y-px hover:border-foreground"
                }`}
              >
                {t.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Name" required autoComplete="name" value={formData.name} onChange={setField("name")} placeholder="Your name" error={errors.name} />
        <Field id="company" label="Company" autoComplete="organization" value={formData.company} onChange={setField("company")} placeholder="Optional" />
        <Field id="email" label="Email" type="email" required={!waAvailable} autoComplete="email" value={formData.email} onChange={setField("email")} placeholder="you@company.com" error={errors.email} />
        <Field id="phone" label="Phone / WhatsApp" type="tel" autoComplete="tel" value={formData.phone} onChange={setField("phone")} placeholder="Optional" />
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="message" className="mono-label block text-muted-foreground">
            PROJECT DETAILS <span className="text-foreground">*</span>
          </label>
          <span className="mono-label" style={{ color: nearLimit ? "var(--app-destructive)" : "var(--app-muted-fg)" }}>
            {formData.message.length}/{MAX_MESSAGE}
          </span>
        </div>
        <textarea
          id="message"
          required
          rows={6}
          maxLength={MAX_MESSAGE}
          value={formData.message}
          onChange={(e) => setField("message")(e.target.value)}
          className="text-input mt-2 min-h-[160px] resize-y"
          placeholder="Current stage, stack, target users, timeline, budget band — whatever you know."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message ? (
          <p id="message-error" role="alert" className="mt-1.5 text-[13px] text-[color:var(--app-destructive)]">
            {errors.message}
          </p>
        ) : null}
      </div>

      {status === "error" && (
        <p className="text-[14px] text-[color:var(--app-destructive)]" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:flex-wrap sm:items-center">
        {waAvailable ? (
          <>
            <button type="submit" className="btn-base btn-shine !bg-whatsapp !px-7 !py-4 text-white hover:brightness-95">
              <WhatsAppIcon className="h-5 w-5" /> Send on WhatsApp
            </button>
            <button type="button" onClick={() => void sendEmail()} disabled={status === "sending"} className="btn-base btn-outline !py-4">
              {status === "sending" ? "Sending…" : "Send by email instead"}
            </button>
          </>
        ) : (
          <button type="submit" disabled={status === "sending"} className="btn-base btn-primary !py-4">
            {status === "sending" ? "Sending…" : "Send message"}
          </button>
        )}
        <span className="mono-label text-muted-foreground sm:ml-auto">NO COMMITMENT · 24 HOUR REPLY</span>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  required = false,
  autoComplete,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const errorId = useId();
  return (
    <div>
      <label htmlFor={id} className="mono-label block text-muted-foreground">
        {label.toUpperCase()}
        {required ? <span className="ml-1 text-foreground">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-input mt-2"
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        style={error ? { borderColor: "var(--app-destructive)" } : undefined}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] text-[color:var(--app-destructive)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
