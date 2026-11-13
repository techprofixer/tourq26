"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { MediaAssetDto } from "@/lib/media";
import { Spinner } from "@/components/Spinner";

/**
 * Pick an already-uploaded image from the media library (Admin → Media — Cloudinary-backed when
 * the CLOUDINARY_* env vars are set). Returns the whole asset so callers can reuse its saved
 * alt text and title.
 */
export function MediaPickerDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (asset: MediaAssetDto) => void;
}) {
  const [assets, setAssets] = useState<MediaAssetDto[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/admin/media")
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !Array.isArray(data)) {
          setError((data && data.error) || "Could not load the media library.");
          setAssets([]);
          return;
        }
        setError("");
        setAssets((data as MediaAssetDto[]).filter((a) => a.kind === "IMAGE"));
      })
      .catch(() => {
        if (cancelled) return;
        setError("Could not load the media library.");
        setAssets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const visible = (assets ?? []).filter(
    (a) => !q || [a.filename, a.alt, a.title].some((v) => v?.toLowerCase().includes(q)),
  );

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[60]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle className="font-display text-lg font-semibold">Media library</DialogTitle>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by filename, alt or title…"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm sm:w-64"
            />
          </div>

          <div className="mt-4 min-h-40 flex-1 overflow-y-auto">
            {assets === null ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <Spinner className="h-5 w-5" />
              </div>
            ) : error ? (
              <p className="text-sm text-[color:var(--app-destructive)]">{error}</p>
            ) : visible.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {q ? "No images match that search." : "No images uploaded yet — use Upload to add one."}
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {visible.map((asset) => (
                  <li key={asset.id}>
                    <button
                      type="button"
                      onClick={() => onPick(asset)}
                      title={asset.title || asset.alt || asset.filename}
                      className="group block w-full overflow-hidden rounded-md border border-border text-left transition-colors hover:border-foreground/50"
                    >
                      <span className="block aspect-[4/3] bg-muted/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.url}
                          alt={asset.alt ?? asset.filename}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </span>
                      <span className="block truncate px-2 py-1.5 text-[12px] text-muted-foreground group-hover:text-foreground">
                        {asset.filename}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button type="button" onClick={onClose} className="btn-base btn-outline">
              Cancel
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
