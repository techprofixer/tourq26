import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/with-admin";
import { generateFieldContent, generateFieldObject, AiUnavailableError, AiGenerationError } from "@/lib/ai/ollama";
import { TASKS, buildFullPrompt, type TaskName } from "@/lib/ai/tasks";
import { readBrandContent } from "@/lib/brand-content";

export const POST = withAdmin(async (request: NextRequest) => {
  const body = (await request.json().catch(() => null)) as {
    task?: string;
    context?: Record<string, unknown>;
    brief?: string;
    preview?: boolean;
  } | null;

  const task = body?.task as TaskName | undefined;
  if (!task || !(task in TASKS)) {
    return NextResponse.json({ error: "Unknown AI task." }, { status: 400 });
  }
  const context = body?.context ?? {};
  const def = TASKS[task];
  const defaultBrief = def.buildBrief(context);

  if (body?.preview) {
    return NextResponse.json({ brief: defaultBrief });
  }

  const brief = typeof body?.brief === "string" && body.brief.trim() ? body.brief : defaultBrief;
  const prompt = buildFullPrompt(def, brief);

  const brand = await readBrandContent().catch(() => null);
  const system =
    brand && (brand.voiceDescription || brand.voiceGuidelines)
      ? `${def.system}\n\nBrand voice: ${brand.voiceDescription || "(not set)"}\nGuidelines: ${brand.voiceGuidelines || "(none given)"}`
      : def.system;

  try {
    if (def.mode === "object") {
      const result = await generateFieldObject({
        system,
        prompt,
        schema: def.schema,
        maxOutputTokens: def.maxOutputTokens,
      });
      return NextResponse.json({ result });
    }
    const result = await generateFieldContent({
      system,
      prompt,
      maxOutputTokens: def.maxOutputTokens,
    });
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof AiGenerationError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Generation failed." }, { status: 500 });
  }
});
