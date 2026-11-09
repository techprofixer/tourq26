# Torq Studio — Website

Marketing site for **Torq Studio**, your trusted technology partner for the Middle East & Europe.

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Fonts:** DM Sans (body), Outfit (headings)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & production

```bash
npm run build
npm start
```

### Before going live

1. **Domain (canonical)** — In **Admin → Site & SEO**, set **Site URL** to your production origin (e.g. `https://torqstudio.com`). That value drives **canonical URLs**, **sitemap**, **robots.txt host**, and **metadataBase**. Optional: set `NEXT_PUBLIC_SITE_URL` to the same value for any client-only code.
2. **Social profiles** — In Site & SEO, add **X/Twitter handle** (without `@`) and **Social profile URLs** (LinkedIn, etc.) for Organization `sameAs` and Twitter meta tags.
3. **Social preview** — Default OG image: `src/app/opengraph-image.tsx`. Blog posts and freebies each have a **dynamic OG image** route.
4. **Contact** — Replace `connect@torqstudio.com` where needed; submissions save to MongoDB via `DATABASE_URL`.
5. **Legal** — Review `/privacy` and `/terms` for your jurisdiction.
6. **WhatsApp (floating button)** — Set **`NEXT_PUBLIC_WHATSAPP_NUMBER`** to your WhatsApp Business / mobile number in **international format, digits only, no `+`** (example India: `919876543210`). If you use a **10-digit local** number, the app prepends **`NEXT_PUBLIC_WHATSAPP_PREFIX`** (defaults to **`91`**). Use `1` for US/Canada, `44` for UK, etc. Links use **`https://api.whatsapp.com/send`** (more reliable than `wa.me` with bad numbers). **`NEXT_PUBLIC_*` is applied at build time** — after changing env on Vercel, **redeploy**.
7. **Admin access** — Set **`ADMIN_PASSWORD`** (long, random) and **`ADMIN_SESSION_SECRET`** (`openssl rand -base64 32`) in your host's **Production** environment, then redeploy. There is no default password: if `ADMIN_PASSWORD` is unset, admin login is disabled. Rotating either value signs out every admin session.
8. **Media storage** — Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. In production, uploads are refused without them (serverless disks don't persist).

### Trust & SEO

- Security headers in `next.config.ts` (HSTS, nosniff, frame-ancestors, COOP, baseline CSP). Admin routes get `noindex` + `no-store` from `src/proxy.ts`.
- **Organization** + **WebSite** JSON-LD (no fake site search).
- **Home:** WebPage + ItemList (services).
- **Blog posts:** BlogPosting + BreadcrumbList; optional **author** per post in admin.
- **Breadcrumbs** on about, contact, blog, freebies, privacy, terms.
- **`robots.txt`:** allows public pages; **disallows `/admin` and `/api/`**.
- **`/llms.txt`:** curated Markdown index for LLMs/agents ([llmstxt.org](https://llmstxt.org/) shape); built from **Site & SEO** URL + copy via `src/lib/llms-txt.ts` and `src/app/llms.txt/route.ts`. Listed in **`sitemap.xml`** for discovery.
- **`sitemap.xml`** built from Site URL + CMS pages + blog + tech news + case studies + freebies + **`/llms.txt`**.
- **404** uses `noindex`.

### Security model

- **Admin auth** — shared password → signed, expiring session cookie (`HttpOnly`, `Secure`, `SameSite=Strict`), see `src/lib/auth.ts`. Login is rate-limited per IP.
- **Admin APIs** — every `/api/admin/*` route is wrapped in `withAdmin`, and `src/proxy.ts` also rejects unauthenticated or cross-origin requests before they reach a route.
- **Public endpoints** (`/api/contact`, `/api/chat`, `/api/business-systems/audit`) — zod-validated, honeypot-protected where they take form input, and rate-limited. The limiter is in-memory per serverless instance; add a Vercel Firewall rule or a shared store (e.g. Upstash) for a hard global limit.
- **Uploads** — allow-listed MIME + extension; SVG only via Cloudinary.

### API routes

| Route | Purpose |
|--------|---------|
| `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session` | Admin session |
| `POST /api/contact` | Contact form submission |
| `POST /api/business-systems/audit` | Business-systems audit lead |
| `POST /api/chat`, `POST /api/chat/feedback` | RAG chat assistant (feature-flagged) |
| `/api/admin/content/*` | Site, home, footer, navigation, brand, pricing, testimonials, blog, tech news, case studies |
| `/api/admin/cms/*` | CMS pages, entities (services, solutions, industries, technologies, locations), link suggestions |
| `/api/admin/{media,knowledge-base,leads,redirects,feature-flags,ai}` | Admin tools |

## Structure

- `src/app/` — Marketing pages, blog, tech news, case studies, freebies, entity hubs (services, solutions, industries, technologies, locations), business-systems funnel, `admin/**`, `api/**`, robots, sitemap, `llms.txt`
- `src/proxy.ts` — DB-backed redirects, maintenance mode, feature flags, admin API guard
- `src/components/` — Marketing UI, `cms/*` (block renderer, CMS page view), `admin/*`
- `src/lib/` — Content access, CMS, auth, SEO, RAG (`rag/*`)
- `prisma/` — MongoDB schema and CMS seed scripts

## Quality checks

```bash
npm run typecheck && npm run lint && npm test && npm run build
```
