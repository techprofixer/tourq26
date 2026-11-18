"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TaskName } from "@/lib/ai/tasks";
import { INITIAL_PROGRESS, type AiProgress, type AiStreamEvent } from "@/lib/ai/progress";

/** Reads a newline-delimited JSON stream, yielding each parsed event as its line completes. */
async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<AiStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) {
          try {
            yield JSON.parse(line) as AiStreamEvent;
          } catch {
            /* skip a malformed line rather than abort the whole run */
          }
        }
        newline = buffer.indexOf("\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function useAiGenerate() {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<AiProgress>(INITIAL_PROGRESS);
  const abortRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef(0);

  // Wall-clock timer: elapsed time keeps moving even while the model is silent (cold start).
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setProgress((p) => ({ ...p, elapsedMs: Date.now() - startedAtRef.current }));
    }, 250);
    return () => clearInterval(id);
  }, [loading]);

  // Closing the page mid-run should stop the model, not leave it generating for nobody.
  useEffect(() => () => abortRef.current?.abort(), []);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  async function previewBrief(task: TaskName, context: Record<string, unknown>): Promise<string> {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, context, preview: true }),
      });
      const data = await res.json().catch(() => ({}));
      return typeof data.brief === "string" ? data.brief : "";
    } catch {
      return "";
    } finally {
      setPreviewLoading(false);
    }
  }

  function applyEvent(event: AiStreamEvent) {
    setProgress((p) => {
      const elapsedMs = Date.now() - startedAtRef.current;
      switch (event.type) {
        case "start": {
          const { type: _type, ...info } = event;
          void _type;
          return { ...p, info, elapsedMs };
        }
        case "phase":
          return {
            ...p,
            phase: event.phase,
            detail: event.detail,
            info:
              p.info && event.expectedOutputTokens
                ? { ...p.info, expectedOutputTokens: event.expectedOutputTokens }
                : p.info,
            elapsedMs,
          };
        case "delta":
          return {
            ...p,
            // Don't let a late estimate drag the counter below exact usage already reported.
            outputTokens: p.exact ? p.outputTokens : Math.max(p.outputTokens, event.outputTokens),
            firstTokenAtMs: p.firstTokenAtMs ?? (event.outputTokens > 0 ? elapsedMs : null),
            elapsedMs,
          };
        case "usage":
          return {
            ...p,
            outputTokens: event.usage.outputTokens,
            inputTokens: event.usage.inputTokens,
            exact: true,
            elapsedMs,
          };
        default:
          return p;
      }
    });
  }

  async function run<T = string | Record<string, unknown>>(
    task: TaskName,
    context: Record<string, unknown>,
    brief?: string,
  ): Promise<T | null> {
    const controller = new AbortController();
    abortRef.current = controller;
    startedAtRef.current = Date.now();
    setProgress(INITIAL_PROGRESS);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, context, brief, stream: true }),
        signal: controller.signal,
      });

      // Auth / validation failures come back as plain JSON before any stream starts.
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Generation failed.");
        return null;
      }

      let result: T | null = null;
      for await (const event of readEvents(res.body)) {
        if (event.type === "result") {
          result = event.result as T;
          setProgress((p) => ({
            ...p,
            phase: "finalizing",
            outputTokens: event.usage.outputTokens || p.outputTokens,
            inputTokens: event.usage.inputTokens ?? p.inputTokens,
            elapsedMs: event.elapsedMs,
          }));
        } else if (event.type === "error") {
          setError(event.error);
          return null;
        } else {
          applyEvent(event);
        }
      }
      if (result === null) setError("The AI stopped before finishing. Try again.");
      return result;
    } catch (err) {
      if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
        setError("Generation cancelled.");
      } else {
        setError("AI is unavailable — check that the AI model is reachable.");
      }
      return null;
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  return { run, previewBrief, cancel, loading, previewLoading, error, setError, progress };
}
