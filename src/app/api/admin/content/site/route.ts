import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { readSiteContent, writeSiteContent, type SiteContent } from "@/lib/content";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async () => {
  const data = await readSiteContent();
  return NextResponse.json(data);
});

export const PUT = withAdmin(async (request: NextRequest) => {
  const body = (await request.json()) as Partial<SiteContent>;
  const current = await readSiteContent();
  const data: SiteContent = {
    ...current,
    ...body,
    keywords: Array.isArray(body.keywords) ? body.keywords : current.keywords,
    sameAs: Array.isArray(body.sameAs)
      ? (body.sameAs as unknown[]).filter((u): u is string => typeof u === "string")
      : current.sameAs,
    twitterSite:
      typeof body.twitterSite === "string"
        ? body.twitterSite.replace(/^@/, "").trim()
        : current.twitterSite,
    twitterTitle: typeof body.twitterTitle === "string" ? body.twitterTitle : current.twitterTitle,
    twitterDescription:
      typeof body.twitterDescription === "string" ? body.twitterDescription : current.twitterDescription,
    googleSiteVerification:
      typeof body.googleSiteVerification === "string"
        ? body.googleSiteVerification.trim()
        : current.googleSiteVerification,
    bingSiteVerification:
      typeof body.bingSiteVerification === "string"
        ? body.bingSiteVerification.trim()
        : current.bingSiteVerification,
    robotsNoIndex: typeof body.robotsNoIndex === "boolean" ? body.robotsNoIndex : current.robotsNoIndex,
  };
  await writeSiteContent(data);
  void logActivity({ entityType: "site", action: "updated", summary: "Updated site & SEO settings" });
  // Layout-wide: metadataBase, canonical, and Organization/WebSite JSON-LD all read siteUrl.
  revalidatePath("/", "layout");
  revalidatePath("/robots.txt");
  revalidatePath("/sitemap.xml");
  // Statically generated detail pages bake siteUrl into their own canonical/OG/JSON-LD at
  // build time — without this they'd keep serving a stale siteUrl until the next deploy.
  for (const pattern of [
    "/services/[slug]",
    "/case-studies/[slug]",
    "/blog/[slug]",
    "/industries/[slug]",
    "/solutions/[slug]",
    "/technologies/[slug]",
    "/tech-news/[slug]",
    "/freebies/[slug]",
  ]) {
    revalidatePath(pattern, "page");
  }
  return NextResponse.json(data);
});
