# Torq Studio — SEO strategy & checklist

Use this as your ongoing SEO playbook to rank better and keep technical SEO healthy.

---

## What’s already in place (technical)

### Discovery files
- **Sitemap** — `src/app/sitemap.ts` → `/sitemap.xml`. Static pages, published + indexable CMS pages, blog, case studies, tech news, freebies, with image-sitemap entries. Feature-flagged sections (blog, contact, torqOS, business systems) are only listed while enabled. `lastmod` is only emitted where it's real.
- **Robots** — `src/app/robots.ts` + `src/lib/crawlers.ts` → `/robots.txt`. Names AI search crawlers (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot…) explicitly. **Admin → Brand & SEO → "Opt out of AI model training"** blocks training-only crawlers (GPTBot, Google-Extended, CCBot…) while keeping AI search allowed. "Block all search engines" is for staging only.
- **llms.txt / llms-full.txt** — `src/lib/llms-txt.ts`. Curated Markdown index (llmstxt.org) plus the full text of every public page in one file for AI agents. Extra notes are editable in Admin → Brand & SEO.
- **IndexNow** — `src/lib/indexnow.ts`. When `INDEXNOW_KEY` is set, publishing/editing/deleting CMS pages, blog posts, case studies or tech news pings Bing/Yandex/Seznam/Naver instantly (Bing also feeds ChatGPT Search and Copilot).

### Metadata & structured data
- Root metadata in `src/app/layout.tsx`; Organization and WebSite JSON-LD carry stable `@id`s (`/#organization`, `/#website`) that every page's schema links to, forming one entity graph.
- Every indexable page sets its own canonical (no root-level canonical — it would leak to pages that forget theirs).
- Next **replaces** (doesn't merge) parent `openGraph` / `robots` objects, so pages that set them must use `DEFAULT_OG_IMAGE` and `INDEXABLE_ROBOTS` from `src/lib/seo.ts` (the latter allows full-length snippets and large image previews in AI Overviews/Discover).
- CMS pages (`src/lib/cms/metadata.ts`) emit WebPage + Service (services/solutions/industries/technologies/locations), Article (guides/comparisons, with named author), or DefinedTerm (glossary), plus BreadcrumbList, FAQPage (from FAQ blocks) and optional custom JSON-LD.

### CMS (Admin → CMS Pages)
- Page types: Service, Solution, Industry, Technology, Location, Guide, Comparison, Glossary term, Landing, Company. Non-entity pages render through the catch-all `src/app/[...slug]/page.tsx`; paths owned by built-in routes are rejected (`src/lib/cms/paths.ts`).
- Per-page: meta title/description, focus keyword, index/follow, breadcrumb label, social share image, author (articles), canonical override, custom JSON-LD.
- **Key takeaways block** — 2–5 quotable, answer-first statements; the content AI answers are most likely to cite.
- Live SEO sidebar includes an **AI answers** category (summary, FAQ coverage, question-style headings, share image).
- Moving a published page's URL automatically adds a 301 (and collapses redirect chains).

---

## Strategy to rank in the top

### 1. Keywords and content

- **Primary terms:**  
  e.g. “software development partner”, “mobile app development company”, “AI solutions provider”, “remote IT team”, “offshore development”, “technology partner”.
- **Long-tail:**  
  e.g. “hire mobile app developers for startup”, “AI integration for business”, “reduce software development cost”.
- **Where to use them:**  
  - H1, first paragraph, and one subheading on the homepage.  
  - Service names and short descriptions (e.g. in `Services`, `WhyChooseUs`).  
  - One focused page per major service (see below).

**Action:**  
- Pick 3–5 primary and 5–10 long-tail keywords.  
- Weave them into existing copy without stuffing; keep tone natural and benefit-led.

### 2. Content and site structure

- **Homepage:**  
  - Clear value proposition, social proof (case studies, testimonials, logos).  
  - Internal links to “Services”, “Why us”, “Case studies”, “Contact”.
- **Dedicated service pages (high impact):**  
  - e.g. `/services/mobile-app-development`, `/services/web-development`, `/services/ai-solutions`, `/services/remote-it`.  
  - Each with: unique H1, 300–600 words, keywords, CTA, canonical, and Open Graph.  
  - Add these URLs to `sitemap.ts` with `changeFrequency: "monthly"` and `priority: 0.8–0.9`.
- **Trust and relevance:**  
  - Blog or “Insights” with 1–2 posts per month (e.g. “How we build mobile apps”, “AI use cases for business”).  
  - Optional: `/about`, `/contact` with unique metadata and canonicals.

**Action:**  
- Add at least 2–3 service pages and wire them in the sitemap and main nav.

### 3. Technical and UX (Core Web Vitals)

- **Performance:**  
  - Optimize images (Next.js `Image`, WebP/AVIF).  
  - Minimize render-blocking JS/CSS; keep above-the-fold lean.
- **Mobile:**  
  - Already responsive; test on real devices and in Mobile-Friendly Test.
- **Core Web Vitals:**  
  - Aim for LCP &lt; 2.5s, FID/INP &lt; 100ms, CLS &lt; 0.1.  
  - Use PageSpeed Insights and Search Console.

**Action:**  
- Run Lighthouse (performance + SEO), fix critical issues, then re-check.

### 4. Links and visibility

- **Backlinks:**  
  - Guest posts, partner/client pages, directories (e.g. Clutch, GoodFirms), HARO/niche Q&A.  
  - One strong, relevant link beats many low-quality ones.
- **Internal links:**  
  - Homepage → service pages, case studies, CTA.  
  - Service pages → each other and back to homepage.
- **Local / regional:**  
  - If you target a specific country, add that to `Organization` (e.g. `address`) and consider a simple “Locations” or “We serve” section.

**Action:**  
- List 5–10 realistic backlink targets; get 1–2 live, then iterate.

### 5. Search Console and monitoring

- **Google Search Console:**  
  - Add property for `https://torqstudio.com`.  
  - Submit `sitemap.xml` (URL: `https://torqstudio.com/sitemap.xml`).  
  - Monitor coverage, indexing, and manual actions.
- **Bing Webmaster Tools:**  
  - Add site and submit same sitemap.
- **Optional:**  
  - Google Analytics 4 or similar for traffic and behavior.  
  - Rank tracking for your main keywords (e.g. Ahrefs, Semrush, or free tools).

**Action:**  
- Verify and submit sitemap in GSC and Bing within the first week after launch.

### 6. When you add new pages

- Give each page:  
  - Unique `title` and `description`.  
  - `alternates.canonical` (absolute URL).  
  - `openGraph` (title, description, url **and** `images: [DEFAULT_OG_IMAGE]`).  
  - `robots: INDEXABLE_ROBOTS` unless it’s private.
- Prefer creating it as a **CMS page** (sitemap, llms.txt, JSON-LD and IndexNow are automatic). Hand-built routes must be added to `src/app/sitemap.ts` and the Company list in `src/lib/llms-txt.ts`.
- Use one H1 per page and clear headings (H2/H3) for structure.

---

## Quick checklist (before/after launch)

- [ ] `NEXT_PUBLIC_SITE_URL` set to `https://torqstudio.com` in production.
- [ ] Visit `https://torqstudio.com/robots.txt` and `https://torqstudio.com/sitemap.xml` — both return correct content.
- [ ] Test OG image: share homepage link on Twitter/LinkedIn and confirm image and title/description.
- [ ] Google Search Console: property added, sitemap submitted, no critical errors.
- [ ] Bing Webmaster Tools: site added, sitemap submitted.
- [ ] `INDEXNOW_KEY` set in production; `/indexnow-key.txt` returns it.
- [ ] `/llms.txt` and `/llms-full.txt` list only live, public pages.
- [ ] Core Web Vitals and SEO in the green (Lighthouse).
- [ ] All important pages have unique meta title/description and canonicals.
- [ ] At least 2–3 service pages live and in sitemap.

---

## File reference

| What              | File(s) |
|-------------------|--------|
| Sitemap           | `src/app/sitemap.ts` |
| Robots            | `src/app/robots.ts`, `src/lib/crawlers.ts` |
| llms.txt          | `src/lib/llms-txt.ts`, `src/app/llms.txt`, `src/app/llms-full.txt` |
| IndexNow          | `src/lib/indexnow.ts`, `src/app/indexnow-key.txt` |
| CMS SEO / schema  | `src/lib/cms/metadata.ts`, `src/lib/seo.ts`, `src/lib/cms/paths.ts` |
| CMS catch-all     | `src/app/[...slug]/page.tsx` |
| Root metadata     | `src/app/layout.tsx` |
| OG image          | `src/app/opengraph-image.tsx` |
| Privacy metadata  | `src/app/privacy/page.tsx` |
| Terms metadata    | `src/app/terms/page.tsx` |

When you add new routes, update the sitemap and give the new pages proper metadata and canonicals so the site stays ready to rank.
