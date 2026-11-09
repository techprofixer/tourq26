import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { readPrimaryNav, writePrimaryNav, type NavLink } from "@/lib/nav-content";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async () => {
  const links = await readPrimaryNav();
  return NextResponse.json({ links });
});

export const PUT = withAdmin(async (request: NextRequest) => {
  const body = (await request.json().catch(() => null)) as { links?: unknown } | null;
  if (!Array.isArray(body?.links)) {
    return NextResponse.json({ error: "Expected { links: NavLink[] }" }, { status: 400 });
  }
  const links: NavLink[] = body.links
    .filter(
      (l): l is NavLink =>
        !!l && typeof l === "object" && typeof (l as NavLink).label === "string" && typeof (l as NavLink).href === "string",
    )
    .map((l) => ({ label: l.label.trim(), href: l.href.trim(), openInNewTab: !!l.openInNewTab }));
  await writePrimaryNav(links);
  void logActivity({ entityType: "navigation", action: "updated", summary: "Updated primary navigation" });
  revalidatePath("/", "layout");
  return NextResponse.json({ links });
});
