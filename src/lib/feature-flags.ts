import { readFeatureFlagsDocument, writeFeatureFlagsDocument } from "@/lib/content";
import {
  FEATURE_FLAG_DEFINITIONS,
  FEATURE_FLAG_KEYS,
  resolveFeatureFlagsFromStored,
  type FeatureFlagDefinition,
  type FeatureFlagKey,
} from "@/lib/feature-flags-schema";

export {
  FEATURE_FLAG_DEFINITIONS,
  FEATURE_FLAG_KEYS,
  type FeatureFlagDefinition,
  type FeatureFlagKey,
} from "@/lib/feature-flags-schema";

const CACHE_TTL_MS = 30_000;
type FlagsCache = { flags: Record<FeatureFlagKey, boolean>; expiresAt: number } | null;

/**
 * Next.js dev (Turbopack) can give route handlers and pages separate module
 * instances, so a plain module-level variable isn't reliably shared between
 * them — same reason `src/lib/hub/prisma.ts` stashes its singleton on `globalThis`.
 */
const globalForFlags = globalThis as unknown as { featureFlagsCache?: FlagsCache };

/** Reads through a short in-memory cache — this runs on every request via middleware. */
export async function getResolvedFeatureFlags(): Promise<Record<FeatureFlagKey, boolean>> {
  const cache = globalForFlags.featureFlagsCache;
  if (cache && cache.expiresAt > Date.now()) return cache.flags;
  const doc = await readFeatureFlagsDocument();
  const flags = resolveFeatureFlagsFromStored(doc?.values ?? {});
  globalForFlags.featureFlagsCache = { flags, expiresAt: Date.now() + CACHE_TTL_MS };
  return flags;
}

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const all = await getResolvedFeatureFlags();
  return all[key];
}

export async function saveFeatureFlagValues(
  values: Partial<Record<FeatureFlagKey, boolean>>,
): Promise<Record<FeatureFlagKey, boolean>> {
  const current = await getResolvedFeatureFlags();
  const next: Record<FeatureFlagKey, boolean> = { ...current };
  for (const k of FEATURE_FLAG_KEYS) {
    if (typeof values[k] === "boolean") next[k] = values[k]!;
  }
  await writeFeatureFlagsDocument({
    values: next,
    updatedAt: new Date().toISOString(),
  });
  globalForFlags.featureFlagsCache = null;
  return next;
}

export function isValidFeatureFlagKey(k: string): k is FeatureFlagKey {
  return (FEATURE_FLAG_KEYS as readonly string[]).includes(k);
}

export function getFeatureFlagCatalogForAdmin(): FeatureFlagDefinition[] {
  return [...FEATURE_FLAG_DEFINITIONS];
}
