import { describe, expect, it } from "vitest";
import { autoLinkBlocks, linkFirstMention } from "@/lib/cms/auto-link";
import type { CmsBlock } from "@/lib/cms/blocks";
import type { LinkSuggestion } from "@/lib/cms/link-suggestions";

const sug = (path: string, anchor: string, matchedTerms: string[] = []): LinkSuggestion => ({
  title: anchor,
  path,
  anchor,
  score: 1,
  matchedTerms,
});
const section = (bodyHtml: string): CmsBlock => ({ type: "contentSection", id: "s1", bodyHtml });

describe("linkFirstMention", () => {
  it("links the first plain-text mention only, never inside tags or existing links", () => {
    const html = `<p><a href="/x">erp tools</a> and erp tools, plus erp tools</p>`;
    const res = linkFirstMention(html, "erp tools", "/erp");
    expect(res.linked).toBe(true);
    expect(res.html).toBe(`<p><a href="/x">erp tools</a> and <a href="/erp">erp tools</a>, plus erp tools</p>`);
  });
});

describe("autoLinkBlocks", () => {
  it("links in place, falls back to a Related line, and stops at the minimum", () => {
    const blocks = [section("<p>We build mobile apps and web portals.</p>")];
    const { blocks: out, added } = autoLinkBlocks(
      blocks,
      [sug("/a", "mobile apps"), sug("/b", "Cloud hosting"), sug("/c", "Data pipelines"), sug("/d", "Extra")],
      { minLinks: 3 },
    );
    const html = (out[0] as { bodyHtml: string }).bodyHtml;
    expect(added).toBe(3);
    expect(html).toContain(`<a href="/a">mobile apps</a>`);
    expect(html).toContain(`Related: <a href="/b">Cloud hosting</a>, <a href="/c">Data pipelines</a>`);
    expect(html).not.toContain("/d");
  });

  it("does nothing when the page already has enough internal links", () => {
    const blocks = [section(`<p><a href="/a">a</a> <a href="/b">b</a> <a href="/c">c</a></p>`)];
    expect(autoLinkBlocks(blocks, [sug("/d", "Extra")]).added).toBe(0);
  });
});
