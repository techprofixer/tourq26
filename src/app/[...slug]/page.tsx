import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPageView, cmsPageMetadata, findPublishedPage } from "@/components/cms/CmsEntityPage";

// Renders any published CMS page whose path isn't owned by a more specific route — landing pages,
// guides (/resources/guides/*), comparisons (/compare/*), company pages, etc. Static and dynamic
// routes elsewhere in src/app always win; this only sees otherwise-unmatched URLs.
// pagePathError() in src/lib/cms/pages.ts stops editors from choosing paths this can't serve.

export const revalidate = 3600;

/** Only slug-shaped segments can be CMS paths; skip the DB for scanner noise like /wp-login.php. */
const SEGMENT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function toPath(slug: string[]): string | null {
  if (slug.length === 0 || slug.length > 6) return null;
  if (!slug.every((s) => SEGMENT_RE.test(s))) return null;
  return `/${slug.join("/")}`;
}

export async function generateMetadata(props: PageProps<"/[...slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const path = toPath(slug);
  if (!path) return { title: "Not found", robots: { index: false, follow: false } };
  return cmsPageMetadata(path);
}

export default async function CmsCatchAllPage(props: PageProps<"/[...slug]">) {
  const { slug } = await props.params;
  const path = toPath(slug);
  const page = path ? await findPublishedPage(path) : null;
  if (!page) notFound();
  return <CmsPageView page={page} />;
}
