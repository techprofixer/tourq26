"use client";

import { useRef, useState } from "react";
import { Spinner } from "@/components/Spinner";
import { ADMIN_INPUT_CLASS } from "@/components/admin/form-styles";

/**
 * Image field usable everywhere a raw image URL is stored: paste a URL, drag & drop a file, or
 * click Upload to pick one from disk. Uploads go through the shared media library
 * (/api/admin/media) so every uploaded asset also shows up in Admin → Media.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = "https://…/image.jpg",
  accept = "image/*",
  helpText,
  previewClassName = "mt-2 h-20 w-auto rounded-md border border-border bg-surface/40 object-contain",
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  accept?: string;
  helpText?: string;
  previewClassName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

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
    onChange(data.url as string);
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void upload(file);
  };

  return (
    <div>
      {label ? <label className="block text-sm font-medium text-foreground/90">{label}</label> : null}
      <div
        className={`mt-1 flex gap-2 rounded-lg transition-shadow ${
          dragOver ? "ring-2 ring-[color:var(--app-primary)]" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${ADMIN_INPUT_CLASS} mt-0 flex-1 placeholder:text-muted-foreground`}
        />
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="btn-base btn-secondary shrink-0"
        >
          {uploading ? <Spinner className="h-4 w-4" /> : null}
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
      {helpText ? <p className="mt-1 text-xs text-muted-foreground">{helpText}</p> : null}
      {error ? <p className="mt-1 text-xs text-[color:var(--app-destructive)]">{error}</p> : null}
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className={previewClassName} />
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Drag & drop an image, paste a URL, or click Upload to choose a file from your device.
        </p>
      )}
    </div>
  );
}
