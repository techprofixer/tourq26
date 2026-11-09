"use client";

import { useState } from "react";

/** Shared save/loading/error plumbing for admin forms that POST/PUT/PATCH to an API route. */
export function useAdminMutation() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function run<T>(fetchFn: () => Promise<Response>, fallbackError = "Request failed"): Promise<T | null> {
    setError("");
    setSaving(true);
    try {
      const res = await fetchFn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : fallbackError);
        return null;
      }
      return data as T;
    } finally {
      setSaving(false);
    }
  }

  return { saving, error, setError, run };
}
