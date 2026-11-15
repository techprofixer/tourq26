# Torq Studio — Full SEO & Customer Acquisition Plan (torqstudio.com)

> Companion to `docs/SEO-STRATEGY.md`. That file is the **technical checklist** (what the codebase already does).
> This file is the **growth plan**: who we target, which keywords we can realistically win, what to publish, how links and leads come in, and how we measure it.
>
> Written: 2026-11-15. Targets below are planning assumptions, not guarantees. Re-baseline after the first 30 days of Search Console data.

---

## 0. Executive summary

**Where we are.** The technical foundation is already strong for a site this size: per-page canonicals, Organization/WebSite/Service/FAQ/Article JSON-LD with a stable entity graph, sitemap with image entries, IndexNow, `llms.txt`, AI-search crawlers allowed, a CMS with an SEO sidebar. Technical SEO is **not** the bottleneck.

**What is holding us back** (from the live homepage and codebase):

| # | Problem | Impact |
|---|---------|--------|
| 1 | H1 is "Build what's next with senior engineers, not slide decks." — no service, no location, no keyword | Weak relevance signal for the most important page |
| 2 | No named clients, no logos, testimonials without company names, stats without methodology ("50+ launches", "40% cheaper") | Low E-E-A-T and low trust for a service business; buyers and Google both discount unverifiable claims |
| 3 | No phone, no physical address, no `sameAs` social profiles set (`sameAs: []`, `twitterSite: ""` in defaults) | Weak entity/NAP signals; no knowledge-panel path |
| 4 | Verification codes (`googleSiteVerification`, `bingSiteVerification`) empty by default | Possibly no Search Console / Bing data at all — confirm first |
| 5 | Zero off-site authority (no Clutch/GoodFirms/GitHub/LinkedIn footprint visible) | A new/low-DA domain will not rank for competitive terms on on-page work alone |
| 6 | No pricing anchors | Comparison shoppers bounce; "cost" queries are the highest-intent queries in this market |
| 7 | Positioning drift: "teams worldwide" (site defaults) vs "India, EU, MENA" (homepage) vs "Middle East & Europe" (README) | Diluted topical focus |
| 8 | Seasonal "20% off audits before Nov 30" banner | Goes stale in two weeks; stale offers hurt trust |
| 9 | Keyword list in settings is generic/freelancer-flavoured ("freelance developer", "senior software engineer") | Attracts the wrong, low-budget intent |

**The strategy in one paragraph.** We cannot beat Toptal, Simform, or Intellectsoft for "mobile app development company" in year one. We win by being **the senior-engineer-led, India-based build partner for Gulf (UAE/KSA) and European (DACH/UK/NL) mid-market companies**, ranking first on narrow, high-intent, *buyer-language* queries (location × service, cost, comparison, "how to hire", industry-specific), proving it with named case studies, and amplifying with directory profiles, LinkedIn outbound, and WhatsApp-first conversion. Ranking is the slow channel (6–12 months); outbound + directories + paid-light produce leads in the first 30–60 days while SEO compounds.

---

## 1. Positioning & ICP (decide this before any content)

### 1.1 One-line positioning (use everywhere: H1 area, meta, LinkedIn, Clutch, llms.txt)

> **Torq Studio is a Mumbai-based senior engineering studio building mobile apps, web platforms, CRMs and AI workflows for companies in the Middle East and Europe.**

Keep the "senior engineers, not slide decks" line as the **tagline**, not the H1.

### 1.2 Ideal customer profiles (ranked)

| Rank | ICP | Why | Typical entry offer |
|------|-----|-----|---------------------|
| 1 | **UAE / KSA / GCC SMB–mid-market** (fintech, logistics, e-commerce, real estate, healthcare) wanting an app, CRM or AI assistant | Already have case studies (UAE fintech, KSA logistics AI); huge digital-spend growth; India-vendor trust is high; time-zone overlap | Paid discovery sprint or fixed-scope MVP |
| 2 | **DACH / EU e-commerce & B2B SaaS** needing cost-efficient senior capacity (replatform, API modernization) | Case studies exist; euro budgets, 40–60% saving story is real | Embedded squad / retainer |
| 3 | **India funded startups & SMEs** | Easiest to reach (same timezone, WhatsApp, local directories), shorter sales cycle, lower ticket | Fixed-scope MVP, CRM build |
| 4 | **Agencies / consultancies needing white-label engineering** | Repeatable, referral-driven, low CAC | Dedicated engineers |
| 5 | **torqOS product buyers** (separate motion — see §7) | Product-led revenue, different keyword set | Demo / trial |

### 1.3 What we deliberately do NOT chase
- "Freelance developer", "cheap developer", "free website" — wrong buyer, low LTV.
- Head terms like "software development company", "app development" (global) — unwinnable now, and low conversion.
- Consumer queries ("how to make an app").

---

## 2. Keyword strategy

Methodology: confirm volumes/difficulty in Ahrefs/Semrush (or free: Google Keyword Planner, Search Console impressions, "People also ask", autosuggest) before committing. The clusters below are the *shape* of the plan; numbers go in the tracker (§12).

### 2.1 Tier A — Money keywords (commercial intent, location × service). **Build one page each.**

These map onto the existing CMS **Location** + **Service** page types (`/locations/[slug]`, `/services/[slug]`).

| Cluster | Example queries | Target page |
|---------|-----------------|-------------|
| Gulf app dev | "mobile app development company Dubai", "app developers UAE", "fintech app development UAE", "app development Saudi Arabia / Riyadh" | `/locations/dubai-uae`, `/locations/riyadh-saudi-arabia`, + service×location combos |
| Gulf AI / CRM | "AI chatbot development UAE", "custom CRM development Dubai", "AI customer support Saudi" | `/solutions/build-ai-chatbot`, `/solutions/build-crm` + location variants |
| Europe | "software development India for German companies", "nearshore/offshore development Germany", "outsource software development Netherlands", "Magento/Shopify replatform agency" | `/locations/germany-dach`, `/locations/netherlands`, `/locations/united-kingdom` |
| India | "mobile app development company Mumbai", "software company Mumbai", "CRM development company India", "React Native developers India" | `/locations/mumbai`, `/locations/india` |
| Core service | "hire dedicated developers", "remote engineering team", "CTO as a service", "technical due diligence", "API development company" | existing `/services/*` pages |

**Rule:** each location page must have *unique* content — local regulations/context (e.g. UAE VAT/e-invoicing, KSA PDPL / SAMA / NCA, GDPR/DSGVO, Arabic/RTL needs, payment gateways like Tap/PayTabs/Moyasar/Mada/Stripe/Adyen), a relevant case study, a local-flavoured FAQ, and local-currency indicative pricing. Cloned "We build apps in {city}" pages are doorway-page risk — do not mass-generate them.

### 2.2 Tier B — Buyer-research keywords (the winnable ones, 1–6 months). **Blog / Guides.**

| Intent | Example queries | Format |
|--------|-----------------|--------|
| Cost | "how much does it cost to build an app in UAE", "mobile app development cost 2026", "CRM development cost", "AI chatbot cost for business", "cost of hiring developers in India vs UAE" | Guide + calculator-style table (CMS **Guide**) |
| Choosing a vendor | "how to choose a mobile app development partner" (exists), "questions to ask a software development company", "offshore vs nearshore vs onshore", "fixed price vs time and materials" | Guide |
| Comparison | "React Native vs Flutter for fintech", "custom CRM vs Salesforce/HubSpot/Zoho", "build vs buy AI chatbot", "Next.js vs WordPress for business site" | CMS **Comparison** type |
| How-to / technical | "app store submission checklist", "how to build a CRM from scratch", "RAG chatbot architecture", "how to modernize a legacy API" | Guide |
| Compliance / regional | "KSA PDPL for app developers", "UAE data residency for fintech apps", "GDPR checklist for mobile apps" | Guide (high E-E-A-T, low competition) |
| Glossary | "what is RAG", "what is a squad model", "what is technical due diligence" | CMS **Glossary** (DefinedTerm) |

### 2.3 Tier C — AI-answer / entity queries (AEO)
Queries asked of ChatGPT/Perplexity/Gemini/AI Overviews: "best software development companies in Mumbai", "top app developers for UAE startups", "Indian software companies working with Gulf clients". We win these by (a) being listed on the third-party sources LLMs cite (Clutch, GoodFirms, DesignRush, LinkedIn, Crunchbase, listicles), and (b) answer-first on-site content (already supported by the **Key takeaways** block).

### 2.4 Tier D — Brand
"Torq Studio", "torqstudio", "torqOS". Own the SERP: homepage, LinkedIn, Clutch, GitHub org, X, YouTube, Crunchbase, Google Business Profile.

### 2.5 Keyword → page mapping rules
- **One primary keyword per URL**; no two pages target the same query (cannibalisation). Track in the tracker sheet.
- Set the **focus keyword** field in the CMS page editor for every page and use the SEO sidebar score as the gate (see §4.6).
- Update `siteContent.keywords` in **Admin → Site & SEO** to the Tier A/B set (drop "freelance developer", "senior software engineer", "software consultant").

---

## 3. Site architecture & internal linking

```
/                         Home  — positioning + proof + paths to the 3 ICPs
├─ /services/             Hub
│   ├─ mobile-app-development
│   ├─ web-development
│   ├─ ai-solutions
│   ├─ remote-it            (embedded engineers / squads)
│   └─ technical-consulting (+ cto-as-a-service, custom-software, crm-development)
├─ /solutions/            Productised offers: build-crm, build-ai-chatbot, ...
├─ /industries/           fintech, logistics, e-commerce, real-estate, healthcare, b2b-saas
├─ /technologies/         react-native, flutter, next-js, node, python, ...
├─ /locations/            mumbai, india, dubai-uae, riyadh-ksa, germany-dach, uk, netherlands
├─ /case-studies/         named, metric-backed, one per ICP
├─ /blog/  (+ guides, comparisons, glossary via CMS)
├─ /torqos/               product (own funnel, §7)
├─ /business-systems/     audit lead magnet
├─ /freebies/             Torq DevTools (link-bait / tool pages)
└─ /pricing  (NEW)        indicative ranges + engagement models
```

### Internal-linking rules (use the CMS link-suggestions bar, `src/lib/cms/link-suggestions.ts`)
1. **Hub-and-spoke.** Every Tier B article links up to its parent service/solution page with keyword-rich anchor text, and each service page links down to its 3–5 best articles ("Related content" block).
2. **Triangle links.** Service ↔ Industry ↔ Location ↔ Case study. A KSA logistics case study links to `/industries/logistics`, `/locations/riyadh-saudi-arabia`, `/solutions/build-ai-chatbot`, and back.
3. Every page has **one** contextual CTA link to `/contact` or the audit, not just the header.
4. Homepage links directly (not only via nav mega-menu) to the 5 revenue pages: mobile apps, AI, CRM, remote engineers, case studies.
5. No orphans: monthly check that every sitemap URL has ≥3 inbound internal links (Screaming Frog crawl).
6. Normalise nav labels ("Software Development" vs "Web & APIs" inconsistency) to match page H1s/keywords.

---

## 4. On-page & content programme

### 4.1 Homepage rewrite (week 1)
- **H1:** `Senior engineers for mobile apps, web platforms and AI — built for the Middle East & Europe` (tagline "Not slide decks." goes in the sub-head).
- First 100 words: who we are, what we build, who for, where we're based, one proof point with a number *and a named source*.
- Replace "Trusted in: continents" with **named logos** or, if NDAs block that, "Delivered for a UAE fintech, a KSA logistics group…" **plus** a Clutch/Google review badge.
- Add a visible **phone / WhatsApp** and **city (Mumbai) address** in header/footer.
- Add a 6–8 question FAQ with FAQPage schema (cost, timeline, process, IP ownership, time zones, payment terms, support after launch).
- Move the Black Friday banner to a flag-controlled, **dated** banner; remove after Nov 30 (see §10 feature flags).

### 4.2 Service & solution page template (each one)
1. H1 with service + audience/location where natural.
2. **Key takeaways** block (2–5 quotable lines — AI-citation bait).
3. Who it's for / when *not* to hire us (honesty signals trust).
4. Process & deliverables, timeline ranges.
5. **Indicative pricing range** (even broad: "MVPs typically $25–60k").
6. Tech stack + links to `/technologies/*`.
7. 1–2 case studies with metrics.
8. FAQ (4–8 real questions → FAQPage schema).
9. Related articles + CTA.
10. Author/reviewer byline (named engineer) → E-E-A-T.

Target 1,200–2,000 words on money pages (the current static fallbacks are ~600–800; expand when migrated to the CMS).

### 4.3 Case studies (highest-converting asset)
For each of the 4 existing studies and every new one: **client name or specific descriptor + logo/permission, problem, constraints, architecture diagram, stack, timeline, measurable result with baseline and period, a quote with full name/title/company/LinkedIn.** Add `Review`/`Article` schema and a "Results" summary box. Get written permission to name clients; offer a "mutual NDA-safe" version if not.

### 4.4 Editorial calendar (first 90 days — 2 posts/week, quality over volume)

| Wk | Piece | Cluster |
|----|-------|---------|
| 1 | Homepage + services rewrite | — |
| 2 | "How much does it cost to build an app in the UAE (2026)" | Cost / Gulf |
| 3 | "Hiring developers in India vs UAE vs Europe: real cost comparison" | Cost |
| 4 | "Custom CRM vs Salesforce/HubSpot/Zoho for SMEs" | Comparison / CRM |
| 5 | "KSA PDPL & NCA: what app developers must know" | Compliance |
| 6 | "Build vs buy an AI support chatbot (with RAG architecture)" | AI |
| 7 | "React Native vs Flutter for fintech apps" | Comparison |
| 8 | "Questions to ask before hiring an offshore software company" | Vendor choice |
| 9 | "How to modernize a legacy API without downtime" (from DACH case) | Technical |
| 10 | "Dubai app launch checklist: App Store, Google Play, Huawei AppGallery, payments" | Gulf |
| 11 | "Fixed-price vs time-and-materials vs squad: which contract fits?" | Vendor choice |
| 12 | "Shopify/Magento replatform checklist for EU e-commerce" | EU |

Cadence after day 90: 4–6 quality pieces/month + a quarterly refresh of the top 10 pages (update `dateUpdated`; the sitemap uses it for `lastmod`).

### 4.5 Original-data content (links come from this)
Publish 1–2 pieces a quarter nobody else has:
- "Gulf app development pricing report" (survey 20–30 buyers + our own quotes, anonymised).
- "State of AI chatbots in GCC customer support" (benchmarks from our RAG evals).
- Open-source a small tool (see §6.4) with a write-up.

### 4.6 Quality gate before publishing
Use the CMS SEO sidebar. Do not publish below the "good" threshold; must have: focus keyword in title/H1/first paragraph/meta, meta description 140–160 chars with a benefit and CTA, ≥3 internal links, ≥1 external authoritative link, descriptive image alt, Key takeaways block, FAQ where natural, named author. Human edit pass — do not publish raw AI output (the repo has AI generation helpers; use them for drafts only, add real experience, numbers, screenshots, code).

### 4.7 Multilingual / regional (phase 3)
Arabic (RTL) and German versions of the 6–8 top money pages with `hreflang`. Do this **after** English pages rank; machine-translated thin pages hurt. Requires routing work (Next.js i18n) — scope separately.

---

## 5. Technical SEO — remaining gaps & verification

Most items exist (see `SEO-STRATEGY.md`). Do these to *verify and close gaps*:

| Priority | Task | Detail |
|----------|------|--------|
| P0 | Search Console + Bing verified | Set `googleSiteVerification` / `bingSiteVerification` in Admin → Site & SEO; submit `/sitemap.xml`; confirm domain property (covers www/non-www/http) |
| P0 | Single canonical host | Confirm `www` → apex (or reverse) 301 at the host/DNS; HTTPS-only; HSTS already set |
| P0 | `INDEXNOW_KEY` set in prod | `/indexnow-key.txt` must return the key |
| P0 | Fill `sameAs` and `twitterSite` | LinkedIn, X, GitHub, Clutch, Crunchbase, YouTube — feeds Organization schema |
| P0 | Add contact points | Phone, WhatsApp, email, `address` (Mumbai) and `areaServed` (AE, SA, DE, GB, NL, IN…) to Organization JSON-LD; consider `ProfessionalService` subtype |
| P1 | Core Web Vitals | Field data in Search Console (CrUX), not only Lighthouse. Targets LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 on mobile. Check hero slider (`HomeSlider`), WhatsApp/chat widgets, Meta Pixel and fonts (two Google fonts) for LCP/INP cost; lazy-load the chat widget after interaction |
| P1 | Image SEO | Fix empty `alt` on avatars/icons; descriptive filenames; Cloudinary `f_auto,q_auto`; explicit width/height |
| P1 | Review schema hygiene | Only mark up reviews that are genuine and visible; don't self-serve `AggregateRating` for your own company on your own site (Google ignores/penalises) |
| P1 | Redirect audit | Admin → Redirects: no chains, no 302s for permanent moves; 404 log review monthly |
| P1 | Feature-flag safety | When `marketing_blog` etc. are off, pages redirect to `/feature-unavailable` — confirm it is `noindex` and not in sitemap (sitemap already filters) |
| P2 | Structured data validation | Run every template through Rich Results Test + Schema Validator; check no duplicate Organization nodes |
| P2 | Crawl budget hygiene | `/api/` and `/admin` disallowed (done); ensure UTM params don't create indexable duplicates (canonical self-referencing without params — verify with `UtmCapture`) |
| P2 | Log/crawl monitoring | Vercel logs or Cloudflare analytics: Googlebot, Bingbot, OAI-SearchBot, PerplexityBot hits and status codes |
| P2 | Decide AI-training policy | `blockAiTraining` toggle: keeping it **off** maximises exposure in AI answers; turning on blocks GPTBot/ClaudeBot/Google-Extended training only, search crawlers stay allowed. Recommendation: leave off unless legal requires |
| P3 | Dedicated `/pricing` route | Pricing model exists in code (`pricing-content.ts`) for torqOS; add a services-pricing page with `Offer`/`Service` markup |
| P3 | Video | Embed explainer/demo videos (torqOS exists) with `VideoObject` schema, transcript on page |

---

## 6. Off-site: links, citations, authority

New domain + service business = **authority is the real gap**. Quality over quantity; never buy links or PBNs.

### 6.1 Directories & review platforms (week 1–4, highest ROI; also what LLMs cite)
| Platform | Why |
|----------|-----|
| **Clutch** | #1 B2B services directory; reviews drive both rankings and deals. Goal: 5 verified reviews in 90 days |
| **GoodFirms**, **DesignRush**, **TechBehemoths**, **Sortlist**, **TopDevelopers** | Additional listings + backlinks |
| **Google Business Profile** (Mumbai; service-area businesses can hide address) | Local pack + brand SERP; collect Google reviews |
| **LinkedIn Company Page** (+ founders' profiles) | Brand SERP, sales engine |
| **Crunchbase, AngelList/Wellfound, Product Hunt (torqOS), G2/Capterra (torqOS)** | Entity corroboration |
| **GitHub org**, **npm/Dev.to/Hashnode/Medium** | Developer credibility; canonical back to our site |
| Regional: **Dubai Chamber / DMCC / Dubai Silicon Oasis ecosystem listings, KSA Monsha'at, NASSCOM, Indian IT export directories, German "Gulp/Freelancermap" style partner listings** | Regional trust + links |

NAP (name, address, phone) and descriptions must be **identical** everywhere.

### 6.2 Review engine
- After every milestone, send a 3-question review request (Clutch interview link, Google). Template + automation via n8n/Gmail.
- Put review badges and 2–3 verbatim quotes (with names) on the homepage and money pages.

### 6.3 Digital PR / link building (months 2–6)
1. **Data pieces** (§4.5) pitched to tech/business press: Gulf News tech, Arabian Business, Entrepreneur ME, Wamda, MAGNiTT, YourStory, Inc42, Economic Times Tech, heise/t3n (DACH).
2. **Expert quotes**: Connectively (ex-HARO), Qwoted, Featured.com, Terkel. 2–3 answers per week, as a named senior engineer.
3. **Guest articles** on engineering/startup blogs with a *useful* technical angle (not "5 reasons to hire us").
4. **Partnerships**: payment gateways, cloud partners (AWS/GCP/Azure partner pages), CRM/ERP vendors, incubators and accelerators — ask for partner-directory listings.
5. **Client & case-study links**: ask each client to link from their site/press release/launch post.
6. **Podcast/webinar** appearances with show-note backlinks.
7. **Unlinked brand mentions**: Google Alerts for "Torq Studio" / "torqOS"; request links.
8. **Resource pages & broken-link building**: find "list of app development cost resources" pages and "Gulf startup resources"; pitch our cost guide.

Target: 5–8 *relevant* referring domains/month; 30–50 by month 6 (assumption — adjust to Ahrefs baseline).

### 6.4 Link-magnet assets (cheap, compounding)
- **Torq DevTools** (`/freebies`) — each tool page is a standalone landing page targeting "json formatter", "jwt decoder", "hash generator"… Low conversion but earns links and trains the entity as a dev-credible brand. Add an inline "Need this built into your product? Talk to us" CTA. Also submit to Product Hunt, Hacker News (Show HN), r/webdev, dev.to.
- **App/CRM cost calculator** (simple interactive page) — ranks for "cost" queries and generates leads (email-gated PDF estimate).
- **Business Systems Audit** (`/business-systems/audit`) — already a lead magnet; add a shareable result summary.

---

## 7. torqOS — separate product funnel

torqOS has a different buyer and keyword set (product-led, SaaS comparison terms). Keep it in the same domain for authority, but plan it separately:

- Keywords: "[category] software for [industry]", "alternative to X", "X vs torqOS", "how to automate [process]". **Define the category first** — whatever torqOS is (CRM/ops/business platform) drives the whole keyword set.
- Pages: `/torqos` (hub), `/torqos/modules/*`, `/torqos/pricing`, `/torqos/vs/<competitor>`, `/torqos/for/<industry>`, integrations.
- Social proof: G2/Capterra listing, demo video with `VideoObject`, public changelog (freshness), docs.
- Funnel: demo request → trial → onboarding email sequence. Measure separately (GA4 audience/segment).

---

## 8. How we get customers (channels by speed)

SEO is slow. A service business at this stage needs a **blended** plan. Rough expected time to first qualified leads:

| Channel | Time to first leads | Effort | Notes |
|---------|--------------------|--------|-------|
| **Founder-led LinkedIn outbound** (Sales Navigator) to UAE/KSA/DACH CTOs, founders, heads of digital | 1–4 weeks | High | Highest ROI early. 30–50 personalised touches/day max; warm with profile views + comments first. Offer the free audit/30-min consult, not a pitch deck |
| **Referrals & partner agencies** (white-label) | 2–8 weeks | Medium | Ask every past client; formal 10% referral fee; agencies in design/marketing without engineering |
| **Directories (Clutch, GoodFirms…)** | 4–12 weeks | Medium | Reviews convert; ranks for "top X in Y" |
| **WhatsApp-first conversion** | immediate | Low | The floating WhatsApp button already exists. Gulf and India buyers prefer WhatsApp. Add a pre-filled message per page ("Hi, I read your {page title} guide…") and track clicks as conversions |
| **Google Ads (tight, high-intent)** | 1–2 weeks | Medium | Exact/phrase: "app development company dubai", "crm development company", "hire react native developers". Geo-target AE, SA, DE; exclude "free/jobs/course/tutorial". Start $20–40/day, landing pages = service×location pages. Doubles as keyword validation for SEO |
| **LinkedIn content** | 4–12 weeks | Medium | 3 posts/week from named engineers: architecture teardowns, post-mortems, cost breakdowns. Repurpose every blog post |
| **Upwork/Toptal-style marketplaces** (selective) | 1–3 weeks | Medium | Use for first reviews/case studies only, then move clients to direct contracts |
| **Events / communities** | 2–6 months | Medium | GITEX Global, Gulf Information Security, Arab Health (if healthcare), Web Summit, Slush, local meetups; sponsor/speak; ESN/startup Slack & WhatsApp groups |
| **Organic SEO (this plan)** | 3–6 months for Tier B; 6–12 for Tier A | High | Compounding; cheapest at scale |
| **Email nurture** | ongoing | Low | Audit and DevTools sign-ups → 5-email sequence (case study, cost guide, process, FAQ, call CTA) |
| **YouTube / short demos** | 3–6 months | Medium | "How we built X" teardowns; also feeds AI-Overview video citations |

### 8.1 Conversion architecture (so traffic becomes revenue)
- **Primary CTA:** "Book a free 30-min technical consultation" (calendar embed, e.g. Cal.com) — one primary CTA per page, not five variants ("Get started" / "Contact sales" / "Book a call" / "Claim offer" currently compete).
- **Secondary:** WhatsApp; Business Systems Audit; downloadable cost guide.
- **Contact form:** ≤5 fields (name, email, company, budget range, project summary); honeypot already present; auto-reply within 1 min; internal SLA < 4 business hours (site promises 24h average — beat it).
- **Lead qualification:** budget bands + timeline + country at submit; route Gulf/EU leads to the founder immediately.
- **Proof near every CTA:** review badge, 1 client quote, "reply within 24h", "NDA available".
- **Exit/stale offers:** time-boxed offers must auto-expire (flag + end date).

---

## 9. AEO / GEO (appearing in ChatGPT, Perplexity, Gemini, AI Overviews)

Already in place: `llms.txt`/`llms-full.txt`, AI-search bots allowed, answer-first Key takeaways, entity-linked JSON-LD, IndexNow (feeds Bing → Copilot/ChatGPT Search).

To add:
1. **Third-party corroboration** (§6.1) — LLMs lean on Clutch, LinkedIn, Wikipedia-like sources, Reddit, listicles. Appear in 5+ "best software companies in {city/country}" lists.
2. **Quotable facts with sources**: "Typical MVP: X–Y weeks; budget $A–B" in 40–60-word self-contained paragraphs under question-style H2s.
3. **Named, credentialed authors** with LinkedIn/GitHub `sameAs` in `Person` schema.
4. **Freshness**: visible "Updated {date}" on cost guides; real `dateModified`.
5. **Reddit / Quora / Stack Overflow**: genuine, non-promotional answers by named engineers on r/startups, r/dubai, r/SaaS, r/androiddev etc. (disclose affiliation).
6. **Monthly AI-visibility check**: run a fixed set of 25 prompts ("best app developers for UAE fintech…") in ChatGPT, Perplexity, Gemini, Copilot; log whether Torq is mentioned/cited and which sources are. Tools: Profound, Otterly, or manual.
7. Watch **referrer** traffic from `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com` in GA4.

---

## 10. Product / engineering backlog (codebase changes)

Ordered by impact. Each is small and fits existing modules — extend, don't fork (per `AGENTS.md` reuse guardrails).

| # | Change | Where |
|---|--------|-------|
| 1 | Update default `siteContent` title/description/keywords to the new positioning (Tier A/B terms) | `src/lib/content.ts` (`getDefaultSiteContent`), then set in Admin |
| 2 | Homepage H1 / hero copy + named proof + phone/WhatsApp/address | `src/components/Hero.tsx`, `TrustBar.tsx`, `Footer.tsx`, `home-content.ts` |
| 3 | Organization JSON-LD: `address`, `telephone`, `contactPoint`, `areaServed`, `sameAs`, `knowsAbout`, `foundingDate` | `src/app/layout.tsx` + `site-content` fields |
| 4 | Add `ProfessionalService`/`Person` (author) schema for team members; `Review` only for genuine third-party-verified reviews | `src/lib/seo.ts`, `src/lib/cms/metadata.ts` |
| 5 | Seed location pages (Mumbai, Dubai, Riyadh, DACH, UK, NL) and industry pages as CMS entries with unique content | `prisma/seed-cms.ts` / Admin → CMS |
| 6 | `/pricing` (services) page + `Service`/`Offer` schema | new CMS **Landing** page type (no new route needed — catch-all) |
| 7 | Promo banner: add start/end dates so `OfferBanner` auto-hides; stop hard-coding "Black Friday" copy | `src/components/OfferBanner.tsx`, `Offers.tsx`, admin |
| 8 | Alt-text audit & lint rule for missing `alt` | components + `eslint.config.mjs` |
| 9 | Lazy-load `FloatingChatWidget`, `MetaPixel` after interaction/idle to protect INP/LCP | `src/app/layout.tsx` |
| 10 | Per-page WhatsApp prefilled message + GA4 `generate_lead` events for WhatsApp click, form submit, calendar booking, audit completion | `FloatingWhatsApp.tsx`, `src/lib/analytics.ts`, `UtmCapture.tsx` |
| 11 | Store first-touch UTM + landing page + referrer on lead records so we can attribute revenue to channel/keyword | `UtmCapture.tsx`, `src/lib/utm.ts`, Prisma lead model |
| 12 | Calendar embed (Cal.com) on `/contact` and service pages | `contact/page.tsx`, `CTA.tsx` |
| 13 | Related-content blocks wired by default on every guide (hub-and-spoke) | `RelatedContentSection.tsx`, `related-links.ts` |
| 14 | Add `Dataset`/`HowTo`-free approach: don't add deprecated rich results; stick to Article, FAQPage, BreadcrumbList, Organization, Service, VideoObject | `src/lib/seo.ts` |
| 15 | Add tests for new schema generators (extends `seo-aeo.test.ts`) | `src/lib/seo-aeo.test.ts` |

**Feature flags to use in rollout** (`/admin/feature-flags`): keep `marketing_blog`, `marketing_contact_form`, `floating_whatsapp` **on**; use `torqos_landing` and `business_systems_audit` to stage product pages; never leave `maintenance_mode` on (503/maintenance hurts crawling). Suggested new flags: `promo_banner` (with end date), `pricing_page`, `calendar_booking` for safe staged launches.

---

## 11. 90-day roadmap

### Days 0–14 — Foundations & quick wins
- [ ] Verify Search Console (domain) + Bing; submit sitemap; confirm `INDEXNOW_KEY`.
- [ ] Finalise positioning, ICPs, keyword map (§1–2) → tracker sheet.
- [ ] Rewrite homepage H1/hero, meta title/description, FAQ; add phone/WhatsApp/address.
- [ ] Fill `sameAs`, social handles; create/complete LinkedIn, Google Business Profile, Crunchbase, GitHub org.
- [ ] Create Clutch + GoodFirms + DesignRush listings; request first 3 reviews from past clients.
- [ ] Fix alt text; run Lighthouse/CrUX; remove/expire stale Black Friday banner.
- [ ] Set up GA4 conversions (form, WhatsApp, calendar, audit), Looker Studio dashboard.
- [ ] Start LinkedIn outbound (20/day) with the free audit offer.

### Days 15–45 — Money pages & proof
- [ ] Publish/expand 5 service pages + 3 location pages (Dubai, Riyadh, Mumbai) + 2 industry pages (fintech, logistics) to the §4.2 template.
- [ ] Rebuild the 4 case studies to §4.3 standard; get ≥2 named, permissioned.
- [ ] Publish 6 Tier B articles (cost ×2, comparison ×2, compliance ×1, vendor choice ×1).
- [ ] Launch `/pricing` and calendar booking.
- [ ] Start Google Ads test on 10 exact-match keywords; harvest search-term data.
- [ ] 10 expert-quote responses; 2 guest-post pitches; directory submissions complete.

### Days 46–90 — Scale & authority
- [ ] Publish 12 more articles (calendar §4.4); refresh 4 earliest.
- [ ] Launch first original-data piece + PR outreach; target ≥10 new referring domains.
- [ ] Germany/UK/NL location + industry pages; 3 comparison pages.
- [ ] Email nurture sequence live; cost-calculator live.
- [ ] torqOS: define category, publish 3 pages + G2/Capterra/Product Hunt listings.
- [ ] First AI-visibility audit (§9.6); first full rank/traffic/lead review; prune or merge underperforming pages.

### Months 4–12
- Double down on clusters showing impressions-without-clicks (improve titles/snippets) and positions 8–20 (add depth, links).
- Arabic and German versions of top pages with hreflang.
- Case study every month; video series; 1 original-data report per quarter.
- Evaluate programmatic (service × city) pages **only** if each can carry genuinely unique data.

---

## 12. Measurement

### 12.1 Stack
- **Google Search Console** (queries, pages, CWV, indexing), **Bing Webmaster Tools** (+ AI performance if available), **GA4** (conversions, referrers incl. AI sources), **Looker Studio** dashboard joining GSC + GA4, **Ahrefs/Semrush** (rank tracking by country: AE, SA, DE, GB, IN), **Clarity/Hotjar** (heatmaps), CRM/Admin Leads table for pipeline.

### 12.2 KPI ladder (targets are planning assumptions — recalibrate at day 30)

| Layer | Metric | Day 30 | Day 90 | Day 180 | Day 365 |
|-------|--------|--------|--------|---------|---------|
| Indexing | Indexable pages indexed | ≥90% | ≥95% | ≥95% | ≥95% |
| Visibility | GSC impressions/mo | baseline | 3× | 10× | 30× |
| Rankings | Keywords in top 10 (target set) | 0–3 | 10+ | 30+ | 80+ |
| Traffic | Non-brand organic sessions/mo | baseline | 2× | 5× | 15× |
| Authority | Referring domains (relevant) | +5 | +20 | +50 | +120 |
| Reviews | Clutch + Google reviews | 2 | 5 | 10 | 20 |
| Leads | Qualified inbound leads/mo (all channels) | 3–5 | 8–12 | 15–25 | 30+ |
| Leads | …of which organic | 0–1 | 2–4 | 6–10 | 15+ |
| Revenue | Won deals attributed (first-touch + last-touch) | — | 1 | 2–3/qtr | 6+/qtr |
| AEO | Mentions in the 25-prompt AI check | baseline | +20% | +50% | +100% |

### 12.3 Weekly / monthly rhythm
- **Weekly (30 min):** GSC anomalies, new pages indexed, leads and sources, outreach counts.
- **Monthly (2 h):** rank report, content performance, cannibalisation check, backlinks gained, AI-visibility check, update tracker.
- **Quarterly:** full technical crawl, content audit (refresh/merge/delete), competitor gap analysis, plan reset.

### 12.4 Competitor set to monitor
Direct (Gulf/India/EU studios & agencies): shortlist 8–10 from Clutch top results for "app developers Dubai", "software development Mumbai", plus larger benchmarks (Simform, Intellectsoft, Itransition, BairesDev). For each: top pages, referring domains, content they rank for that we don't (Ahrefs Content Gap), and the review platforms they win on.

---

## 13. Risks & guardrails

| Risk | Mitigation |
|------|-----------|
| Thin/duplicate location pages → doorway penalty | One unique, data-rich page per location; no templated mass generation |
| AI-generated filler content | Human review, named expert, original numbers/screenshots; use AI for outlines/drafts |
| Fake or unverifiable stats | Cite source/period for every number, or remove it |
| Fake reviews / self-reviews schema | Never; only verified third-party reviews |
| Over-reliance on one channel | Keep outbound + directories + referrals running while SEO matures |
| Cannibalisation across service/location/blog pages | Keyword map with one primary query per URL; review monthly |
| Stale offers/content | Expiring banners; quarterly refresh; accurate `dateModified` |
| Black-hat link tactics | No purchased links/PBNs/exchanges; disavow only if a real spam attack appears |
| Staging indexed by mistake / prod blocked | `robotsNoIndex` only for staging; verify `robots.txt` after every deploy |
| Admin/CMS publish errors breaking SEO | Use the CMS SEO sidebar gate; redirects auto-created on slug change; weekly crawl |

---

## 14. Immediate next 10 actions (this week)

1. Confirm Search Console and Bing are verified and the sitemap is submitted.
2. Decide and write the one-line positioning (§1.1); update site title/description/keywords in Admin.
3. Rewrite the homepage H1 and add phone/WhatsApp/address + FAQ.
4. Fill `sameAs` / social profiles; create LinkedIn, Google Business Profile, Clutch, GoodFirms.
5. Email the 4 case-study clients for named permission + a Clutch review.
6. Replace the Black Friday banner with a dated, auto-expiring offer.
7. Draft the first two money articles: UAE app cost guide and India-vs-UAE-vs-Europe hiring cost.
8. Set up GA4 conversions for form, WhatsApp, calendar, audit.
9. Start 20 personalised LinkedIn outreach messages per day to Gulf/DACH decision-makers.
10. Build the keyword → URL tracker (sheet) with owners and due dates.

---

## Appendix A — Meta title / description patterns

| Page type | Title (≤60 chars) | Description (140–160 chars) |
|-----------|-------------------|-----------------------------|
| Home | `Torq Studio | Mobile, Web & AI Engineering for Gulf & Europe` | `Mumbai-based senior engineers building mobile apps, web platforms, CRMs and AI for companies in the UAE, Saudi Arabia and Europe. Free 30-min consultation.` |
| Service × location | `App Development Company in Dubai, UAE | Torq Studio` | `Senior iOS, Android and React Native team for UAE fintech, logistics and e-commerce. Fixed-scope MVPs from $X. See case studies and book a call.` |
| Cost guide | `App Development Cost in the UAE (2026 Guide)` | `Real price ranges for MVPs, fintech and enterprise apps in the UAE, by scope and team model — with a cost checklist from 50+ launches.` *(only keep "50+ launches" if substantiated)* |
| Comparison | `React Native vs Flutter for Fintech Apps (2026)` | `Performance, security, hiring and cost compared for fintech teams — plus when we choose native instead.` |
| Case study | `UAE Fintech Banking App: iOS & Android in 6 Months` | `How Torq Studio delivered a regulated banking app for a UAE fintech — scope, architecture, timeline and measured results.` |

## Appendix B — Conversion-event map (GA4)

`generate_lead` (contact form), `whatsapp_click`, `calendar_booked`, `audit_started`, `audit_completed`, `cost_guide_download`, `torqos_demo_request`, `phone_click`, `email_click`. Mark the first five as key events; add `page_location`, `utm_*`, `landing_page`, and `country` as parameters.

## Appendix C — Quick reference to repo modules

| Need | File |
|------|------|
| Site title/description/keywords/sameAs defaults | `src/lib/content.ts` |
| Sitemap / robots / llms | `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/crawlers.ts`, `src/lib/llms-txt.ts` |
| Schema helpers | `src/lib/seo.ts`, `src/lib/cms/metadata.ts` |
| CMS pages, blocks, link suggestions | `src/lib/cms/*`, `src/components/cms/*`, `src/components/admin/cms/*` |
| Services fallback content | `src/data/services-content.ts` |
| Feature flags | `src/lib/feature-flags-schema.ts`, `/admin/feature-flags` |
| UTM / analytics / pixel | `src/lib/utm.ts`, `src/lib/analytics.ts`, `src/lib/meta-pixel.ts` |
| Technical checklist (already done) | `docs/SEO-STRATEGY.md` |
