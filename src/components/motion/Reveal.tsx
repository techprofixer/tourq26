"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger delay in ms. */
  delay?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Scroll-reveal wrapper. Content is fully visible on the server and before hydration (no-JS and
 * crawlers see everything); only elements that start below the fold are hidden and then faded in
 * when they enter the viewport. Honors prefers-reduced-motion.
 */
export default function Reveal({ children, delay = 0, as: Tag = "div", className = "" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  // Class toggling is done on the DOM node directly (not React state) so the server/hydrated markup
  // is identical and there's no extra render.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already on screen
    el.style.transitionDelay = `${delay}ms`;
    el.classList.add("reveal-hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove("reveal-hidden");
          el.classList.add("reveal-shown");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
