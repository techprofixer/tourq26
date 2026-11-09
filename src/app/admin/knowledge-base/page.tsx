import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listCustomKnowledgeDocs } from "@/lib/rag/custom-knowledge";
import { KnowledgeBaseClient } from "./KnowledgeBaseClient";
import { AdminPageHeader } from "../AdminPageHeader";

export default async function AdminKnowledgeBasePage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const docs = await listCustomKnowledgeDocs();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Chat knowledge" },
        ]}
        title="Chat assistant knowledge"
        description="Custom text added here is chunked, embedded locally via Ollama, and made searchable by the floating chat assistant — separate from the site content it already indexes automatically (services, blog, FAQs, case studies) via `npm run rag:build`."
      />
      <KnowledgeBaseClient initialDocs={docs.map((d) => ({ ...d, updatedAt: d.updatedAt.toISOString() }))} />
    </div>
  );
}
