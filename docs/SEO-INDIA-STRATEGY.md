# Torq Studio — India-Only SEO Strategy

Scope: every service (mobile apps, websites, e-commerce, ERP, CRM, AI/chatbots, custom software, SaaS/MVP, consulting) targeting **buyers in India only**.
This **replaces the Gulf/Europe targeting** in `SEO-GROWTH-PLAN.md` and `TOPICAL-CLUSTERS.md`; their technical, linking and measurement sections still apply. Keyword volumes below are not checked. Pull them from **Semrush → India database** before committing.

---

## 1. The India reality (changes the whole approach)

| Fact | Consequence |
|------|-------------|
| Extremely crowded: thousands of "software company in Mumbai/Bangalore" agencies, many with strong directories and years of backlinks | Do **not** chase "software development company India". Win on vertical + service + city + price-transparency long-tail |
| Buyers are price-sensitive and compare 3–5 quotes | Publish **INR price ranges**, not "contact us for a quote". Cost pages convert best here |
| Trust signals matter more than design: GST registration, Udyam/Startup India, client names, Clutch/Google reviews, a real address and phone | Put all of these on-site and in schema |
| Buyers search in English, Hinglish and on mobile; many start on **Google Maps / Business Profile**, **WhatsApp** and **YouTube** | Local SEO + WhatsApp-first conversion + short videos |
| Many SME buyers want **ERP/CRM that fits Tally, GST, e-invoicing, UPI** | Compliance- and tooling-specific content is a moat |
| Typical ticket sizes are lower, but volume is higher | Productised packages (fixed price, fixed scope) beat custom-quote-only pages |

**Positioning (replace the Gulf-centred one-liner):**
> Torq Studio is a Mumbai-based senior engineering studio building mobile apps, websites, ERP, CRM and AI systems for Indian businesses, with fixed-scope pricing in rupees and direct access to the engineers.

Keep "senior engineers, not slide decks" as the tagline.

---

## 2. Who we target (India ICPs, ranked)

| Rank | ICP | Services they buy | Entry offer |
|------|-----|-------------------|-------------|
| 1 | **Funded / early-stage startups** (Mumbai, Bangalore, Pune, Delhi NCR, Hyderabad) | MVP mobile app, SaaS, AI features, CTO-as-a-service | Fixed-scope MVP package, paid discovery |
| 2 | **SMEs in manufacturing, distribution, trading, retail** (Maharashtra, Gujarat, Tamil Nadu, Punjab clusters) | ERP, CRM, inventory/billing, Tally/GST integration, website | Business Systems Audit → ERP/CRM package |
| 3 | **D2C and e-commerce brands** | Shopify/custom store, app, replatform, WhatsApp automation | Store build + growth retainer |
| 4 | **Services SMBs** (clinics, real estate, education, logistics, finance/NBFC) | CRM, booking apps, portals, WhatsApp bots | Industry CRM template + customisation |
| 5 | **Digital / marketing / design agencies** | White-label development | Dedicated engineers |
| 6 | **Mid-market enterprises** (slow, high value) | AI automation, modernisation, internal tools | Audit + pilot |

---

## 3. Keyword strategy by service

For each service: **1 pillar, cost page, comparison, city pages (selective), industry pages, compliance/tool pages.** Real queries to validate in Semrush India (volumes and KD are not checked):

### 3.1 Mobile app development
- **Money:** mobile app development company in Mumbai / Pune / Bangalore / Delhi, app development company India, android app development company, iOS app developers India, react native app development company India, flutter app development company India.
- **Cost (highest conversion):** mobile app development cost in India, how much does it cost to make an app in India, app development cost in INR, cost of android app development in India, MVP development cost India.
- **Vertical:** fintech app development India, healthcare app, edtech, logistics, real-estate, food delivery app development cost, on-demand app, super app.
- **Decision:** React Native vs Flutter, native vs cross-platform for Indian startups, hire app developers India monthly cost.
- **India specifics:** UPI payment integration in app, Razorpay / Cashfree / PayU integration, Aadhaar eKYC / DigiLocker integration, WhatsApp OTP, app for tier-2 cities / low-end Android, Play Store policy for fintech/lending apps in India.

### 3.2 Website, web app and e-commerce
- website development company in Mumbai/India, custom website development cost India, web development cost in INR, business website design price India, ecommerce website development company India, Shopify development India, WooCommerce vs Shopify India, Next.js vs WordPress, website redesign for SEO.
- **Local B2B:** website for manufacturers, clinic website, school website, real-estate website, B2B portal development.
- **Technical authority:** Core Web Vitals India mobile, website speed for 4G, DPDP-compliant cookie consent.

### 3.3 ERP
- ERP software development company India, custom ERP development cost India, ERP for manufacturing / distribution / pharma / retail / textile / construction, ERP vs Tally, Tally integration with custom software, ERP for small business India, ERP implementation timeline, Odoo vs custom ERP, GST-compliant ERP, e-invoicing ERP integration, inventory management software for SMEs India.
- **Decision content:** build vs buy ERP, Zoho vs Odoo vs custom, ERP implementation failure reasons.

### 3.4 CRM
- CRM development company India, custom CRM development cost India, CRM for real estate / education / insurance / clinics / logistics, CRM with WhatsApp integration India, Zoho CRM vs custom CRM, HubSpot alternative India, lead management software India, build CRM from scratch.

### 3.5 AI and automation
- AI chatbot development company India, WhatsApp AI chatbot for business India, AI chatbot cost India, AI automation for small business, AI customer-support bot, RAG chatbot for company documents, voice bot India, AI for sales/lead qualification, Hindi / Hinglish chatbot, ChatGPT integration for business, AI document processing (invoices, KYC).
- **Compliance:** DPDP Act and AI chatbots, data residency for LLM apps in India.

### 3.6 Other services
- **Custom software / SaaS / MVP:** custom software development company India, SaaS development cost India, MVP development for startups India, startup tech partner, build vs hire dev team India.
- **Hiring / team:** hire dedicated developers India, hire React Native developer India, dedicated development team cost India, CTO as a service India, fractional CTO for startups.
- **Consulting:** technical audit, code review, tech due diligence for investors, app modernisation, API development.
- **UI/UX:** UI UX design company Mumbai, app design cost India.

> Rule: one primary keyword per URL; map every one in the tracker.

---

## 4. Site architecture for India

```
/                                  Home (India positioning, INR pricing teaser, named proof)
├─ /services/mobile-app-development
├─ /services/web-development             (existing slug: keep it, add India copy. Do NOT create website-development)
├─ /services/ecommerce-development       (new CMS page, type Service)
├─ /services/erp-development             (new CMS page, type Service)
├─ /services/crm-development             (new CMS page, type Service)
├─ /services/ai-solutions                (existing slug: keep it; add /solutions/whatsapp-ai-chatbot as a Solution)
├─ /solutions/saas-mvp-development       (new CMS page, type Solution)
├─ /services/remote-it                   (existing slug = hire dedicated developers; keep)
├─ /services/technical-consulting        (existing slug; add CTO-as-a-service section)
├─ /pricing                              (CMS page type Landing with custom path "/pricing": INR packages)
├─ /locations/                           mumbai, pune, bangalore, delhi-ncr, hyderabad, ahmedabad, chennai
├─ /industries/                          fintech, healthcare, real-estate, education, logistics, manufacturing, retail, d2c
├─ /case-studies/                        (Indian clients; named)
├─ /resources/guides/ and /blog/         (CMS Guide default path is /resources/guides/<slug>; comparisons /compare/, glossary /resources/glossary/)
├─ /freebies/                            (built-in section: cost calculators, DevTools; calculators need code)
└─ /about, /contact (phone + WhatsApp + Mumbai address)
```

### Location pages: the doorway-page trap
- **Tier 1 city pages** (Mumbai, Pune, Bangalore, Delhi NCR, Hyderabad): create only when each has **unique** content: local clients/case study, local startup ecosystem, local events, team availability (remote vs on-site), city-specific FAQs. Otherwise do not create it.
- **Service × city** (e.g. "ERP for manufacturers in Pune/Coimbatore"): only where a real industrial cluster justifies it. Never mass-generate 50 templated city pages.
- Since Torq is remote-first, say so ("serving Pune clients remotely, meetings in person on request"). Do not fake an office; the Google Business Profile needs a real address.

---

## 5. Content plan (clusters, India edition)

Build order: **1 Mobile app → 2 ERP/CRM (SME) → 3 AI/WhatsApp → 4 Website/e-commerce → 5 Startup/MVP → 6 India compliance.**

### Cluster A — Mobile apps
Pillar `/services/mobile-app-development`.
1. App development cost in India (INR, by app type) **← first piece**
2. App development cost in Mumbai vs Bangalore vs Pune vs tier-2 cities
3. How to choose an app development company in India (red flags, questions)
4. MVP app development India: scope, timeline, budget
5. React Native vs Flutter vs native for Indian startups
6. UPI / Razorpay / Cashfree integration guide
7. Aadhaar eKYC and DigiLocker in apps
8. Building for low-end Android and 4G in India
9. Fintech / lending app: Play Store and RBI digital-lending considerations *(verify with a compliance source)*
10. Case study: [named Indian client]

### Cluster B — ERP and CRM for SMEs (biggest India opportunity)
Pillars `/services/erp-development`, `/services/crm-development`.
1. Custom ERP cost in India (by company size/industry)
2. ERP vs Tally: when to outgrow Tally
3. Tally integration with custom software
4. GST e-invoicing and e-way bill in ERP
5. ERP for manufacturing / distribution / pharma / textile (one page each)
6. Build vs buy: custom ERP vs Zoho vs Odoo vs SAP Business One
7. ERP implementation timeline and why projects fail
8. Custom CRM cost in India; CRM vs Zoho / HubSpot / LeadSquared
9. CRM with WhatsApp Business API for real estate / education / insurance
10. Spreadsheet to software migration checklist
11. Tools: ERP cost calculator, **Business Systems Audit** (already built)

### Cluster C — AI and WhatsApp automation
1. AI chatbot cost in India
2. WhatsApp chatbot for business: setup, WhatsApp Business API pricing, use cases
3. AI chatbot for Hindi/Hinglish customers
4. RAG chatbot over your documents: how it works
5. AI automation for SMEs: 10 workflows with ROI
6. DPDP Act and AI apps: what Indian businesses must do
7. Case study: AI support assistant (KSA case reworded or an Indian one)

### Cluster D — Website and e-commerce
1. Website development cost in India (INR)
2. Shopify vs WooCommerce vs custom for Indian D2C
3. Next.js vs WordPress for Indian business sites
4. Website speed on Indian mobile networks (Core Web Vitals)
5. Payment gateway comparison for Indian e-commerce
6. SEO-friendly website redesign checklist

### Cluster E — Startup / MVP / hiring
1. MVP cost and timeline India; 2. tech co-founder vs agency vs CTO-as-a-service; 3. hire dedicated developers: cost per month in India; 4. fixed price vs T&M vs dedicated team; 5. how to hire a developer for a startup without a technical co-founder; 6. due-diligence checklist for outsourcing.

### Cluster F — India compliance (authority moat)
**DPDP Act 2023 for app/website owners; GST e-invoicing for software; RBI/PCI basics for payment apps; CERT-In rules for hosting/logs; accessibility (RPwD).** Have these reviewed by a CA/lawyer before publishing, with "last reviewed" dates.

**Cadence:** 2 pieces/week for 12 weeks, then 4–6/month plus quarterly refreshes.

---

## 6. On-page rules (India-specific)

1. **Currency:** ₹ / INR first, in lakh/crore notation where natural ("₹4–8 lakh"). Prices as ranges with scope assumptions.
2. **Locale:** change `en-US` to **`en-IN`** (see §9).
3. **Mobile-first:** most Indian traffic is mobile on 4G; keep LCP ≤ 2.5s on throttled mobile; lazy-load the chat widget.
4. **Contact visible:** phone, WhatsApp click-to-chat (prefilled per page), email, Mumbai address, working hours (IST) on every page footer and contact page.
5. **Trust block** on every service page: GST/Udyam number (if willing), years in business, named clients, Clutch/Google rating, "NDA signed on request", IP ownership clause.
6. **FAQ** (FAQPage schema) in plain Indian-business language: GST invoice, payment milestones, source code ownership, post-launch support, hosting costs, timelines.
7. **Packages page** (`/pricing`): 3–4 fixed-scope packages (e.g. Business Website, MVP App, CRM Starter, WhatsApp AI Bot) with inclusions, timeline, price range, "what's not included".
8. Hinglish/Hindi: do **not** machine-translate whole pages. Test Hindi only for 2–3 high-volume pages after English ranks; otherwise use Hinglish phrases in FAQs and YouTube titles where searchers do.

---

## 7. Local SEO and directories (India-specific, do in weeks 1–4)

| Channel | Action |
|---------|--------|
| **Google Business Profile** | Mumbai address (real, verified), category "Software company", services list, photos, weekly posts, ask every client for a review. NAP identical everywhere |
| **Clutch / GoodFirms / TopDevelopers / DesignRush** | Profiles + reviews. Still the main B2B proof in India |
| **JustDial, Sulekha, IndiaMART (services)** | Listings with consistent NAP; useful for SMEs searching locally |
| **LinkedIn** (company + founders) | Main B2B channel; post weekly |
| **Startup / ecosystem** | Startup India, NASSCOM, T-Hub, Mumbai/Pune/Bangalore incubators, YourStory / Inc42 / Entrackr / Moneycontrol (guest posts, expert quotes) |
| **Communities** | r/developersIndia, r/indianstartups, Indian founder WhatsApp/Slack/Telegram groups, Quora India, Twitter/X tech India |
| **YouTube** | Short explainers in English/Hinglish: "App development cost in India", "ERP vs Tally", "WhatsApp chatbot demo". Embed on pages with `VideoObject` |
| **Reviews** | Target 10 Google + 5 Clutch reviews in 90 days |

---

## 8. Link building for India

1. **Data/cost reports:** "What apps and ERPs actually cost in India 2026" from real quotes, pitched to YourStory, Inc42, Entrackr, ET Tech, Business Standard.
2. **Expert quotes:** Connectively, Qwoted, Featured; Indian journalists on LinkedIn/X.
3. **Guest posts:** Indian startup/tech blogs and SME communities with useful technical angles.
4. **Partnerships:** Razorpay/Cashfree/Zoho/Odoo partner directories, cloud providers, accountants and CA firms (they recommend ERP/CRM), agencies, incubators.
5. **Client links:** ask every client to link from launch posts/case studies.
6. **Free tools:** cost calculators, GST invoice generator, UPI QR generator, JSON/JWT DevTools. Tools earn links in India's large developer community.
7. **College / community:** talks at tech meetups, guest lectures, hackathon sponsorship, which also produce links from `.edu`/`.ac.in`.

Target: 5–8 relevant referring domains/month. **Never buy links**; the Indian SEO market is full of link-selling offers.

---

## 9. Code and technical changes for India

| # | Change | Where |
|---|--------|-------|
| 1 | `inLanguage: "en-US"` → `"en-IN"`; OG `locale: "en_US"` → `"en_IN"` | `src/app/layout.tsx`, `src/lib/seo.ts` (`webPageJsonLd`, `blogPostingJsonLd`, `articleJsonLd`) |
| 2 | Organization: `areaServed` → `IN` (+ states/cities where relevant), real `address`, `telephone`, `contactPoint` (hours IST), `foundingDate`, `taxID`/`vatID` only if you want GST public | `src/app/layout.tsx` (I added Gulf `areaServed`; change to India) |
| 3 | `LocalBusiness`/`ProfessionalService` schema with `priceRange` and `openingHours` on contact + location pages | `src/lib/seo.ts`, `src/lib/cms/metadata.ts` |
| 4 | Default site title/description/keywords → India versions | `src/lib/content.ts` (`getDefaultSiteContent`); also set in Admin → Site & SEO |
| 5 | Homepage H1/subheading/eyebrow → India positioning ("MUMBAI · INDIA"), INR pricing teaser | `src/lib/home-content.ts` |
| 6 | `/pricing` CMS Landing page with INR packages + `Service`/`Offer` schema | CMS |
| 7 | WhatsApp: prefilled message per page title; track clicks as GA4 `generate_lead` | `FloatingWhatsApp.tsx`, `src/lib/analytics.ts` |
| 8 | Search Console: set **International targeting not needed** (single country, `.com`); set GSC country filter = India in reports. Use Bing Webmaster too | external |
| 9 | CWV on throttled 4G mobile: image sizes (Cloudinary `f_auto,q_auto`), font loading (two Google fonts), defer Meta Pixel/chat | `layout.tsx`, `MetaPixel.tsx`, `FloatingChatWidget.tsx` |
| 10 | Cost calculators and audit pages live under `/freebies/*` (there is no `/tools` route) | existing `/freebies`, `/business-systems/audit` |
| 11 | Expiring offers: banner end-date field is already added | `isOfferBannerLive` |

---

## 10. Conversion (India)

- **WhatsApp first**, then call, then form. Sticky WhatsApp + "Call now" on mobile.
- Single primary CTA per page: "Get a fixed-price quote in 24 hours" or "Book a free 30-min call (IST slots)".
- Show price ranges before the CTA; it filters time-wasters and lifts quality.
- Form fields: name, phone/WhatsApp, company, budget band (₹), project summary. Auto-reply on WhatsApp and email.
- SLA: reply within 2 business hours (IST). Indian buyers go with whoever answers first.
- Lead magnets: ERP/app cost calculator PDF, Business Systems Audit, "App development checklist for Indian startups".
- Payment trust: milestone payments, GST invoices, MSA/NDA available.

---

## 11. Paid and other channels while SEO builds (first 60 days)

| Channel | Plan |
|---------|------|
| **Google Ads (search)** | Exact/phrase: "erp development company india", "custom crm development india", "whatsapp chatbot development", "app development company mumbai". City + service landing pages. Start ₹1,500–3,000/day; negative: free, course, job, tutorial, salary. Harvest search-term data to feed SEO |
| **LinkedIn outbound** | 20–30 personalised messages/day to founders/CTOs/ops heads of SMEs in your ICP verticals |
| **Referrals** | CA firms, accountants, agencies, existing clients; 10% referral fee |
| **Marketplaces** | Upwork/Clutch leads for first reviews only |
| **Events** | Local startup meets, Mumbai/Pune/Bangalore tech events, industry (manufacturing/retail) expos for ERP/CRM |
| **Email/WhatsApp nurture** | Audit and calculator sign-ups → 5-message sequence |

---

## 12. 90-day plan

**Days 0–14:** verify GSC + Bing; finish GBP; Clutch/GoodFirms profiles; switch locale to `en-IN`; India positioning on home/meta; Organization schema (India); phone/WhatsApp/address visible; `/pricing` draft; Semrush India keyword research → tracker; expire the old promo.
**Days 15–45:** publish 5 service pages (mobile, ERP, CRM, AI chatbot, website) to the full template; 2 city pages (Mumbai, Pune or Bangalore); 6 articles (app cost, ERP cost, CRM cost, ERP vs Tally, WhatsApp chatbot, website cost); 2 case studies rebuilt with named Indian clients; first 5 reviews; Google Ads test.
**Days 46–90:** 12 more articles; cost report + PR outreach; DPDP and GST guides (reviewed); YouTube explainers; tools/calculators; refresh the first articles; first rank/traffic/lead review and pruning.

---

## 13. KPIs (assumptions; recalibrate at day 30)

| Metric | Day 30 | Day 90 | Day 180 | Day 365 |
|--------|--------|--------|---------|---------|
| Keywords in India top 10 (target set) | 0–3 | 10+ | 30+ | 80+ |
| Non-brand organic sessions/mo | baseline | 2× | 5× | 15× |
| GBP views / calls / WhatsApp clicks | baseline | 2× | 4× | 8× |
| Reviews (Google + Clutch) | 3 | 10 | 20 | 40 |
| Relevant referring domains | +5 | +20 | +50 | +120 |
| Qualified inbound leads/mo | 3–5 | 8–12 | 15–25 | 30+ |
| Leads from organic | 0–1 | 2–4 | 6–10 | 15+ |

Track: GSC (country = India), GA4 (WhatsApp, form, call, audit events), Semrush Position Tracking (database India, city-level for Mumbai/Pune/Bangalore), GBP Insights, CRM lead source.

---

## 14. Risks specific to India

| Risk | Mitigation |
|------|-----------|
| Race to the bottom on price | Sell fixed-scope packages and outcomes; qualify budget in the form |
| Thin city-page spam | Only cities with unique content (§4) |
| Fake reviews/directories scams | Only verified reviews; ignore link-selling and "guaranteed rank #1" offers |
| Inaccurate legal/compliance content (DPDP, GST, RBI) | CA/lawyer review + "last reviewed" dates |
| Slow Indian mobile networks | CWV on throttled mobile; lean pages |
| Competing with huge directories | Target long-tail and vertical terms; use directories as channels, not competitors |
| Scope creep from low-ticket leads | Productised packages; paid discovery |

---

## 15. This week

1. Change locale to `en-IN` and rework Organization `areaServed` to India (§9).
2. Rewrite home H1/meta for India; add ₹ price teaser, phone, WhatsApp, Mumbai address.
3. Semrush India: export keywords for each service (§3) into the tracker; choose 1 primary per page.
4. Create/complete Google Business Profile, Clutch, GoodFirms, LinkedIn.
5. Draft `/pricing` with 3–4 INR packages.
6. Write guide #1: *App development cost in India* (brief available in `docs/briefs/`; adapt AED → INR).
7. Ask 3 clients for Google/Clutch reviews and permission to name them.
8. Set up GA4 events for WhatsApp, form, call.

---

## Appendix — Admin mapping (verified against the codebase)

| URL | Where to create it | Notes |
|-----|--------------------|-------|
| `/services/<slug>`, `/solutions/<slug>`, `/industries/<slug>`, `/technologies/<slug>`, `/locations/<slug>` | Admin → CMS → Pages (type Service / Solution / Industry / Technology / Location) | Hub pages exist for each. Nav dropdowns list only published pages |
| `/resources/guides/<slug>`, `/compare/<slug>`, `/resources/glossary/<slug>` | CMS Pages (type Guide / Comparison / Glossary) | Use the default paths. There is no hub at `/resources/guides` yet: create a Landing page at that path if you want one |
| `/pricing` | CMS Pages, type Landing, **Custom path** = `/pricing` | Not reserved, so the catch-all serves it. Admin → Pricing is only for torqOS plans |
| `/case-studies/*`, `/blog/*` | Admin → Case studies, Admin → Blog | Separate admin sections |
| `/freebies/*` | Code (`src/data/freebies.ts`) | Calculators need development work |
| Existing static services (`web-development`, `ai-solutions`, `remote-it`, `technical-consulting`) | Edit in CMS under the same slug | A new page with a different slug creates a duplicate. If you ever rename, add a 301 in Admin → Redirects |
| Reserved paths (cannot be CMS pages) | `/about`, `/blog`, `/case-studies`, `/contact`, `/freebies`, `/torqos`, `/business-systems`, `/privacy`, `/terms`, `/tech-news`, `/services` hub is allowed | See `src/lib/cms/paths.ts` |
