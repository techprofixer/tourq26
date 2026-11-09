import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/with-admin";
import { findInternalLinkSuggestions } from "@/lib/cms/link-suggestions";

export const GET = withAdmin(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const focusKeyword = searchParams.get("focusKeyword") ?? "";
  const secondaryKeywords = (searchParams.get("secondary") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const bodyText = searchParams.get("bodyText") ?? "";
  const excludePath = searchParams.get("excludePath") || undefined;

  const suggestions = await findInternalLinkSuggestions({
    focusKeyword,
    secondaryKeywords,
    bodyText,
    excludePath,
  });
  return NextResponse.json({ suggestions });
});
