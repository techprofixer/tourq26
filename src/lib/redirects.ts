import { prisma, withDbTimeout } from "@/lib/db";

export type RedirectDto = {
  id: string;
  fromPath: string;
  toPath: string;
  type: "PERMANENT_301" | "TEMPORARY_302";
  isActive: boolean;
  note: string | null;
};

function toDto(row: {
  id: string;
  fromPath: string;
  toPath: string;
  type: string;
  isActive: boolean;
  note: string | null;
}): RedirectDto {
  return {
    id: row.id,
    fromPath: row.fromPath,
    toPath: row.toPath,
    type: row.type as RedirectDto["type"],
    isActive: row.isActive,
    note: row.note,
  };
}

/** Same-origin path only: must start with a single "/" (rejects "//host", "/\\host", and absolute URLs). */
export function isSafeRedirectPath(path: string): boolean {
  return /^\/(?![\/\\])/.test(path) && !/[\s\\]/.test(path);
}

export async function listRedirects(): Promise<RedirectDto[]> {
  const rows = await prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toDto);
}

export async function createRedirect(input: {
  fromPath: string;
  toPath: string;
  type: RedirectDto["type"];
  note?: string;
}): Promise<RedirectDto> {
  const row = await prisma.redirect.create({
    data: {
      fromPath: input.fromPath,
      toPath: input.toPath,
      type: input.type,
      note: input.note?.trim() || undefined,
    },
  });
  return toDto(row);
}

/**
 * Records a 301 when a live page moves, so its links and rankings follow it. Also collapses
 * chains (anything pointing at `fromPath` now points straight at `toPath`) and drops a stale
 * redirect *from* `toPath`, which would otherwise shadow the page at its new home.
 */
export async function recordPageMove(fromPath: string, toPath: string): Promise<void> {
  if (fromPath === toPath || !isSafeRedirectPath(fromPath) || !isSafeRedirectPath(toPath)) return;
  const note = `Auto: CMS page moved from ${fromPath}`;
  await prisma.$transaction([
    prisma.redirect.deleteMany({ where: { fromPath: toPath } }),
    prisma.redirect.updateMany({ where: { toPath: fromPath }, data: { toPath } }),
    prisma.redirect.upsert({
      where: { fromPath },
      create: { fromPath, toPath, type: "PERMANENT_301", note },
      update: { toPath, type: "PERMANENT_301", isActive: true, note },
    }),
  ]);
}

export async function updateRedirect(
  id: string,
  patch: Partial<{ toPath: string; type: RedirectDto["type"]; isActive: boolean; note: string }>,
): Promise<RedirectDto> {
  const row = await prisma.redirect.update({ where: { id }, data: patch });
  return toDto(row);
}

export async function deleteRedirect(id: string): Promise<void> {
  await prisma.redirect.delete({ where: { id } }).catch(() => {});
}

/** Used by the proxy (src/proxy.ts) — must fail fast and fail open (return null) on any DB hiccup. */
export async function findActiveRedirect(
  pathname: string,
): Promise<{ toPath: string; permanent: boolean } | null> {
  try {
    const row = await withDbTimeout(
      prisma.redirect.findUnique({ where: { fromPath: pathname } }),
      2000,
    );
    if (!row || !row.isActive) return null;
    return { toPath: row.toPath, permanent: row.type === "PERMANENT_301" };
  } catch {
    return null;
  }
}
