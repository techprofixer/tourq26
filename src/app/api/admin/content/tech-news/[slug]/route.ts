import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { readTechNewsPosts, writeTechNewsPosts, type TechNewsPost } from "@/lib/tech-news-content";
import { normaliseTechNewsInput, slugify } from "@/lib/tech-news-server";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async (
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await params;
  const posts = await readTechNewsPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
});

export const PUT = withAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await params;

  const posts = await readTechNewsPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const raw = (await request.json()) as Record<string, unknown>;
  const candidate = normaliseTechNewsInput(raw, posts[index]);
  const nextSlug = candidate.slug || slugify(candidate.title) || posts[index].slug;

  if (nextSlug !== slug && posts.some((p) => p.slug === nextSlug)) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
  }

  const updated: TechNewsPost = { ...candidate, slug: nextSlug };
  posts[index] = updated;
  await writeTechNewsPosts(posts);
  void logActivity({
    entityType: "tech-news",
    entityId: updated.slug,
    action: updated.status === "published" ? "published" : "updated",
    summary: `Updated tech news story "${updated.title}"`,
  });
  revalidatePath("/tech-news");
  revalidatePath(`/tech-news/${updated.slug}`);
  if (updated.slug !== slug) revalidatePath(`/tech-news/${slug}`);
  return NextResponse.json(updated);
});

export const DELETE = withAdmin(async (
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await params;
  const posts = await readTechNewsPosts();
  const filtered = posts.filter((p) => p.slug !== slug);
  if (filtered.length === posts.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await writeTechNewsPosts(filtered);
  void logActivity({
    entityType: "tech-news",
    entityId: slug,
    action: "deleted",
    summary: `Deleted tech news story "${slug}"`,
  });
  revalidatePath("/tech-news");
  revalidatePath(`/tech-news/${slug}`);
  return NextResponse.json({ ok: true });
});
