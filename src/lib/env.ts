const TRUTHY_VALUES = new Set(["true", "1", "yes", "on"]);
const FALSY_VALUES = new Set(["false", "0", "no", "off"]);

/** Parses a loosely-formatted boolean env var (e.g. `MAINTENANCE_MODE=on`, `HUB_BACKEND_FULL=false`).
 *  Falls back to `defaultValue` when unset or unrecognized. */
export function isEnvFlagOn(value: string | undefined, defaultValue: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (TRUTHY_VALUES.has(normalized)) return true;
  if (FALSY_VALUES.has(normalized)) return false;
  return defaultValue;
}
