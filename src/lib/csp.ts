/**
 * Content-Security-Policy for the whole site, built in one place.
 *
 * - Public pages are statically generated (ISR), so they can't carry a per-request nonce;
 *   their policy (set in next.config.ts) allows inline scripts but locks every *origin* down:
 *   scripts only from us + Meta Pixel, network calls only to us + Meta, no plugins, no
 *   foreign framing, no <base> or form hijacking.
 * - Admin pages are always rendered per request (they read the session cookie), so the proxy
 *   gives them a strict nonce + 'strict-dynamic' policy: no inline script runs unless Next.js
 *   stamped it with that request's nonce.
 *
 * Adding a third-party script/embed? Add its origin to the matching list below.
 */
const ORIGINS = {
  script: ["https://connect.facebook.net"],
  style: ["https://fonts.googleapis.com"],
  font: ["https://fonts.gstatic.com"],
  // `https:` — chat replies and CMS content may embed images from arbitrary hosts.
  img: ["https:"],
  media: ["https://res.cloudinary.com"],
  connect: ["https://www.facebook.com", "https://connect.facebook.net"],
  frame: ["https://www.youtube-nocookie.com", "https://www.youtube.com"],
};

export function buildCsp({ nonce, isDev }: { nonce?: string; isDev: boolean }): string {
  const scriptSrc = nonce
    ? [`'self'`, `'nonce-${nonce}'`, `'strict-dynamic'`]
    : [`'self'`, `'unsafe-inline'`, ...ORIGINS.script];
  // React needs eval in development for error overlays; never in production.
  if (isDev) scriptSrc.push(`'unsafe-eval'`);

  const directives: Record<string, string[]> = {
    "default-src": [`'self'`],
    "script-src": scriptSrc,
    // Inline style attributes (React style={{}}, the rich-text editor) can't be nonced.
    "style-src": [`'self'`, `'unsafe-inline'`, ...ORIGINS.style],
    "font-src": [`'self'`, "data:", ...ORIGINS.font],
    "img-src": [`'self'`, "data:", "blob:", ...ORIGINS.img],
    "media-src": [`'self'`, ...ORIGINS.media],
    // Dev needs the HMR websocket.
    "connect-src": [`'self'`, ...ORIGINS.connect, ...(isDev ? ["ws:", "wss:"] : [])],
    "frame-src": [`'self'`, ...ORIGINS.frame],
    "object-src": [`'none'`],
    "base-uri": [`'self'`],
    "form-action": [`'self'`],
    "frame-ancestors": [`'self'`],
  };

  const policy = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (!isDev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}
