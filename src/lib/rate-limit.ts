type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 5000;

/**
 * Fixed-window in-memory rate limiter. Scoped to a single warm serverless instance — on
 * Vercel that's a real limit (cold starts / multiple instances each get their own counter),
 * so pair this with a platform-level rule (e.g. Vercel Firewall) for a guarantee that holds
 * across instances. This is the free, zero-infra first line of defense.
 */
export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      for (const [k, b] of buckets) {
        if (now >= b.resetAt) buckets.delete(k);
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client IP for rate-limit keys. Prefers `x-real-ip` (set by Vercel and most
 * reverse proxies, not client-controllable there) over the first `x-forwarded-for` hop.
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
