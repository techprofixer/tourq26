import type { CmsBlock } from "@/lib/cms/blocks";
import type { LinkSuggestion } from "@/lib/cms/link-suggestions";
import { auditLinks } from "@/lib/seo-analysis";

/** Internal links the SEO analyzer wants before it stops warning ("link to 2-3 related pages"). */
export const MIN_INTERNAL_LINKS = 3;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Wraps the first mention of `term` that sits in plain text (not inside a tag or an existing link). */
export function linkFirstMention(html: string, term: string, path: string): { html: string; linked: boolean } {
  const needle = term.trim();
  if (needle.length < 4) return { html, linked: false };
  const re = new RegExp(`\\b${escapeRe(needle)}\\b`, "i");
  let anchorDepth = 0;
  let linked = false;
  const out = html.split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith("<")) {
      if (/^<a\b/i.test(part)) anchorDepth += 1;
      else if (/^<\/a\s*>/i.test(part)) anchorDepth = Math.max(0, anchorDepth - 1);
      return part;
    }
    if (linked || anchorDepth > 0) return part;
    return part.replace(re, (m) => {
      linked = true;
      return `<a href="${path}">${m}</a>`;
    });
  });
  return { html: out.join(""), linked };
}

function hrefs(html: string): Set<string> {
  return new Set(
    [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)].map((m) => m[2].split(/[?#]/)[0].replace(/\/$/, "") || "/"),
  );
}

/**
 * Adds same-domain links to related pages until the page has `minLinks`. Each suggestion is linked
 * in place on the first natural mention of its anchor/matched terms in a content section; if the
 * copy never mentions it, it joins a single "Related" line at the end of the last section.
 * Relative paths are used, which the SEO analyzer counts as internal.
 */
export function autoLinkBlocks(
  blocks: CmsBlock[],
  suggestions: LinkSuggestion[],
  opts: { siteUrl?: string; minLinks?: number } = {},
): { blocks: CmsBlock[]; added: number } {
  const minLinks = opts.minLinks ?? MIN_INTERNAL_LINKS;
  const sections = blocks.flatMap((b, i) => (b.type === "contentSection" ? [i] : []));
  if (sections.length === 0) return { blocks, added: 0 };

  const next = [...blocks];
  const html = () => sections.map((i) => (next[i] as Extract<CmsBlock, { type: "contentSection" }>).bodyHtml).join(" ");
  const existing = auditLinks(html(), opts.siteUrl).internal;
  const linkedPaths = hrefs(html());
  const unplaced: LinkSuggestion[] = [];
  let added = 0;

  for (const s of suggestions) {
    if (existing + added >= minLinks) break;
    if (linkedPaths.has(s.path.replace(/\/$/, "") || "/")) continue;
    let placed = false;
    for (const term of [s.anchor, ...s.matchedTerms]) {
      for (const i of sections) {
        const block = next[i] as Extract<CmsBlock, { type: "contentSection" }>;
        const res = linkFirstMention(block.bodyHtml, term, s.path);
        if (res.linked) {
          next[i] = { ...block, bodyHtml: res.html };
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
    if (placed) {
      added += 1;
      linkedPaths.add(s.path);
    } else {
      unplaced.push(s);
    }
  }

  const needed = minLinks - existing - added;
  const fallback = unplaced.slice(0, Math.max(0, needed));
  if (fallback.length > 0) {
    const last = sections[sections.length - 1];
    const block = next[last] as Extract<CmsBlock, { type: "contentSection" }>;
    const links = fallback.map((s) => `<a href="${s.path}">${s.anchor}</a>`).join(", ");
    next[last] = { ...block, bodyHtml: `${block.bodyHtml}<p>Related: ${links}</p>` };
    added += fallback.length;
  }
  return { blocks: added > 0 ? next : blocks, added };
}
