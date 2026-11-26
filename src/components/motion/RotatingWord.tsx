"use client";

import { useEffect, useState } from "react";

/** Cycles through `words` every `interval` ms. First word is server-rendered; reduced-motion keeps it static. */
export default function RotatingWord({ words, interval = 2400 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (words.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((x) => (x + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words, interval]);
  return (
    <span key={i} className="rotating-word brand-gradient-text" aria-live="off">
      {words[i]}
    </span>
  );
}
