const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
/** If the env value is 10 digits (local mobile), prepend this country code (no +). Default 91 = India. Set NEXT_PUBLIC_WHATSAPP_PREFIX=1 for US, etc. */
const PREFIX =
  (typeof process.env.NEXT_PUBLIC_WHATSAPP_PREFIX === "string"
    ? process.env.NEXT_PUBLIC_WHATSAPP_PREFIX.replace(/\D/g, "")
    : "") || "91";

/**
 * WhatsApp expects full international number, digits only, no + or leading 0
 * (e.g. India: 919876543210).
 */
function normalizeWhatsAppDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  // Common paste: "0" + 10-digit local → drop leading zeros then re-check
  digits = digits.replace(/^0+/, "");

  // Exactly 10 digits → treat as local mobile, add country prefix
  if (digits.length === 10 && PREFIX) {
    digits = PREFIX + digits;
  }

  // Still starts with 0 after trim (unusual) — strip again
  digits = digits.replace(/^0+/, "");

  return digits;
}

/** Returns "" when NEXT_PUBLIC_WHATSAPP_NUMBER is unset/invalid — callers should hide the CTA in that case. */
export function buildWhatsAppUrl(message: string): string {
  const number = normalizeWhatsAppDigits(WHATSAPP_NUMBER);
  // WhatsApp requires at least country code + national significant number (typically 11–15 digits total)
  if (number.length < 11) return "";

  const text = encodeURIComponent(message);
  // api.whatsapp.com is the documented link format; wa.me sometimes hangs with invalid numbers
  return `https://api.whatsapp.com/send?phone=${number}&text=${text}`;
}
