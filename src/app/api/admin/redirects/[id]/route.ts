import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/with-admin";
import { updateRedirect, deleteRedirect } from "@/lib/redirects";
import { logActivity } from "@/lib/activity-log";

export const PATCH = withAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    toPath?: string;
    type?: string;
    isActive?: boolean;
    note?: string;
  };
  const redirect = await updateRedirect(id, {
    ...(body.toPath ? { toPath: body.toPath } : {}),
    ...(body.type === "TEMPORARY_302" || body.type === "PERMANENT_301" ? { type: body.type } : {}),
    ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
    ...(typeof body.note === "string" ? { note: body.note } : {}),
  });
  void logActivity({ entityType: "redirect", entityId: id, action: "updated", summary: `Updated redirect ${redirect.fromPath}` });
  return NextResponse.json(redirect);
});

export const DELETE = withAdmin(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await deleteRedirect(id);
  void logActivity({ entityType: "redirect", entityId: id, action: "deleted", summary: "Deleted redirect" });
  return NextResponse.json({ ok: true });
});
