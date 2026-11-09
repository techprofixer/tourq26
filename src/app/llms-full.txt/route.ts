import { buildLlmsFullTxtBody } from "@/lib/llms-txt";

/** Full-text companion to /llms.txt — every public page as Markdown in one response. */
export async function GET() {
  const body = await buildLlmsFullTxtBody();
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
