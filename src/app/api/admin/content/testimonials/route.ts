import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/with-admin";
import { readTestimonials, writeTestimonials, type Testimonial } from "@/lib/content";
import { logActivity } from "@/lib/activity-log";

export const GET = withAdmin(async () => {
  const items = await readTestimonials();
  return NextResponse.json(items);
});

export const PUT = withAdmin(async (request: NextRequest) => {
  const body = await request.json();
  const items = Array.isArray(body) ? body : [];
  const testimonials: Testimonial[] = items.map((t: Record<string, unknown>, i: number) => ({
    id: typeof t.id === "string" ? t.id : String(i + 1),
    quote: typeof t.quote === "string" ? t.quote : "",
    result: typeof t.result === "string" ? t.result : "",
    name: typeof t.name === "string" ? t.name : "",
    role: typeof t.role === "string" ? t.role : "",
    company: typeof t.company === "string" ? t.company : "",
    rating: typeof t.rating === "number" ? t.rating : 5,
  }));
  await writeTestimonials(testimonials);
  void logActivity({ entityType: "testimonials", action: "updated", summary: `Updated testimonials (${testimonials.length} total)` });
  revalidatePath("/");
  return NextResponse.json(testimonials);
});
