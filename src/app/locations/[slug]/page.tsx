import type { Metadata } from "next";
import { CmsEntityPage, cmsPageMetadata } from "@/components/cms/CmsEntityPage";

// Safety net: on-demand revalidation covers CMS/site-setting edits, but this bounds
// staleness to an hour even if a revalidatePath call is ever missed.
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return cmsPageMetadata(`/locations/${slug}`);
}

export default async function LocationPage({ params }: Props) {
  const { slug } = await params;
  return <CmsEntityPage path={`/locations/${slug}`} />;
}
