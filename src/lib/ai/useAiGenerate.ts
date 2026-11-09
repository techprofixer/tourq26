"use client";

import { useState } from "react";
import type { TaskName } from "@/lib/ai/tasks";

export function useAiGenerate() {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function run<T = string | Record<string, unknown>>(
    task: TaskName,
    context: Record<string, unknown>,
    brief?: string,
  ): Promise<T | null> {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, context, brief }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Generation failed.");
        return null;
      }
      return data.result as T;
    } catch {
      setError("AI is unavailable — check that Ollama is running.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { run, previewBrief, loading, previewLoading, error, setError };
}
