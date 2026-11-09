import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { readAllPricingPlans } from "@/lib/pricing-content";
import { PricingEditor } from "./PricingEditor";
import { AdminPageHeader } from "../AdminPageHeader";

export default async function AdminPricingPage() {
  const ok = await isAdmin();
  if (!ok) redirect("/admin");

  const items = await readAllPricingPlans();

  return (
    <div>
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Pricing" },
        ]}
        title="Pricing"
        description="Edit the pricing plans shown on the torqOS page. Save all at once."
      />
      <PricingEditor initialItems={items} />
    </div>
  );
}
