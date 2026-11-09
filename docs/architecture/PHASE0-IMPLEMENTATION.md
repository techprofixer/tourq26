# Phase 0 CMS — Implementation notes

## What shipped

- CMS Prisma models merged into `prisma/schema.prisma` (MongoDB)
- Block system: `hero`, `contentSection`, `featureGrid`, `faq`, `cta`
- Admin: `/admin/cms/pages`, `/admin/cms/pages/new`, `/admin/cms/pages/[id]`, `/admin/cms/entities`
- APIs: `/api/admin/cms/pages`, `/api/admin/cms/pages/[id]`, `/api/admin/cms/entities`
- Public: CMS-first `/services/[slug]` (static fallback), plus `/solutions|industries|technologies/[slug]`

## Activate MongoDB

1. Add to `.env`:
   ```
   DATABASE_URL=mongodb+srv://USER:PASS@cluster.mongodb.net/torqstudio?retryWrites=true&w=majority
   ```
2. Push schema:
   ```
   npx prisma db push
   ```
3. Restart `npm run dev`

## Next phases

- Drag-drop builder polish, more blocks, internal linking engine
- Programmatic SEO templates
- Full workflow RBAC (currently admin cookie gate)
