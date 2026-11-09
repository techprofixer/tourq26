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

/** Used by middleware — must fail fast and fail open (return null) on any DB hiccup. */
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
