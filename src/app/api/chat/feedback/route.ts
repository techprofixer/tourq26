import { NextRequest, NextResponse } from "next/server";
import { addChatFeedback } from "@/lib/content";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { jsonError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_CHAT_MESSAGE_LENGTH, MAX_CHAT_REPLY_LENGTH } from "@/lib/constants";

const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!(await isFeatureEnabled("floating_chat_assistant"))) {
    return jsonError(503, "Chat assistant is unavailable.");
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterSeconds } = rateLimit(`chat-feedback:${ip}`, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);
  if (!allowed) {
    return jsonError(429, `Too many requests — please wait ${retryAfterSeconds}s and try again.`, {
      "Retry-After": String(retryAfterSeconds),
    });
  }

  try {
    const body = await request.json();
    const rating = body.rating === "up" || body.rating === "down" ? body.rating : null;
    const userQuery = typeof body.userQuery === "string" ? body.userQuery.trim() : "";
    const assistantReply = typeof body.assistantReply === "string" ? body.assistantReply.trim() : "";

    if (!rating || !userQuery || !assistantReply) {
      return jsonError(400, "rating, userQuery, and assistantReply are required.");
    }
    if (userQuery.length > MAX_CHAT_MESSAGE_LENGTH || assistantReply.length > MAX_CHAT_REPLY_LENGTH) {
      return jsonError(400, "Message is too long.");
    }

    await addChatFeedback({ rating, userQuery, assistantReply });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Chat feedback error:", e);
    return jsonError(500, "Something went wrong. Please try again.");
  }
}
