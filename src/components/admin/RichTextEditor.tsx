"use client";

import { useMemo, useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { QuillEditor } from "@/components/admin/QuillEditor";
import { ImageUploadField, type ImageMeta } from "@/components/admin/ImageUploadField";

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
};

/** The slice of the Quill 1.x API the image dialog needs. */
type QuillLike = {
  getSelection(focus?: boolean): { index: number; length: number } | null;
  getContents(index: number, length: number): { ops?: { insert?: unknown; attributes?: Record<string, unknown> }[] };
  insertEmbed(index: number, type: string, value: string, source: string): void;
  formatText(index: number, length: number, formats: Record<string, string | false>, source: string): void;
  deleteText(index: number, length: number, source: string): void;
  setSelection(index: number, length: number, source: string): void;
};

type ImageDraft = { url: string; meta: ImageMeta; index: number; replace: boolean };

/** The image embed at `index`, if there is one — lets the toolbar button edit an existing image. */
function imageAt(quill: QuillLike, index: number): { url: string; meta: ImageMeta } | null {
  if (index < 0) return null;
  const op = quill.getContents(index, 1).ops?.[0];
  const insert = op?.insert as { image?: unknown } | undefined;
  if (!insert || typeof insert !== "object" || typeof insert.image !== "string") return null;
  const attr = (key: string) => (typeof op?.attributes?.[key] === "string" ? (op.attributes[key] as string) : "");
  return { url: insert.image, meta: { alt: attr("alt"), title: attr("title") } };
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content…",
  minHeight = "14rem",
}: RichTextEditorProps) {
  const quillRef = useRef<QuillLike | null>(null);
  const [image, setImage] = useState<ImageDraft | null>(null);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          [{ align: [] }],
          ["clean"],
        ],
        handlers: {
          // Replaces Quill's default (which inlines the file as base64) with the media-library
          // dialog: upload / pick from library / paste a URL, plus alt text and title.
          image: () => {
            const quill = quillRef.current;
            if (!quill) return;
            const index = quill.getSelection(true)?.index ?? 0;
            // With the cursor on either side of an image, edit that image instead of adding one.
            for (const at of [index, index - 1]) {
              const existing = imageAt(quill, at);
              if (existing) {
                setImage({ ...existing, index: at, replace: true });
                return;
              }
            }
            setImage({ url: "", meta: { alt: "", title: "" }, index, replace: false });
          },
        },
      },
      clipboard: { matchVisual: false },
    }),
    [],
  );

  const insertImage = () => {
    const quill = quillRef.current;
    const url = image?.url.trim();
    if (!quill || !image || !url) return;
    if (image.replace) quill.deleteText(image.index, 1, "user");
    quill.insertEmbed(image.index, "image", url, "user");
    quill.formatText(
      image.index,
      1,
      { alt: image.meta.alt.trim() || false, title: image.meta.title.trim() || false },
      "user",
    );
    quill.setSelection(image.index + 1, 0, "silent");
    setImage(null);
  };

  return (
    <div
      className="admin-quill-editor overflow-hidden rounded-lg border border-border bg-surface/50"
      style={{ minHeight }}
    >
      <QuillEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        className="admin-quill-react"
        onReady={(quill) => {
          quillRef.current = quill as QuillLike;
        }}
      />

      <Dialog open={image !== null} onClose={() => setImage(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl">
            <DialogTitle className="font-display text-lg font-semibold">
              {image?.replace ? "Edit image" : "Insert image"}
            </DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a file, choose one from the media library, or paste an image URL.
            </p>
            {image ? (
              <div className="mt-4">
                <ImageUploadField
                  value={image.url}
                  onChange={(url, asset) =>
                    setImage((prev) =>
                      prev
                        ? {
                            ...prev,
                            url,
                            meta: {
                              alt: asset?.alt || prev.meta.alt,
                              title: asset?.title || prev.meta.title,
                            },
                          }
                        : prev,
                    )
                  }
                  meta={image.meta}
                  onMetaChange={(meta) => setImage((prev) => (prev ? { ...prev, meta } : prev))}
                  previewClassName="mt-2 max-h-48 w-auto rounded-md border border-border bg-surface/40 object-contain"
                />
              </div>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setImage(null)} className="btn-base btn-outline">
                Cancel
              </button>
              <button
                type="button"
                onClick={insertImage}
                disabled={!image?.url.trim()}
                className="btn-base btn-primary"
              >
                {image?.replace ? "Update image" : "Insert image"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
