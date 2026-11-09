import { isAdmin } from "@/lib/auth";
import {
  readBlogPosts,
  readContactSubmissions,
  readChatFeedback,
} from "@/lib/content";
import { getResolvedFeatureFlags } from "@/lib/feature-flags";
import { readCaseStudies } from "@/lib/case-studies-content";
import { readTechNewsPosts } from "@/lib/tech-news-content";
import { countNewAuditLeads } from "@/lib/audit-leads-content";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import "quill/dist/quill.snow.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await isAdmin();

  if (!ok) {
    return (
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    );
  }

  const [posts, submissions, flags, caseStudies, techNewsPosts, chatFeedback, newLeadCount] = await Promise.all([
    readBlogPosts(),
    readContactSubmissions(),
    getResolvedFeatureFlags(),
    readCaseStudies(),
    readTechNewsPosts(),
    readChatFeedback(),
    countNewAuditLeads(),
  ]);
  const draftCount = posts.filter(
    (p) => (p.status ?? "published") === "draft",
  ).length;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <AdminTopBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AdminSidebar
          blogCount={posts.length}
          draftCount={draftCount}
          contactCount={submissions.length}
          caseStudyCount={caseStudies.length}
          techNewsCount={techNewsPosts.length}
          chatFeedbackCount={chatFeedback.length}
          newLeadCount={newLeadCount}
          maintenanceOn={flags.maintenance_mode === true}
        />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-background">
          <div className="mx-auto w-full max-w-[1100px] px-5 py-8 lg:px-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
