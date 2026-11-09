import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/with-admin";
import { readContactSubmissions } from "@/lib/content";

export const GET = withAdmin(async () => {
  const submissions = await readContactSubmissions();
  return NextResponse.json(submissions);
});
