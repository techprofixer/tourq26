"use client";

import { useEffect, useRef } from "react";

export type QuillEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Quill `modules` option (toolbar, clipboard, …). Captured once on mount — keep stable via `useMemo`. */
  modules: Record<string, unknown>;
  className?: string;
  /** Called once with the Quill instance, for callers that drive it directly (e.g. inserting embeds). */
  onReady?: (quill: unknown) => void;
};

type ImageBlot = {
  new (...args: never[]): { domNode: HTMLElement; format(name: string, value: string): void };
  formats(node: HTMLElement): Record<string, string>;
};

let imageBlotRegistered = false;

/** Quill's stock image blot keeps `alt`/`width`/`height` but drops `title` — extend it so an
 *  image's title survives both editing and re-loading saved HTML. */
function registerImageWithTitle(Quill: typeof import("quill").default) {
  if (imageBlotRegistered) return;
  imageBlotRegistered = true;
  const BaseImage = Quill.import("formats/image") as ImageBlot;
  class ImageWithTitle extends BaseImage {
    static formats(node: HTMLElement) {
      const formats = super.formats(node);
      const title = node.getAttribute("title");
      if (title) formats.title = title;
      return formats;
    }
    format(name: string, value: string) {
      if (name !== "title") return super.format(name, value);
      if (value) this.domNode.setAttribute("title", value);
      else this.domNode.removeAttribute("title");
    }
  }
  Quill.register(ImageWithTitle as never, true);
}

/**
 * Quill 1.x without react-quill — avoids React 19’s removed `findDOMNode` used by react-quill.
 */
export function QuillEditor({ value, onChange, placeholder, modules, className, onReady }: QuillEditorProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<InstanceType<typeof import("quill").default> | null>(null);
  const skipEmit = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const initialModulesRef = useRef(modules);
  const initialPlaceholderRef = useRef(placeholder);
  const initialValueRef = useRef(value);

  useEffect(() => {
    let cancelled = false;
    const mountEl = wrapRef.current;
    if (!mountEl) return;

    (async () => {
      const Quill = (await import("quill")).default;
      if (cancelled) return;
      registerImageWithTitle(Quill);

      const q = new Quill(mountEl, {
        theme: "snow",
        placeholder: initialPlaceholderRef.current ?? "",
        modules: initialModulesRef.current,
      } as never);
      quillRef.current = q;
      onReadyRef.current?.(q);

      const start = initialValueRef.current;
      if (start) {
        q.clipboard.dangerouslyPasteHTML(start);
      }

      q.on("text-change", () => {
        if (skipEmit.current) return;
        const html = q.root.innerHTML;
        const out = html === "<p><br></p>" || html === "<p></p>" ? "" : html;
        onChangeRef.current(out);
      });
    })();

    return () => {
      cancelled = true;
      quillRef.current = null;
      mountEl.innerHTML = "";
    };
  }, []);

  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    const cur = q.root.innerHTML;
    const norm = (s: string) => (s === "" || s === "<p><br></p>" || s === "<p></p>" ? "" : s);
    if (norm(value) === norm(cur)) return;
    skipEmit.current = true;
    q.clipboard.dangerouslyPasteHTML(value || "<p><br></p>");
    skipEmit.current = false;
  }, [value]);

  return <div ref={wrapRef} className={className} />;
}
