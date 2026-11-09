import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/with-admin";
import { listRedirects, createRedirect } from "@/lib/redirects";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async () => {
  const redirects = await listRedirects();
  return NextResponse.json(redirects);
});

export const POST = withAdmin(async (request: NextRequest) => {
  const body = (await request.json().catch(() => ({}))) as {
    fromPath?: string;
    toPath?: string;
    type?: string;
    note?: string;
  };
  const fromPath = (body.fromPath || "").trim();
  const toPath = (body.toPath || "").trim();
  if (!fromPath.startsWith("/") || !toPath.startsWith("/")) {
    return NextResponse.json({ error: "Paths must start with /" }, { status: 400 });
  }
  if (fromPath === toPath) {
    return NextResponse.json({ error: "From and to paths must differ" }, { status: 400 });
  }

  try {
    const redirect = await createRedirect({
      fromPath,
      toPath,
      type: body.type === "TEMPORARY_302" ? "TEMPORARY_302" : "PERMANENT_301",
      note: body.note,
    });
    void logActivity({
      entityType: "redirect",
      entityId: redirect.id,
      action: "created",
      summary: `Added redirect ${fromPath} → ${toPath}`,
    });
    return NextResponse.json(redirect);
  } catch {
    return NextResponse.json({ error: "A redirect for that path already exists" }, { status: 400 });
  }
});
