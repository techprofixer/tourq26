import { getIndexNowKey } from "@/lib/indexnow";

/** IndexNow ownership proof — must return exactly the key. 404 while IndexNow is disabled. */
export function GET() {
  const key = getIndexNowKey();
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
