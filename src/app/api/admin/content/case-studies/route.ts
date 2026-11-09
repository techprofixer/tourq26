import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { readCaseStudies, writeCaseStudies, type CaseStudy } from "@/lib/case-studies-content";
import { slugify } from "@/lib/blog-server";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async () => {
  const items = await readCaseStudies();
  return NextResponse.json(items);
});

export const POST = withAdmin(async (request: NextRequest) => {
  const raw = (await request.json()) as Partial<CaseStudy>;
  if (!raw.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const items = await readCaseStudies();
  const slug = (raw.slug && slugify(raw.slug)) || slugify(raw.title) || `case-study-${Date.now()}`;
  if (items.some((c) => c.slug === slug)) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
  }

  const newItem: CaseStudy = {
    slug,
    title: raw.title,
    seoTitle: raw.seoTitle,
    client: raw.client ?? "",
    industry: raw.industry ?? "",
    industries: Array.isArray(raw.industries) ? raw.industries : [],
    challenge: raw.challenge ?? "",
    outcome: raw.outcome ?? "",
    metric: raw.metric ?? "",
    metricLabel: raw.metricLabel ?? "",
    icon: raw.icon,
    coverImage: raw.coverImage ?? "",
    coverAlt: raw.coverAlt ?? "",
    description: raw.description ?? "",
    date: raw.date ?? new Date().toISOString().slice(0, 10),
    readTime: raw.readTime ?? "5 min read",
    services: Array.isArray(raw.services) ? raw.services : [],
    body: raw.body ?? "",
  };
  await writeCaseStudies([...items, newItem]);
  void logActivity({ entityType: "case-study", entityId: newItem.slug, action: "created", summary: `Created case study "${newItem.title}"` });
  revalidatePath("/");
  revalidatePath("/case-studies");
  revalidatePath(`/case-studies/${newItem.slug}`);
  return NextResponse.json(newItem);
});
