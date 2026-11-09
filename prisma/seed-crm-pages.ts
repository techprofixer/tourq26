import { prisma } from "../src/lib/prisma";
import type { CmsBlock } from "../src/lib/cms/blocks";
import { createPage, getPageByPathAnyStatus, updatePage } from "../src/lib/cms/pages";

type CrmPageSpec = {
  kind: "SERVICE" | "SOLUTION";
  slug: string;
  name: string;
  path: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  targetAudience: string;
  breadcrumbLabel: string;
  breadcrumbParent: { name: string; path: string };
  blocks: CmsBlock[];
};

const crmService: CrmPageSpec = {
  kind: "SERVICE",
  slug: "crm-development",
  name: "CRM Development",
  path: "/services/crm-development",
  title: "CRM Development",
  metaTitle: "CRM Development Services",
  metaDescription:
    "Custom CRM development and integration for sales, support, and ops teams — data modeling, Salesforce/HubSpot integration, clean migrations, and adoption that sticks.",
  focusKeyword: "crm development",
  secondaryKeywords: [
    "custom crm development",
    "crm integration services",
    "salesforce integration",
    "hubspot integration",
    "crm migration",
  ],
  targetAudience:
    "VP Sales, RevOps, or a CTO whose team has outgrown its CRM or a spreadsheet-based sales process",
  breadcrumbLabel: "CRM Development",
  breadcrumbParent: { name: "Services", path: "/services" },
  blocks: [
    {
      type: "hero",
      id: "hero_crm-development",
      eyebrow: "SERVICE · CRM DEVELOPMENT",
      heading: "CRM development that fits how your team actually sells",
      subheading:
        "Off-the-shelf CRMs work until your pipeline, territories, or compliance rules get specific. We build and integrate CRM systems — custom, or layered on Salesforce, HubSpot, or Zoho — so sales, support, and ops finally share one source of truth.",
      primaryCtaLabel: "Book a consultation",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "See case studies",
      secondaryCtaHref: "/case-studies",
    },
    {
      type: "contentSection",
      id: "section_crm-development_0",
      eyebrow: "01 · SECTION",
      heading: "Build custom, extend a platform, or both",
      bodyHtml:
        "<p><strong>Configuring Salesforce, HubSpot, or Zoho</strong> is the right call when your process maps reasonably well to contacts, accounts, and deals, and you value ecosystem apps over control. <strong>Custom-built CRM</strong> makes sense when your entities aren't really \"contacts and deals\" — they're shipments, policies, properties, or patients — and the platform's data model fights you at every turn. Most of our engagements land on a <strong>hybrid</strong>: a platform core for what it does well, with custom objects, a bespoke UI, or an API layer for what it doesn't.</p><p>We help you make that call with a short technical assessment, not a sales pitch for whichever stack we happen to prefer.</p>",
    },
    {
      type: "contentSection",
      id: "section_crm-development_1",
      eyebrow: "02 · SECTION",
      heading: "The data model decisions that outlast the UI",
      bodyHtml:
        "<p>Object structure, ownership and territory rules, activity logging, and audit trails are the decisions that are expensive to unwind later — get them wrong and every report and automation built on top inherits the mess. We model accounts, contacts, deals, and any domain-specific objects your business actually runs on, with clear rules for who owns a record and what counts as an activity worth logging.</p>",
    },
    {
      type: "contentSection",
      id: "section_crm-development_2",
      eyebrow: "03 · SECTION",
      heading: "Migration without the \"nobody trusts the new CRM\" problem",
      bodyHtml:
        "<p>Bad migrations are why reps quietly keep a spreadsheet on the side. We deduplicate contacts and accounts before cutover, map legacy fields explicitly instead of guessing, run the old and new systems in parallel for a defined window, and keep a rollback plan until adoption metrics say otherwise.</p>",
    },
    {
      type: "contentSection",
      id: "section_crm-development_3",
      eyebrow: "04 · SECTION",
      heading: "Integrations that make the CRM the system of record",
      bodyHtml:
        "<p>A CRM that doesn't talk to billing, marketing automation, your support desk, or product usage data just becomes one more silo. We integrate via API and webhooks so status changes, invoices, and support tickets sync in near real time — and we document what happens when a downstream integration is down, so support teams aren't guessing.</p>",
    },
    {
      type: "featureGrid",
      id: "features_crm-development",
      heading: "What a CRM engagement typically includes",
      items: [
        { title: "Discovery & data audit", description: "Current-state data quality, duplicate accounts, and the workflows the CRM must support." },
        { title: "Custom objects & workflow design", description: "Entities, pipelines, and automation rules modeled on how your team actually sells or operates." },
        { title: "Integration layer", description: "Billing, marketing automation, support desk, and product data connected via API or webhooks." },
        { title: "Migration & QA", description: "Deduplication, field mapping, parallel-run validation, and a defined rollback window." },
        { title: "Roles, permissions & reporting", description: "Territory and ownership rules, plus dashboards leadership will actually check." },
        { title: "Training & handover", description: "Documentation and onboarding so adoption doesn't depend on tribal knowledge." },
      ],
    },
    {
      type: "faq",
      id: "faq_crm-development",
      heading: "Questions buyers ask before kickoff.",
      items: [
        {
          question: "Should we build a custom CRM or configure Salesforce/HubSpot?",
          answer:
            "It depends on how well your entities map to \"contacts, accounts, deals.\" If they mostly do, configuring a platform is faster and cheaper. If your business runs on domain-specific objects the platform doesn't model well, custom development (or a hybrid with a platform core) usually pays off within a year.",
        },
        {
          question: "How long does a CRM build or migration take?",
          answer:
            "A focused configuration or integration project often runs a few weeks to a couple of months. Custom CRM builds or complex migrations with heavy data cleanup typically take longer — we scope a realistic timeline after a short discovery, not before.",
        },
        {
          question: "Can you migrate us off Salesforce, HubSpot, or Zoho without losing data?",
          answer:
            "Yes. We export and reconcile the source data, map every field explicitly, and run a parallel period so your team can verify records before we decommission the old system.",
        },
        {
          question: "Do you integrate with our billing, ERP, or support tools?",
          answer:
            "Usually yes, via API or webhooks. We document integration failure modes up front so support and ops teams know what to do if a sync is delayed or fails.",
        },
        {
          question: "Who owns the CRM after launch?",
          answer:
            "You do — data, code, and any custom modules we build, subject to your contract terms. We hand over documentation and can stay on for a maintenance retainer, but it's not required.",
        },
      ],
    },
    {
      type: "cta",
      id: "cta_crm-development",
      eyebrow: "START THE CONVERSATION",
      heading: "Ready to scope a CRM development engagement?",
      primaryCtaLabel: "Book a free consultation",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "See case studies →",
      secondaryCtaHref: "/case-studies",
      dark: true,
    },
  ],
};

const crmSolution: CrmPageSpec = {
  kind: "SOLUTION",
  slug: "build-crm",
  name: "Build CRM",
  path: "/solutions/build-crm",
  title: "Build a Custom CRM",
  metaTitle: "Build a Custom CRM System",
  metaDescription:
    "Custom CRM software built from scratch for founders and ops teams outgrowing spreadsheets or off-the-shelf tools — your data model, your workflow, your product.",
  focusKeyword: "build a crm",
  secondaryKeywords: [
    "build custom crm software",
    "build crm from scratch",
    "vertical crm software",
    "proprietary crm system",
    "custom crm platform development",
  ],
  targetAudience:
    "Founder or product lead building a vertical SaaS CRM, or an internal ops leader whose workflow doesn't fit off-the-shelf CRM platforms",
  breadcrumbLabel: "Build CRM",
  breadcrumbParent: { name: "Solutions", path: "/solutions" },
  blocks: [
    {
      type: "hero",
      id: "hero_build-crm",
      eyebrow: "SOLUTION · BUILD CRM",
      heading: "Build a CRM without inheriting someone else's assumptions",
      subheading:
        "When Salesforce, HubSpot, or Zoho almost fit — but your pipeline, compliance rules, or vertical workflow don't map cleanly — we build a CRM from scratch: your data model, your rules, your product.",
      primaryCtaLabel: "Book a consultation",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "See case studies",
      secondaryCtaHref: "/case-studies",
    },
    {
      type: "contentSection",
      id: "section_build-crm_0",
      eyebrow: "01 · SECTION",
      heading: "When \"just configure Salesforce\" stops being true",
      bodyHtml:
        "<p>Off-the-shelf CRMs assume your world looks like contacts, accounts, and deals. That breaks down when you're managing multi-sided pipelines, entities the platform doesn't model natively — properties, shipments, policies, patients — or heavy custom compliance and audit requirements. It also breaks down when the CRM isn't an internal tool at all: it's the product you intend to sell to your own customers, and you need to own the roadmap outright.</p>",
    },
    {
      type: "contentSection",
      id: "section_build-crm_1",
      eyebrow: "02 · SECTION",
      heading: "What we actually build",
      bodyHtml:
        "<ul><li><strong>Data model:</strong> accounts, contacts, and the custom objects specific to your vertical.</li><li><strong>Roles &amp; permissioning:</strong> who can see and edit what, down to record and field level.</li><li><strong>Workflow &amp; automation engine:</strong> stage transitions, assignment rules, and notifications that match how your team actually works.</li><li><strong>Activity timeline &amp; reporting:</strong> a full history per record and dashboards leadership will actually use.</li></ul>",
    },
    {
      type: "contentSection",
      id: "section_build-crm_2",
      eyebrow: "03 · SECTION",
      heading: "Architecture choices that keep it maintainable",
      bodyHtml:
        "<p>We design API-first so the CRM integrates with billing, support, and marketing tools instead of becoming a new silo. If this is a product you'll sell to multiple customers, we build in multi-tenancy and data isolation from day one — retrofitting it later is expensive. Background jobs handle imports and scheduled automation; audit logging is part of the schema, not bolted on after a compliance request.</p>",
    },
    {
      type: "contentSection",
      id: "section_build-crm_3",
      eyebrow: "04 · SECTION",
      heading: "Shipping incrementally instead of a big-bang rewrite",
      bodyHtml:
        "<p>We ship the core objects and primary pipeline first, then layer on automation, reporting, and integrations in later phases. If you're replacing an existing tool, we run both systems in parallel during rollout so nobody loses a deal or a customer record while the team gets comfortable.</p>",
    },
    {
      type: "featureGrid",
      id: "features_build-crm",
      heading: "What's in scope for a custom CRM build",
      items: [
        { title: "Custom data model & objects", description: "Modeled on your vertical, not a generic contacts-and-deals template." },
        { title: "Roles & permissioning", description: "Record- and field-level access control that matches your org structure." },
        { title: "Workflow automation engine", description: "Stage transitions, assignment rules, and notifications you can configure without a developer." },
        { title: "API & integrations layer", description: "Billing, support, and marketing tools connected from day one." },
        { title: "Reporting & dashboards", description: "The numbers leadership actually checks, not a generic report builder." },
        { title: "Multi-tenancy", description: "Built in from the start if the CRM is itself a product you plan to sell." },
      ],
    },
    {
      type: "faq",
      id: "faq_build-crm",
      heading: "Questions founders and ops leads ask before kickoff.",
      items: [
        {
          question: "Why build a custom CRM instead of configuring Salesforce or HubSpot?",
          answer:
            "Because your entities, compliance requirements, or pricing model don't map cleanly to a generic contacts-and-deals structure — or because the CRM is meant to be your own product, not an internal tool licensed from someone else.",
        },
        {
          question: "Can this become a product we sell to our own customers?",
          answer:
            "Yes, if that's the goal we design for multi-tenancy, data isolation, and billing hooks from the start rather than retrofitting them after the first pilot customer signs.",
        },
        {
          question: "How long does it take to build a CRM from scratch?",
          answer:
            "A focused MVP covering the core pipeline and objects is usually scoped in months, not weeks. We give a phased roadmap after discovery so you can fund the build incrementally instead of committing to the full scope up front.",
        },
        {
          question: "Do you integrate with our existing tools during rollout?",
          answer:
            "Yes — we typically connect billing, support, and marketing tools early and run the new CRM alongside your current system until adoption and data integrity checks pass.",
        },
      ],
    },
    {
      type: "cta",
      id: "cta_build-crm",
      eyebrow: "START THE CONVERSATION",
      heading: "Ready to scope your CRM build?",
      primaryCtaLabel: "Book a free consultation",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "See case studies →",
      secondaryCtaHref: "/case-studies",
      dark: true,
    },
  ],
};

async function upsertEntityRow(spec: CrmPageSpec) {
  if (spec.kind === "SERVICE") {
    return prisma.service.upsert({
      where: { slug: spec.slug },
      create: { slug: spec.slug, name: spec.name, summary: spec.metaDescription },
      update: { name: spec.name, summary: spec.metaDescription },
    });
  }
  return prisma.solution.upsert({
    where: { slug: spec.slug },
    create: { slug: spec.slug, name: spec.name, summary: spec.metaDescription },
    update: { name: spec.name, summary: spec.metaDescription },
  });
}

async function seedCrmPage(spec: CrmPageSpec) {
  const entity = await upsertEntityRow(spec);
  const existing = await getPageByPathAnyStatus(spec.path);

  const seo = {
    metaTitle: spec.metaTitle,
    metaDescription: spec.metaDescription,
    schemaKeys: ["Service", "FAQPage"],
    focusKeyword: spec.focusKeyword,
    breadcrumbLabel: spec.breadcrumbLabel,
  };

  const brief = {
    targetKeyword: spec.focusKeyword,
    secondaryKeywords: spec.secondaryKeywords,
    searchIntent: "COMMERCIAL" as const,
    targetAudience: spec.targetAudience,
    buyerStage: "CONSIDERATION" as const,
  };

  if (existing) {
    await updatePage(existing.id, {
      title: spec.title,
      blocks: spec.blocks,
      excerpt: spec.metaDescription,
      status: "PUBLISHED",
      seo,
      brief,
    });
    if (!entity.pageId) {
      if (spec.kind === "SERVICE") {
        await prisma.service.update({ where: { id: entity.id }, data: { pageId: existing.id } });
      } else {
        await prisma.solution.update({ where: { id: entity.id }, data: { pageId: existing.id } });
      }
    }
    console.log(`  updated ${spec.path}`);
    return;
  }

  const page = await createPage({
    title: spec.title,
    slug: spec.slug,
    type: spec.kind,
    status: "PUBLISHED",
    path: spec.path,
    excerpt: spec.metaDescription,
    blocks: spec.blocks,
    primaryEntityKind: spec.kind,
    primaryEntityId: entity.id,
    seo,
    brief,
  });

  if (spec.kind === "SERVICE") {
    await prisma.service.update({ where: { id: entity.id }, data: { pageId: page.id } });
  } else {
    await prisma.solution.update({ where: { id: entity.id }, data: { pageId: page.id } });
  }

  await prisma.pageEntity.create({
    data: {
      pageId: page.id,
      entityKind: spec.kind,
      entityId: entity.id,
      isPrimary: true,
    },
  });

  console.log(`  created ${spec.path}`);
}

async function main() {
  console.log("Seeding full SEO pages for CRM Development (service) and Build CRM (solution)…");
  await seedCrmPage(crmService);
  await seedCrmPage(crmSolution);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
