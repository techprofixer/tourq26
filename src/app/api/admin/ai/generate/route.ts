import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/with-admin";
import {
  generateFieldContent,
  generateFieldObject,
  contentModelInfo,
  AiUnavailableError,
  AiGenerationError,
  type AiProgressOptions,
} from "@/lib/ai/ollama";
import { TASKS, buildFullPrompt, tokenPlan, type TaskName } from "@/lib/ai/tasks";
import type { AiStreamEvent, AiUsage } from "@/lib/ai/progress";
import { readBrandContent } from "@/lib/brand-content";
import { prisma, withDbTimeout } from "@/lib/db";
import { pickAuthoritySources } from "@/lib/ai/authority-sources";
import { ALWAYS_LINKABLE } from "@/lib/ai/full-page";

/** Published CMS page paths (plus the always-valid hubs), excluding the page being written. */
async function listLinkablePaths(excludePath: string): Promise<string[]> {
  const rows = await withDbTimeout(
    prisma.page.findMany({ where: { status: "PUBLISHED" }, select: { path: true }, take: 300 }),
  ).catch(() => []);
  const paths = new Set([...ALWAYS_LINKABLE, ...rows.map((r) => r.path)]);
  paths.delete("/");
  if (excludePath) paths.delete(excludePath);
  return [...paths];
}

/** Maps a generation failure to the HTTP-style status the admin UI already understands. */
function errorStatus(err: unknown): { message: string; status: number } {
  if (err instanceof AiUnavailableError) return { message: err.message, status: 503 };
  if (err instanceof AiGenerationError) return { message: err.message, status: 502 };
  return { message: "Generation failed.", status: 500 };
}

export const POST = withAdmin(async (request: NextRequest) => {
  const body = (await request.json().catch(() => null)) as {
    task?: string;
    context?: Record<string, unknown>;
    brief?: string;
    preview?: boolean;
    /** Stream newline-delimited progress events (model, tokens, ETA) instead of one JSON reply. */
    stream?: boolean;
  } | null;

  const task = body?.task as TaskName | undefined;
  if (!task || !(task in TASKS)) {
    return NextResponse.json({ error: "Unknown AI task." }, { status: 400 });
  }
  const context = body?.context ?? {};
  if (task === "fullPage") {
    // Real, published internal URLs — the only links the model may use (also re-checked in postProcess).
    context.internalLinks = await listLinkablePaths(String(context.path ?? ""));
    // Curated outbound references matched to the topic — the model never chooses its own external URLs.
    context.autoSources = pickAuthoritySources(
      [context.title, context.focusKeyword, context.secondaryKeywords, context.pageType, context.path, String(context.existingText ?? "").slice(0, 1500)]
        .flat()
        .filter((v): v is string => typeof v === "string")
        .join(" "),
    );
  }
  const def = TASKS[task];
  const defaultBrief = def.buildBrief(context);

  if (body?.preview) {
    return NextResponse.json({ brief: defaultBrief });
  }

  const brief = typeof body?.brief === "string" && body.brief.trim() ? body.brief : defaultBrief;
  const prompt = buildFullPrompt(def, brief);
  const plan = tokenPlan(def, brief);

  const brand = await readBrandContent().catch(() => null);
  const system =
    brand && (brand.voiceDescription || brand.voiceGuidelines)
      ? `${def.system}\n\nBrand voice: ${brand.voiceDescription || "(not set)"}\nGuidelines: ${brand.voiceGuidelines || "(none given)"}`
      : def.system;

  /** Runs the task; `progress` is only passed when the caller wants streaming. */
  const generate = async (progress?: AiProgressOptions): Promise<unknown> => {
    if (def.mode !== "object") {
      return generateFieldContent({ system, prompt, maxOutputTokens: plan.max, ...progress });
    }

    // Cumulative tokens across passes, so a second pass continues the bar and offsets its count.
    let produced = 0;
    const onEvent: AiProgressOptions["onEvent"] = progress?.onEvent
      ? (event) => {
          if (event.type === "delta") produced = Math.max(produced, event.outputTokens);
          if (event.type === "usage") produced = event.usage.outputTokens;
          progress.onEvent?.(event);
        }
      : undefined;
    const run = (
      taskPrompt: string,
      extra: AiProgressOptions & { schema?: typeof def.schema; shapeHint?: string; maxOutputTokens?: number } = {},
    ) =>
      generateFieldObject({
        system,
        prompt: taskPrompt,
        schema: def.schema,
        maxOutputTokens: plan.max,
        shapeHint: def.responseContract,
        signal: progress?.signal,
        onEvent,
        ...extra,
      });
    // Hooks see the final, editor-edited brief too (it carries things like the source-URL list).
    const hookContext = { ...context, __brief: brief };
    const post = (r: Record<string, unknown>) => (def.postProcess ? def.postProcess(r, hookContext) : r);

    let first = post(await run(prompt));
    if (!def.refine) return first;

    // Too short? Ask for just the missing sections (a few hundred tokens) rather than rewriting the page.
    const expand = def.refine.expand;
    const missing = expand ? expand.missingWords(first) : 0;
    if (expand && missing > 0) {
      progress?.onEvent?.({
        type: "phase",
        phase: "optimizing",
        expectedOutputTokens: produced + Math.round(missing * 2.4),
        detail: `Adding about ${missing} words`,
      });
      try {
        const extra = await run(expand.buildBrief(first, missing, brief), {
          schema: expand.schema,
          shapeHint: expand.responseContract,
          maxOutputTokens: Math.min(3500, Math.round(missing * 2.6) + 400),
          tokenOffset: produced,
          phase: "optimizing",
        });
        first = expand.merge(first, extra as Record<string, unknown>, hookContext);
      } catch (err) {
        if (progress?.signal?.aborted) throw err;
      }
    }

    // Score the draft with the same analyzer as the editor's SEO sidebar; if fixable checks fail,
    // spend ONE more pass on them and keep the second draft only if it truly scores higher.
    const before = def.refine.audit(first, hookContext);
    let best = first;
    let bestAudit = before;
    let optimized = false;
    if (before.issues.length > 0) {
      progress?.onEvent?.({
        type: "phase",
        phase: "optimizing",
        expectedOutputTokens: produced + plan.expected,
        detail: `Fixing ${before.issues.length} SEO check${before.issues.length === 1 ? "" : "s"}`,
      });
      try {
        const fixPrompt = buildFullPrompt(def, def.refine.buildFixBrief(first, before.issues, brief));
        const second = post(await run(fixPrompt, { tokenOffset: produced, phase: "optimizing" }));
        const after = def.refine.audit(second, hookContext);
        // Keep the rewrite when it scores higher, or ties while clearing some of the problems.
        if (after.passed > before.passed || (after.passed === before.passed && after.issues.length < before.issues.length)) {
          best = second;
          bestAudit = after;
          optimized = true;
        }
      } catch (err) {
        // A cancelled run must stay cancelled; any other failure just keeps the first draft.
        if (progress?.signal?.aborted) throw err;
      }
    }
    return {
      ...best,
      audit: {
        passed: bestAudit.passed,
        total: bestAudit.total,
        initialPassed: before.passed,
        optimized,
        remaining: bestAudit.remaining,
      },
    };
  };

  if (!body?.stream) {
    try {
      return NextResponse.json({ result: await generate() });
    } catch (err) {
      const { message, status } = errorStatus(err);
      return NextResponse.json({ error: message }, { status });
    }
  }

  const encoder = new TextEncoder();
  const startedAt = Date.now();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: AiStreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          closed = true;
        }
      };

      send({
        type: "start",
        ...contentModelInfo(),
        maxOutputTokens: plan.max,
        expectedOutputTokens: plan.expected,
      });
      send({ type: "phase", phase: "connecting" });

      let usage: AiUsage = { outputTokens: 0 };
      try {
        const result = await generate({
          // Client closed the dialog / pressed Cancel → stop spending tokens.
          signal: request.signal,
          onEvent: (event) => {
            if (event.type === "delta") usage = { ...usage, outputTokens: event.outputTokens };
            if (event.type === "usage") usage = event.usage;
            send(event);
          },
        });
        send({ type: "phase", phase: "finalizing" });
        send({ type: "result", result, usage, elapsedMs: Date.now() - startedAt });
      } catch (err) {
        const { message, status } = errorStatus(err);
        send({ type: "error", error: message, status });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed by a client disconnect */
        }
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      // Stop reverse proxies (nginx etc.) from buffering the stream into one lump.
      "X-Accel-Buffering": "no",
    },
  });
});
