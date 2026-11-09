"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { MediaAssetDto, MediaAssetStatus } from "@/lib/media";
import { Spinner } from "@/components/Spinner";

function formatBytes(n: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function CloudinaryBadge({ status }: { status: MediaAssetStatus | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">Checking Cloudinary…</span>;
  if (!status.cdnKey) {
    return <span className="text-xs text-muted-foreground">Stored locally (not on Cloudinary)</span>;
  }
  if (!status.cloudinary.checked) {
    return <span className="text-xs text-muted-foreground">Cloudinary not configured — can&apos;t verify</span>;
  }
  return status.cloudinary.exists ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Verified on Cloudinary
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
      <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Missing on Cloudinary — this record is stale
    </span>
  );
}

function AssetModal({
  asset,
  onClose,
  onUpdate,
  onDelete,
}: {
  asset: MediaAssetDto;
  onClose: () => void;
  onUpdate: (updated: MediaAssetDto) => void;
  onDelete: (id: string) => void;
}) {
  const [status, setStatus] = useState<MediaAssetStatus | null>(null);
  const [alt, setAlt] = useState(asset.alt ?? "");
  const [title, setTitle] = useState(asset.title ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/media/${asset.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !cancelled) setStatus(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [asset.id]);

  const save = async () => {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/media/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt, title }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }
    onUpdate(data);
  };

  const remove = async () => {
    if (!confirm(`Delete "${asset.filename}"? This removes it from Cloudinary too.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/media/${asset.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      onDelete(asset.id);
      onClose();
    } else {
      setError("Delete failed");
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${asset.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl">
          <DialogTitle className="font-display text-lg font-semibold">Media details</DialogTitle>

          <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]">
            <div className="aspect-square overflow-hidden rounded-lg bg-muted/40">
              {asset.mimeType?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.url} alt={asset.alt ?? asset.filename} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  {asset.mimeType || "file"}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="truncate text-sm font-medium text-foreground" title={asset.filename}>
                  {asset.filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {asset.kind} · {formatBytes(asset.sizeBytes)}
                  {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
                </p>
                <div className="mt-1.5">
                  <CloudinaryBadge status={status} />
                </div>
              </div>

              <label className="block text-sm">
                <span className="mono-label text-muted-foreground">Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={saving}
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mono-label text-muted-foreground">Alt text</span>
                <input
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  disabled={saving}
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>

          {error ? <p className="mt-3 text-[13px] text-destructive">{error}</p> : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={copyUrl} className="btn-base btn-secondary !px-2 !py-1 text-xs">
              {copied ? "Copied" : "Copy URL"}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                className="btn-base btn-secondary text-destructive"
              >
                {deleting ? <Spinner className="h-4 w-4" /> : null}
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button type="button" onClick={onClose} disabled={saving} className="btn-base btn-outline">
                Close
              </button>
              <button type="button" onClick={save} disabled={saving} className="btn-base btn-primary">
                {saving ? <Spinner className="h-4 w-4" /> : null}
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export function MediaLibraryClient({ initialAssets }: { initialAssets: MediaAssetDto[] }) {
  const [assets, setAssets] = useState<MediaAssetDto[]>(initialAssets);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeAsset, setActiveAsset] = useState<MediaAssetDto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setAssets((prev) => [data, ...prev]);
  };

  const remove = async (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
  };

  const update = (updated: MediaAssetDto) => {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setActiveAsset(updated);
  };

  const copyUrl = async (asset: MediaAssetDto) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${asset.url}`);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId((id) => (id === asset.id ? null : id)), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="btn-base btn-primary"
        >
          {uploading ? <Spinner className="h-4 w-4" /> : null}
          {uploading ? "Uploading…" : "Upload file"}
        </button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      {assets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No media uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {assets.map((asset) => (
            <div key={asset.id} className="rounded-lg border border-border bg-surface/50 p-2">
              <button
                type="button"
                onClick={() => setActiveAsset(asset)}
                className="block aspect-square w-full overflow-hidden rounded-md bg-muted/40"
              >
                {asset.mimeType?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.url} alt={asset.alt ?? asset.filename} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    {asset.mimeType || "file"}
                  </div>
                )}
              </button>
              <p className="mt-2 truncate text-xs font-medium text-foreground" title={asset.filename}>
                {asset.filename}
              </p>
              <p className="text-xs text-muted-foreground">{formatBytes(asset.sizeBytes)}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAsset(asset)}
                  className="btn-base btn-secondary !px-2 !py-1 text-xs"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => copyUrl(asset)}
                  className="btn-base btn-secondary !px-2 !py-1 text-xs"
                >
                  {copiedId === asset.id ? "Copied" : "Copy URL"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(asset.id)}
                  className="btn-base btn-secondary !px-2 !py-1 text-xs text-destructive"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeAsset ? (
        <AssetModal
          asset={activeAsset}
          onClose={() => setActiveAsset(null)}
          onUpdate={update}
          onDelete={remove}
        />
      ) : null}
    </div>
  );
}
