"use client";

import { useMemo } from "react";
import { stripHtmlToText } from "@/lib/seo-generate";

type Props = {
  title: string;
  description: string;
  bodyHtml: string;
  focusKeyword?: string;
  slug?: string;
  hasCoverImage?: boolean;
};

function countMatches(html: string, re: RegExp): number {
  const m = html.match(re);
  return m ? m.length : 0;
}

function keywordHits(text: string, keyword: string): number {
  if (!keyword) return 0;
  const re = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
  const m = text.match(re);
  return m ? m.length : 0;
}

type Check = { ok: boolean; label: string; hint?: string };

export function BlogEditorInsights({
  title,
  description,
  bodyHtml,
  focusKeyword = "",
  slug = "",
  hasCoverImage = false,
}: Props) {
  const metrics = useMemo(() => {
    const plain = stripHtmlToText(bodyHtml);
    const lowerPlain = plain.toLowerCase();
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();
    const kw = focusKeyword.trim().toLowerCase();

    const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
    const sentences = plain
      ? plain.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
      : 0;
    const avgWordsPerSentence =
      sentences > 0 ? Math.round((words / sentences) * 10) / 10 : 0;

    const readMin = Math.max(1, Math.round(words / 220));

    const h1 = countMatches(bodyHtml, /<h1\b/gi);
    const h2 = countMatches(bodyHtml, /<h2\b/gi);
    const h3 = countMatches(bodyHtml, /<h3\b/gi);
    const internalLinks = countMatches(bodyHtml, /<a\s[^>]*href=["'](?!https?:|mailto:|tel:)/gi);
    const externalLinks = countMatches(bodyHtml, /<a\s[^>]*href=["']https?:/gi);
    const totalLinks = internalLinks + externalLinks;

    const imgs = bodyHtml.match(/<img\b[^>]*>/gi) || [];
    const imgsWithAlt = imgs.filter((tag) => /\balt\s*=\s*["'][^"']+["']/i.test(tag)).length;

    const paragraphs = bodyHtml.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const longParagraphs = paragraphs.filter((p) => {
      const t = p.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return t.split(/\s+/).filter(Boolean).length > 110;
    }).length;

    const titleLen = title.trim().length;
    const descLen = description.trim().length;
    const slugLen = slug.trim().length;

    const kwInTitle = !!kw && lowerTitle.includes(kw);
    const kwInDesc = !!kw && lowerDesc.includes(kw);
    const kwInSlug = !!kw && slug.toLowerCase().includes(kw.replace(/\s+/g, "-"));
    const kwInFirstP =
      !!kw &&
      (paragraphs[0] ?? "")
        .toLowerCase()
        .replace(/<[^>]+>/g, " ")
        .includes(kw);
    const kwHits = kw ? keywordHits(lowerPlain, kw) : 0;
    const kwDensity = words > 0 ? (kwHits / words) * 100 : 0;
    const kwDensityOk = kwDensity >= 0.5 && kwDensity <= 2.5;

    let score = 35;
    // Meta lengths
    if (titleLen >= 30 && titleLen <= 65) score += 8;
    else if (titleLen >= 20 && titleLen < 75) score += 4;
    if (descLen >= 120 && descLen <= 160) score += 8;
    else if (descLen >= 80 && descLen < 180) score += 4;
    // Body depth
    if (words >= 800) score += 12;
    else if (words >= 400) score += 8;
    else if (words >= 200) score += 4;
    // Structure
    if (h2 >= 2) score += 6;
    else if (h2 === 1) score += 3;
    if (h1 === 0) score += 3; // no extra H1 inside body
    if (h3 >= 1) score += 2;
    if (internalLinks >= 1) score += 4;
    if (externalLinks >= 1) score += 2;
    // Image
    if (hasCoverImage) score += 4;
    if (imgs.length === 0 || imgsWithAlt === imgs.length) score += 3;
    // Paragraph length
    if (paragraphs.length === 0 || longParagraphs === 0) score += 3;
    // Readability
    if (avgWordsPerSentence > 0 && avgWordsPerSentence <= 22) score += 4;
    else if (avgWordsPerSentence <= 28) score += 2;
    // Keyword usage
    if (kw) {
      if (kwInTitle) score += 4;
      if (kwInDesc) score += 3;
      if (kwInSlug) score += 2;
      if (kwInFirstP) score += 3;
      if (kwDensityOk) score += 4;
    } else {
      score += 6; // neutral if no focus keyword
    }
    score = Math.min(100, Math.max(0, score));

    const checks: Check[] = [
      {
        ok: titleLen >= 30 && titleLen <= 65,
        label: `Title length ${titleLen}`,
        hint: "Aim for 30–60 characters so it doesn't truncate in search.",
      },
      {
        ok: descLen >= 120 && descLen <= 160,
        label: `Meta description ${descLen}`,
        hint: "Aim for 120–160 characters — Google often shows ~155.",
      },
      {
        ok: words >= 400,
        label: `${words.toLocaleString()} words`,
        hint: "Long-form articles (>400 words) tend to perform better.",
      },
      {
        ok: h1 === 0,
        label: h1 === 0 ? "Single H1 (page title)" : `${h1} extra H1 in body — use H2/H3`,
        hint: "The page title already renders as H1. Use H2/H3 inside the body.",
      },
      {
        ok: h2 >= 2,
        label: `Headings H2/H3 ${h2}/${h3}`,
        hint: "At least 2 H2 sections aid scanability.",
      },
      {
        ok: paragraphs.length === 0 || longParagraphs === 0,
        label: longParagraphs === 0 ? "Paragraph length OK" : `${longParagraphs} long paragraph(s)`,
        hint: "Try to keep paragraphs under ~110 words for readability.",
      },
      {
        ok: imgs.length === 0 || imgsWithAlt === imgs.length,
        label:
          imgs.length === 0
            ? "No images"
            : `Alt text ${imgsWithAlt}/${imgs.length}`,
        hint: "Every image needs descriptive alt text.",
      },
      {
        ok: internalLinks >= 1,
        label: `${internalLinks} internal · ${externalLinks} external link(s)`,
        hint: "Link to at least one of your own pages to spread authority.",
      },
      {
        ok: hasCoverImage,
        label: hasCoverImage ? "Cover image set" : "No cover image",
        hint: "Cover image is used for Open Graph + social previews.",
      },
      {
        ok: slugLen >= 3 && slugLen <= 75,
        label: `Slug length ${slugLen}`,
        hint: "Short, hyphen-separated slugs index better.",
      },
    ];

    if (kw) {
      checks.push(
        {
          ok: kwInTitle,
          label: kwInTitle ? "Focus keyword in title" : "Focus keyword missing from title",
        },
        {
          ok: kwInDesc,
          label: kwInDesc ? "Focus keyword in description" : "Focus keyword missing from description",
        },
        {
          ok: kwInSlug,
          label: kwInSlug ? "Focus keyword in slug" : "Focus keyword missing from slug",
        },
        {
          ok: kwInFirstP,
          label: kwInFirstP
            ? "Focus keyword in opening paragraph"
            : "Add focus keyword to the opening paragraph",
        },
        {
          ok: kwDensityOk,
          label: `Keyword density ${kwDensity.toFixed(2)}%`,
          hint: "Healthy range is 0.5%–2.5%. Don't over-stuff.",
        },
      );
    }

    return {
      score,
      words,
      readMin,
      h1,
      h2,
      h3,
      internalLinks,
      externalLinks,
      totalLinks,
      titleLen,
      descLen,
      avgWordsPerSentence,
      paragraphsCount: paragraphs.length,
      longParagraphs,
      imgsTotal: imgs.length,
      imgsWithAlt,
      kwHits,
      kwDensity,
      checks,
    };
  }, [title, description, bodyHtml, focusKeyword, slug, hasCoverImage]);

  const barColor =
    metrics.score >= 75
      ? "bg-[color:var(--app-success)]"
      : metrics.score >= 55
        ? "bg-foreground"
        : "bg-[color:var(--app-destructive)]";

  const grade =
    metrics.score >= 80
      ? "Great"
      : metrics.score >= 60
        ? "Good"
        : metrics.score >= 40
          ? "Needs work"
          : "Critical";

  return (
    <div className="card-flat space-y-5 p-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="mono-eyebrow text-muted-foreground">CONTENT SCORE</p>
          <span className="mono-label text-muted-foreground">HEURISTIC ONLY</span>
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="stat-number text-[40px] leading-none text-foreground">
            {metrics.score}
          </span>
          <span className="text-[15px] text-muted-foreground">/ 100 · {grade}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all ${barColor}`}
            style={{ width: `${metrics.score}%` }}
          />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-[13px] sm:grid-cols-3">
        <Stat label="Words" value={metrics.words.toLocaleString()} />
        <Stat label="Read time" value={`${metrics.readMin} min`} />
        <Stat label="Avg sentence" value={metrics.avgWordsPerSentence || "—"} />
        <Stat label="H2 / H3" value={`${metrics.h2} / ${metrics.h3}`} />
        <Stat label="Internal links" value={metrics.internalLinks} />
        <Stat label="External links" value={metrics.externalLinks} />
      </dl>

      <ul className="space-y-2 border-t border-border/60 pt-4">
        {metrics.checks.map((c, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13.5px]">
            <span
              aria-hidden
              className={`mt-[5px] inline-block h-2 w-2 shrink-0 rounded-full ${
                c.ok
                  ? "bg-[color:var(--app-success)]"
                  : "bg-[color:var(--app-destructive)]"
              }`}
            />
            <div>
              <p className={c.ok ? "text-foreground" : "text-foreground/85"}>{c.label}</p>
              {!c.ok && c.hint ? (
                <p className="text-[12px] text-muted-foreground">{c.hint}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="mono-label text-muted-foreground">{label.toUpperCase()}</dt>
      <dd className="mt-0.5 font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
