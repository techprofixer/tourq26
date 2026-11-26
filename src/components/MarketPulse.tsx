"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";

export type MarketPulsePost = {
  slug: string;
  title: string;
  dek: string;
  category: string;
  date: string;
  readTime: string;
};

/**
 * Market pulse — the homepage's live section. It renders the newest published Tech News posts, so
 * the page changes as the market (and the editorial calendar) does without touching the layout.
 * Category chips filter client-side; the full list is in the server HTML for crawlers.
 */
export default function MarketPulse({
  posts,
  eyebrow,
  heading,
  intro,
}: {
  posts: MarketPulsePost[];
  eyebrow: string;
  heading: string;
  intro: string;
}) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(posts.map((p) => p.category)))], [posts]);
  const [active, setActive] = useState("All");
  if (posts.length === 0) return null;
  const visible = active === "All" ? posts : posts.filter((p) => p.category === active);
  const [lead, ...rest] = visible;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  return (
    <section id="market-pulse" className="band-dark relative overflow-hidden" aria-labelledby="market-pulse-heading">
      <div className="hero-orb hero-orb-b opacity-60" aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <header className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mono-eyebrow inline-flex items-center gap-2 text-white/55">
              <span className="pulse-dot" aria-hidden /> {eyebrow}
            </p>
            <h2 id="market-pulse-heading" className="display-xl mt-4 text-white">
              {heading}
            </h2>
          </div>
          <div className="flex flex-col justify-end gap-3 lg:col-span-5">
            <p className="text-[16px] leading-[1.5] text-white/65">
              {intro}
            </p>
            <Link href="/tech-news" className="mono-button inline-flex items-center gap-1 text-white hover:underline">
              ALL TECH NEWS →
            </Link>
          </div>
        </header>

        {categories.length > 2 ? (
          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActive(c)}
                aria-pressed={active === c}
                className={`mono-label rounded-full border px-3.5 py-2 transition-colors ${
                  active === c
                    ? "border-[var(--brand-mint)] bg-[var(--brand-mint)] text-black"
                    : "border-white/20 text-white/70 hover:border-white/50 hover:text-white"
                }`}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        ) : null}

        <div key={active} className="pulse-list mt-8 grid gap-4 lg:grid-cols-12">
          {lead ? (
            <Reveal className="lg:col-span-7">
              <Link href={`/tech-news/${lead.slug}`} className="card-flat-on-dark card-hover group flex h-full min-h-[240px] flex-col justify-between p-7 sm:p-9">
                <p className="mono-label text-[var(--brand-mint)]">{lead.category.toUpperCase()}</p>
                <div>
                  <h3 className="display-lg mt-10 text-white">{lead.title}</h3>
                  {lead.dek ? <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/65">{lead.dek}</p> : null}
                  <p className="mono-label mt-6 flex items-center justify-between text-white/50">
                    <span>{fmt(lead.date)} · {lead.readTime.toUpperCase()}</span>
                    <span className="transition-transform group-hover:translate-x-1" aria-hidden>READ →</span>
                  </p>
                </div>
              </Link>
            </Reveal>
          ) : null}
          <div className="grid gap-4 lg:col-span-5">
            {rest.slice(0, 3).map((p, i) => (
              <Reveal key={p.slug} delay={(i + 1) * 80}>
                <Link href={`/tech-news/${p.slug}`} className="card-flat-on-dark card-hover group flex h-full flex-col">
                  <p className="mono-label text-white/50">
                    {p.category.toUpperCase()} · {fmt(p.date)}
                  </p>
                  <h3 className="display-sm mt-3 text-white">{p.title}</h3>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
