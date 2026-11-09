import { readSiteContent } from "@/lib/content";

/**
 * IndexNow (https://www.indexnow.org) — push changed URLs to Bing, Yandex, Seznam, Naver & co.
 * instead of waiting for a recrawl. Bing's index also feeds ChatGPT Search and Copilot, so this is
 * the fastest path for new/updated pages to show up in AI answers.
 *
 * Enabled only when INDEXNOW_KEY is set (8–128 chars of [a-zA-Z0-9-]). The key is served at
 * /indexnow-key.txt (src/app/indexnow-key.txt/route.ts) so engines can verify ownership.
 * Deleted / unpublished URLs should be submitted too — engines recrawl and drop the 404.
 */

const KEY_RE = /^[a-zA-Z0-9-]{8,128}$/;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS = 10_000;

export function getIndexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key && KEY_RE.test(key) ? key : null;
}

/** Builds the IndexNow POST body, or null when there's nothing valid to send. Pure — unit-tested. */
export function buildIndexNowPayload(siteUrl: string, key: string, paths: string[]) {
  let origin: URL;
  try {
    origin = new URL(siteUrl);
  } catch {
    return null;
  }
  if (origin.protocol !== "https:" || /^(localhost|127\.|0\.0\.0\.0)/.test(origin.hostname)) return null;

  const base = origin.origin;
  const urlList = Array.from(
    new Set(
      paths
        .filter((p) => typeof p === "string" && p.startsWith("/"))
        .map((p) => (p === "/" ? base : `${base}${p.replace(/\/$/, "")}`)),
    ),
  ).slice(0, MAX_URLS);
  if (urlList.length === 0) return null;

  return {
    host: origin.hostname,
    key,
    keyLocation: `${base}/indexnow-key.txt`,
    urlList,
  };
}

/**
 * Fire-and-forget submission. Never throws — indexing pings must not fail an admin save.
 * No-ops outside production, without a key, or while the site is set to noindex.
 */
export async function submitToIndexNow(paths: string[]): Promise<void> {
  try {
    if (process.env.NODE_ENV !== "production") return;
    const key = getIndexNowKey();
    if (!key) return;
    const site = await readSiteContent();
    if (site.robotsNoIndex) return;
    const payload = buildIndexNowPayload(site.siteUrl, key, paths);
    if (!payload) return;

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    // 200 = accepted, 202 = accepted pending key validation. Anything else is worth a log line.
    if (res.status !== 200 && res.status !== 202) {
      console.warn(`[indexnow] ${res.status} for ${payload.urlList.length} URL(s)`);
    }
  } catch (e) {
    console.warn("[indexnow] submission failed", e instanceof Error ? e.message : e);
  }
}
