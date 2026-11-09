"use client";

import { useState } from "react";
import Link from "next/link";
import type { SlideItem } from "@/lib/home-content";

export type HomeSliderProps = {
  heading: string;
  items: SlideItem[];
};

/** Lightweight, dependency-free image carousel — enabled from Admin → Homepage → Image slider. */
export default function HomeSlider({ heading, items }: HomeSliderProps) {
  const [index, setIndex] = useState(0);
  if (items.length === 0) return null;

  const go = (i: number) => setIndex(((i % items.length) + items.length) % items.length);

  return (
    <section className="band-light border-t border-hairline">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        {heading ? <p className="mono-eyebrow text-muted-foreground">{heading}</p> : null}
        <div className="relative mt-6 overflow-hidden rounded-[var(--radius-md)] border border-hairline">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {items.map((slide, i) => (
              <div key={i} className="relative w-full shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.imageUrl} alt={slide.alt} className="aspect-[16/7] w-full object-cover" />
                {slide.heading || slide.caption ? (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 sm:p-8">
                    {slide.heading ? <h3 className="display-md text-white">{slide.heading}</h3> : null}
                    {slide.caption ? (
                      <p className="mt-2 max-w-lg text-[14px] text-white/80">{slide.caption}</p>
                    ) : null}
                    {slide.ctaLabel && slide.ctaHref ? (
                      <Link href={slide.ctaHref} className="btn-base btn-white mt-4 inline-flex">
                        {slide.ctaLabel}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {items.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-foreground shadow transition-colors hover:bg-white"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-foreground shadow transition-colors hover:bg-white"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
