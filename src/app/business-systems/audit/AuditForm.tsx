"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BUSINESS_TYPE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  CURRENT_PROBLEM_OPTIONS,
  REQUESTED_SERVICE_OPTIONS,
  BUDGET_OPTIONS,
  TIMELINE_OPTIONS,
} from "@/lib/business-systems/options";
import { MAX_MESSAGE_LENGTH } from "@/lib/business-systems/schema";
import { SingleSelectGrid, MultiSelectGrid } from "./OptionGrid";
import { readStoredUtmParams } from "@/lib/business-systems/utm";
import { track, type AnalyticsEvent } from "@/lib/analytics";
import { trackPixelEvent } from "@/lib/meta-pixel";

type FormState = {
  businessType: string;
  teamSize: string;
  currentProblems: string[];
  requestedServices: string[];
  budget: string;
  timeline: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyWebsite: string;
  message: string;
  website: string; // honeypot — must stay empty
};

const INITIAL_STATE: FormState = {
  businessType: "",
  teamSize: "",
  currentProblems: [],
  requestedServices: [],
  budget: "",
  timeline: "",
  name: "",
  email: "",
  phone: "",
  companyName: "",
  companyWebsite: "",
  message: "",
  website: "",
};

const STEP_LABELS = ["Business", "Problem", "Solution", "Budget", "Timeline", "Contact", "Details"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STEP_EVENTS: AnalyticsEvent[] = [
  "audit_form_step_1",
  "audit_form_step_2",
  "audit_form_step_3",
  "audit_form_step_4",
  "audit_form_step_5",
  "audit_form_step_6",
  "audit_form_step_7",
];

function validateStep(step: number, data: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  switch (step) {
    case 0:
      if (!data.businessType) errors.businessType = "Please select an option.";
      if (!data.teamSize) errors.teamSize = "Please select an option.";
      break;
    case 1:
      if (data.currentProblems.length === 0) errors.currentProblems = "Select at least one option.";
      break;
    case 2:
      if (data.requestedServices.length === 0) errors.requestedServices = "Select at least one option.";
      break;
    case 3:
      if (!data.budget) errors.budget = "Please select a budget range.";
      break;
    case 4:
      if (!data.timeline) errors.timeline = "Please select a timeline.";
      break;
    case 5:
      if (!data.name.trim()) errors.name = "Please enter your name.";
      if (!data.email.trim()) errors.email = "Please enter your work email.";
      else if (!EMAIL_RE.test(data.email.trim())) errors.email = "Enter a valid email address.";
      if (!data.phone.trim()) errors.phone = "Please enter your phone/WhatsApp number.";
      if (!data.companyName.trim()) errors.companyName = "Please enter your company name.";
      break;
    default:
      break;
  }
  return errors;
}

export default function AuditForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    track("audit_form_start");
  }, []);

  const setField = <K extends keyof FormState>(key: K) => (value: FormState[K]) => {
    setData((p) => ({ ...p, [key]: value }));
    setErrors((p) => (p[key] ? { ...p, [key]: undefined } : p));
  };

  const goNext = () => {
    const stepErrors = validateStep(step, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    const nextStep = step + 1;
    setStep(nextStep);
    track(STEP_EVENTS[nextStep]);
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async () => {
    setStatus("submitting");
    setErrorMessage("");
    track("audit_form_complete");

    const utm = readStoredUtmParams();
    try {
      const res = await fetch("/api/business-systems/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          companyName: data.companyName,
          companyWebsite: data.companyWebsite || undefined,
          businessType: data.businessType,
          teamSize: data.teamSize,
          currentProblems: data.currentProblems,
          requestedServices: data.requestedServices,
          budget: data.budget,
          timeline: data.timeline,
          message: data.message || undefined,
          website: data.website,
          utmSource: utm?.utmSource,
          utmMedium: utm?.utmMedium,
          utmCampaign: utm?.utmCampaign,
          utmTerm: utm?.utmTerm,
          utmContent: utm?.utmContent,
          landingPage: utm?.landingPage,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(
          typeof result.error === "string"
            ? result.error
            : "Something went wrong. Please try again or email connect@torqstudio.com.",
        );
        return;
      }
      track("lead_submitted");
      trackPixelEvent("Lead");
      router.push("/business-systems/audit/success");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again or email connect@torqstudio.com.");
    }
  };

  const isLastStep = step === STEP_LABELS.length - 1;

  return (
    <div>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <span className="mono-label text-muted-foreground">
            STEP {step + 1} OF {STEP_LABELS.length} · {STEP_LABELS[step].toUpperCase()}
          </span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-hairline">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-300"
            style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {step === 0 ? (
          <>
            <StepQuestion label="What best describes your business?" error={errors.businessType}>
              <SingleSelectGrid options={BUSINESS_TYPE_OPTIONS} value={data.businessType} onChange={setField("businessType")} />
            </StepQuestion>
            <StepQuestion label="How large is your team?" error={errors.teamSize}>
              <SingleSelectGrid options={TEAM_SIZE_OPTIONS} value={data.teamSize} onChange={setField("teamSize")} />
            </StepQuestion>
          </>
        ) : null}

        {step === 1 ? (
          <StepQuestion label="What's currently slowing your business down?" error={errors.currentProblems}>
            <MultiSelectGrid
              options={CURRENT_PROBLEM_OPTIONS}
              values={data.currentProblems}
              onChange={setField("currentProblems")}
            />
          </StepQuestion>
        ) : null}

        {step === 2 ? (
          <StepQuestion label="What are you looking to build or improve?" error={errors.requestedServices}>
            <MultiSelectGrid
              options={REQUESTED_SERVICE_OPTIONS}
              values={data.requestedServices}
              onChange={setField("requestedServices")}
            />
          </StepQuestion>
        ) : null}

        {step === 3 ? (
          <StepQuestion label="What's your approximate budget for this project?" error={errors.budget}>
            <SingleSelectGrid options={BUDGET_OPTIONS} value={data.budget} onChange={setField("budget")} />
          </StepQuestion>
        ) : null}

        {step === 4 ? (
          <StepQuestion label="When are you looking to start?" error={errors.timeline}>
            <SingleSelectGrid options={TIMELINE_OPTIONS} value={data.timeline} onChange={setField("timeline")} />
          </StepQuestion>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="name" label="Name" required autoComplete="name" value={data.name} onChange={setField("name")} error={errors.name} />
            <Field
              id="email"
              label="Work email"
              required
              type="email"
              autoComplete="email"
              value={data.email}
              onChange={setField("email")}
              error={errors.email}
            />
            <Field
              id="phone"
              label="Phone / WhatsApp"
              required
              type="tel"
              autoComplete="tel"
              value={data.phone}
              onChange={setField("phone")}
              error={errors.phone}
            />
            <Field
              id="companyName"
              label="Company name"
              required
              autoComplete="organization"
              value={data.companyName}
              onChange={setField("companyName")}
              error={errors.companyName}
            />
            <Field
              id="companyWebsite"
              label="Website (optional)"
              autoComplete="url"
              value={data.companyWebsite}
              onChange={setField("companyWebsite")}
              className="sm:col-span-2"
            />
            {/* Honeypot — hidden from sighted/keyboard users via off-screen positioning, not display:none (bots skip display:none fields). */}
            <div aria-hidden className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={data.website}
                onChange={(e) => setField("website")(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 6 ? (
          <div>
            <label htmlFor="message" className="mono-label block text-muted-foreground">
              WHAT&apos;S THE BIGGEST OPERATIONAL PROBLEM YOU&apos;D LIKE US TO SOLVE? (OPTIONAL)
            </label>
            <textarea
              id="message"
              rows={5}
              maxLength={MAX_MESSAGE_LENGTH}
              value={data.message}
              onChange={(e) => setField("message")(e.target.value)}
              className="text-input mt-2 min-h-[140px] resize-y"
              placeholder="Tell us what's slowing your team down day to day…"
            />
          </div>
        ) : null}

        {status === "error" ? (
          <p className="text-[14px] text-[color:var(--app-destructive)]" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-hairline pt-6">
          {step > 0 ? (
            <button type="button" onClick={goBack} className="btn-base btn-outline">
              Back
            </button>
          ) : (
            <span />
          )}
          {isLastStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === "submitting"}
              className="btn-base btn-primary min-h-[48px] min-w-[160px]"
            >
              {status === "submitting" ? "Submitting…" : "Submit"}
            </button>
          ) : (
            <button type="button" onClick={goNext} className="btn-base btn-primary min-h-[48px] min-w-[140px]">
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepQuestion({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="display-sm text-foreground">{label}</h2>
      <div className="mt-5">{children}</div>
      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-[color:var(--app-destructive)]">
          {error}
        </p>
      ) : null}
    </div>
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
  error,
  className,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  className?: string;
}) {
  const errorId = useId();
  return (
    <div className={className}>
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
        className="text-input mt-2 min-h-[48px]"
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
