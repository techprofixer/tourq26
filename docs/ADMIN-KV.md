# Admin panel & Vercel KV / Redis

## Layout metadata from content  - 

Root layout **metadata** (title, description, Open Graph, Twitter, keywords) is now driven by **Site & SEO** in the admin panel. Whatever you save under **Admin → Site & SEO** is used for:

- Default page title and title template
- Meta description
- Keywords
- OG title/description and site name
- Twitter card title/description
- JSON-LD (Organization, WebSite) name and URL

So you can change default SEO and branding without editing code.

---

## Storage: files vs Redis/KV

- **Local / self-hosted:** Content is stored in `content/blog.json`, `content/testimonials.json`, `content/site.json`. Writes persist on disk.
- **Vercel (serverless):** The app runs in read-only filesystem. Writes from the admin panel **do not persist** unless you add a Redis store.

### Use Redis on Vercel

1. **Add Redis**  
   In Vercel: **Dashboard → Storage** (or Integrations). Create a **KV** or **Upstash Redis** database. Vercel will set:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   (or the Upstash equivalents, which are compatible.)

2. **Redeploy**  
   Redeploy so the app gets the new env vars. The content layer will then use KV/Redis instead of files.

3. **One-time seed (optional)**  
   If you already have content in `content/*.json` in the repo:
   - Log in to **Admin** → **Dashboard**.
   - In the **Storage** section, click **“Seed from files → KV (one-time)”**.  
   This copies blog, testimonials, and site JSON from the repo into Redis. After that, all edits go to Redis.

4. **No seed**  
   If you don’t seed, Redis starts empty. You can add blog posts, testimonials, and site/SEO entirely from the admin panel.

### Env vars

| Variable               | Required | Description                    |
|------------------------|----------|--------------------------------|
| `KV_REST_API_URL`      | For KV   | Redis REST API URL             |
| `KV_REST_API_TOKEN`    | For KV   | Redis REST API token          |
| `ADMIN_PASSWORD`       | Yes      | Admin login password           |
| `MAINTENANCE_MODE`     | Optional | `true` / `1` — instant public maintenance (overrides admin UI when set) |

### Feature flags (Admin → Feature flags)

- Toggle **maintenance**, **blog / contact**, **nav: Dev tools link** (`/dev-tools`), and **WhatsApp chip** without redeploying.
- Values persist in the same store as site content: **local** `content/feature-flags.json` or **Vercel KV** when `KV_REST_API_*` is set.
- Optional **env overrides** per flag (for example `FF_MARKETING_BLOG=false`) always win over the admin panel — use for break-glass deploys.
- With KV, marketing route gates also run in **middleware** at the edge; with files only, **server pages and APIs** still enforce flags.
| `NEXT_PUBLIC_SITE_URL` | Optional | Used in sitemap, canonicals    |

When both `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set, the app uses Redis for all content (blog, testimonials, site). Otherwise it uses the file-based store (works locally; on Vercel, file writes don’t persist).

---

## Summary

- **SEO:** Edit **Admin → Site & SEO**; root layout metadata comes from there.
- **Vercel:** Add Redis (KV/Upstash), set env vars, optionally run “Seed from files → KV” once, then manage everything from the admin panel.
