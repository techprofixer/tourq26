import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listMediaAssets } from "@/lib/media";
import { MediaLibraryClient } from "./MediaLibraryClient";
import { AdminPageHeader } from "../AdminPageHeader";

export default async function AdminMediaPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const assets = await listMediaAssets();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Media" },
        ]}
        title="Media"
        description="Upload and reuse images. Copy a URL from here into any cover image or logo field."
      />
      <MediaLibraryClient initialAssets={assets} />
    </div>
  );
}
