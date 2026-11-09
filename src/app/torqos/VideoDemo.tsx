"use client";

import { useState } from "react";
import Image from "next/image";
import { track } from "@/lib/analytics";
import { PlayIcon } from "./icons";

/**
 * Set this once the walkthrough is live on YouTube (Studio → video → Share → the 11-char
 * id after "watch?v="). Left blank, the section renders nothing rather than a broken player.
 */
const YOUTUBE_VIDEO_ID = "";

export default function VideoDemo() {
  const [playing, setPlaying] = useState(false);

  if (!YOUTUBE_VIDEO_ID) return null;

  const thumbnailUrl = `https://i.ytimg.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`;

  return (
    <section className="band-dark border-t border-hairline">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <p className="mono-eyebrow text-white/55">PRODUCT DEMO</p>
        <h2 className="display-lg mx-auto mt-4 max-w-2xl text-white">
          Watch torqOS in action.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[16px] leading-[1.5] text-white/70">
          A 3-minute walkthrough of the platform — leads to jobs to invoices, all in one system.
        </p>

        <div className="mx-auto mt-10 max-w-[900px]">
          <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[#0b0b0b] shadow-2xl">
            {playing ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
                title="torqOS product demo"
                allow="accelerate-transform; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  track("video_demo_play", { cta_id: "torqos-demo", product: "torqos" });
                  setPlaying(true);
                }}
                aria-label="Play torqOS product demo video"
                className="group absolute inset-0 h-full w-full cursor-pointer"
              >
                <Image
                  src={thumbnailUrl}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(min-width: 900px) 900px, 100vw"
                  className="object-cover opacity-80 transition-opacity duration-200 group-hover:opacity-100"
                />
                <span className="absolute inset-0 bg-black/20 transition-colors duration-200 group-hover:bg-black/10" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-transform duration-200 group-hover:scale-110 sm:h-20 sm:w-20"
                    style={{ background: "var(--brand-gradient)" }}
                  >
                    <PlayIcon className="ml-1 h-6 w-6 text-[#050505] sm:h-7 sm:w-7" />
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
