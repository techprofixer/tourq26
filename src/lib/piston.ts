/**
 * Piston code execution (https://emkc.org) — sandboxed runs for DSA practice.
 */

export type PistonLanguage = "javascript" | "python" | "java" | "cpp" | "go";

const PISTON_URL = "https://emkc.org/api/v2/piston";

const LANGUAGE_ALIASES: Record<PistonLanguage, string> = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
  go: "go",
};

let runtimeCache: Map<string, string> | null = null;

async function resolveVersion(language: PistonLanguage): Promise<string> {
  if (!runtimeCache) {
    const res = await fetch(`${PISTON_URL}/runtimes`);
    if (!res.ok) throw new Error("Piston runtimes unavailable");
    const data = (await res.json()) as Array<{ language: string; version: string }>;
    runtimeCache = new Map();
    for (const r of data) {
      const key = r.language.toLowerCase();
      if (!runtimeCache.has(key)) runtimeCache.set(key, r.version);
    }
  }
  const alias = LANGUAGE_ALIASES[language];
  const v = runtimeCache.get(alias);
  return v ?? "*";
}

export type PistonResult = {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
};

export async function runPiston(
  language: PistonLanguage,
  content: string,
  filename = "main",
): Promise<PistonResult> {
  const ext =
    language === "javascript"
      ? "js"
      : language === "python"
        ? "py"
        : language === "java"
          ? "java"
          : language === "cpp"
            ? "cpp"
            : "go";
  const version = await resolveVersion(language);
  const res = await fetch(`${PISTON_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: LANGUAGE_ALIASES[language],
      version,
      files: [{ name: `${filename}.${ext}`, content }],
    }),
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Piston error ${res.status}: ${text}`);
  }
  const json = (await res.json()) as {
    run?: { stdout?: string; stderr?: string; code?: number; signal?: string };
  };
  const run = json.run ?? {};
  return {
    stdout: (run.stdout ?? "").trim(),
    stderr: (run.stderr ?? "").trim(),
    code: run.code ?? null,
    signal: run.signal ?? null,
  };
}
