import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { readBlogPosts, writeBlogPosts, type BlogPost } from "@/lib/content";
import { normaliseBlogInput, slugify } from "@/lib/blog-server";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async (
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await params;
  const posts = await readBlogPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
});

export const PUT = withAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await params;

  const posts = await readBlogPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const raw = (await request.json()) as Record<string, unknown>;
  const candidate = normaliseBlogInput(raw, posts[index]);
  const nextSlug = candidate.slug || slugify(candidate.title) || posts[index].slug;

  if (nextSlug !== slug && posts.some((p) => p.slug === nextSlug)) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
  }

  const updated: BlogPost = { ...candidate, slug: nextSlug };
  posts[index] = updated;
  await writeBlogPosts(posts);
  void logActivity({
    entityType: "blog",
    entityId: updated.slug,
    action: updated.status === "published" ? "published" : "updated",
    summary: `Updated blog post "${updated.title}"`,
  });
  revalidatePath("/blog");
  revalidatePath(`/blog/${updated.slug}`);
  if (updated.slug !== slug) revalidatePath(`/blog/${slug}`);
  return NextResponse.json(updated);
});

export const DELETE = withAdmin(async (
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await params;
  const posts = await readBlogPosts();
  const filtered = posts.filter((p) => p.slug !== slug);
  if (filtered.length === posts.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await writeBlogPosts(filtered);
  void logActivity({ entityType: "blog", entityId: slug, action: "deleted", summary: `Deleted blog post "${slug}"` });
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  return NextResponse.json({ ok: true });
});
