"use client";

import { useId, useState } from "react";
import { MAX_CONTACT_MESSAGE_LENGTH } from "@/lib/constants";
import { readStoredUtmParams } from "@/lib/utm";

type FormData = { name: string; email: string; company: string; message: string };
type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.name.trim()) errors.name = "Please enter your name.";
  if (!data.email.trim()) errors.email = "Please enter your email.";
  else if (!EMAIL_RE.test(data.email.trim())) errors.email = "Enter a valid email address.";
  if (!data.message.trim()) errors.message = "Tell us a little about the project.";
  return errors;
}

/**
 * Marketing contact form (DESIGN.md → text-input + button-primary).
 * Flat, hairline-bordered inputs; primary black/white CTA at the bottom.
 */
export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<FormData>({ name: "", email: "", company: "", message: "" });

  const setField = (key: keyof FormData) => (value: string) => {
    setFormData((p) => ({ ...p, [key]: value }));
    setErrors((p) => (p[key as keyof FieldErrors] ? { ...p, [key]: undefined } : p));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(formData);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      document
        .getElementById(nextErrors.name ? "name" : nextErrors.email ? "email" : "message")
        ?.focus();
      return;
    }

    setStatus("sending");
    setErrorMessage("");
    const utm = readStoredUtmParams();
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company || undefined,
          message: formData.message,
          utmSource: utm?.utmSource,
          utmMedium: utm?.utmMedium,
          utmCampaign: utm?.utmCampaign,
          utmTerm: utm?.utmTerm,
          utmContent: utm?.utmContent,
          landingPage: utm?.landingPage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(
          typeof data.error === "string"
            ? data.error
            : "Something went wrong. Please try again or email connect@torqstudio.com.",
        );
        return;
      }
      setStatus("sent");
      setFormData({ name: "", email: "", company: "", message: "" });
      setErrors({});
    } catch {
      setStatus("error");
      setErrorMessage(
        "Something went wrong. Please try again or email connect@torqstudio.com.",
      );
    }
  };

  const remaining = MAX_CONTACT_MESSAGE_LENGTH - formData.message.length;
  const nearLimit = remaining <= MAX_CONTACT_MESSAGE_LENGTH * 0.1;

  if (status === "sent") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 py-6">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--app-success)" }}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <p className="display-sm text-foreground">Message sent.</p>
          <p className="mt-2 max-w-md text-[15px] leading-[1.55] text-muted-foreground">
            Thanks — we&apos;ve received it and will reply within 24 hours at the email
            address you gave us.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="btn-base btn-outline mt-2"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="name"
          label="Name"
          required
          autoComplete="name"
          value={formData.name}
          onChange={setField("name")}
          placeholder="Your name"
          error={errors.name}
        />
        <Field
          id="email"
          label="Email"
          required
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={setField("email")}
          placeholder="you@company.com"
          error={errors.email}
        />
      </div>
      <Field
        id="company"
        label="Company"
        autoComplete="organization"
        value={formData.company}
        onChange={setField("company")}
        placeholder="Your company (optional)"
      />
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="message" className="mono-label block text-muted-foreground">
            MESSAGE <span className="text-foreground">*</span>
          </label>
          <span
            className="mono-label"
            style={{ color: nearLimit ? "var(--app-destructive)" : "var(--app-muted-fg)" }}
          >
            {formData.message.length}/{MAX_CONTACT_MESSAGE_LENGTH}
          </span>
        </div>
        <textarea
          id="message"
          required
          rows={6}
          maxLength={MAX_CONTACT_MESSAGE_LENGTH}
          value={formData.message}
          onChange={(e) => setField("message")(e.target.value)}
          className="text-input mt-2 min-h-[160px] resize-y"
          placeholder="Tell us about your project, timeline, and what you need…"
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
        <p
          className="text-[14px] text-[color:var(--app-destructive)]"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
        <button
          type="submit"
          disabled={status === "sending"}
          className="btn-base btn-primary inline-flex items-center gap-2"
        >
          {status === "sending" ? (
            <>
              <svg
                className="h-3.5 w-3.5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Sending…
            </>
          ) : (
            "Send message"
          )}
        </button>
        <span className="mono-label text-muted-foreground">
          NO COMMITMENT · 24 HOUR REPLY
        </span>
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
