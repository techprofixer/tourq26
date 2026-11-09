/** Shared Prisma client. */
export { prisma } from "@/lib/prisma";

/**
 * Bounds a DB call to `ms` so callers fall back quickly instead of waiting out
 * MongoDB's ~30s server-selection timeout (which can exceed Next.js's static
 * page generation timeout when a page makes more than one DB call).
 */
export function withDbTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("DB call timed out")), ms)),
  ]);
}

/** Key used by every single-row "settings" model (BrandSettings, Footer, HomePageContent, SiteSettings). */
export const SINGLETON_KEY = "default";

/**
 * Shared shape for reading a single-row settings model: fetch, fall back to `getDefault()` on any
 * DB error or missing row, otherwise map the row onto the DTO via `toDto`.
 */
export async function readSingletonSetting<Row, Dto>(
  fetchRow: () => Promise<Row | null>,
  getDefault: () => Dto,
  toDto: (row: Row, fallback: Dto) => Dto,
): Promise<Dto> {
  const fallback = getDefault();
  let row: Row | null;
  try {
    row = await withDbTimeout(fetchRow());
  } catch {
    return fallback;
  }
  return row ? toDto(row, fallback) : fallback;
}

/** Shared shape for writing a single-row settings model: upsert with matching create/update payloads. */
export async function writeSingletonSetting<Payload extends Record<string, unknown>>(
  upsert: (args: { where: { key: string }; create: { key: string } & Payload; update: Payload }) => Promise<unknown>,
  payload: Payload,
): Promise<void> {
  await upsert({
    where: { key: SINGLETON_KEY },
    create: { key: SINGLETON_KEY, ...payload },
    update: payload,
  });
}
