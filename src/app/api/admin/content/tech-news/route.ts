import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { readTechNewsPosts, writeTechNewsPosts, type TechNewsPost } from "@/lib/tech-news-content";
import { normaliseTechNewsInput, slugify } from "@/lib/tech-news-server";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async () => {
  const posts = await readTechNewsPosts();
  return NextResponse.json(posts);
});

export const POST = withAdmin(async (request: NextRequest) => {
  const raw = (await request.json()) as Record<string, unknown>;
  const candidate = normaliseTechNewsInput(raw);

  if (!candidate.title || candidate.title === "Untitled") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const posts = await readTechNewsPosts();
  const slug = candidate.slug || slugify(candidate.title) || `story-${Date.now()}`;
  if (posts.some((p) => p.slug === slug)) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
  }

  const newPost: TechNewsPost = { ...candidate, slug };
  posts.push(newPost);
  await writeTechNewsPosts(posts);
  void logActivity({
    entityType: "tech-news",
    entityId: newPost.slug,
    action: "created",
    summary: `Created tech news story "${newPost.title}"`,
  });
  revalidatePath("/tech-news");
  revalidatePath(`/tech-news/${newPost.slug}`);
  return NextResponse.json(newPost);
});
