/**
 * Seeds one CMS page per location (/locations/<slug>) and links it to its Location entity, so the
 * city shows up in the /locations catalogue grid. The entity rows come from SEED_LOCATIONS in
 * src/lib/cms/entities.ts — add a city there first, then add a spec below.
 *
 *   npx tsx prisma/seed-location-pages.ts          # create missing pages (published)
 *   npx tsx prisma/seed-location-pages.ts --draft  # create as drafts to review first
 *   npx tsx prisma/seed-location-pages.ts --force  # overwrite existing location pages
 *
 * Existing pages are skipped (admin edits are never overwritten) unless --force.
 *
 * Copy rules: no invented offices, client names or statistics. Mumbai is the only stated base;
 * every other city is described as served (remote-first, in-person by arrangement). Each city has
 * its own sector and project copy so the pages are not near-duplicates of each other.
 */
import { prisma } from "../src/lib/prisma";
import type { CmsBlock } from "../src/lib/cms/blocks";
import { SEED_LOCATIONS } from "../src/lib/cms/entities";
import { createPage, getPageByPathAnyStatus, updatePage } from "../src/lib/cms/pages";

type CitySpec = {
  slug: string;
  name: string;
  /** "HQ" = Torq Studio's base; "NATIONAL" = the country page; "SERVED" = remote-first city. */
  presence: "HQ" | "NATIONAL" | "SERVED";
  region: string;
  /** Searcher-facing phrase used in the H1 and focus keyword, e.g. "Mumbai". */
  place: string;
  /** One sentence on the local business landscape — specific to the city, no statistics. */
  landscape: string;
  sectors: string[];
  projects: { title: string; description: string }[];
  /** Adds a city-specific angle to the meta description. */
  metaHook: string;
  extraKeywords: string[];
  faqs: { question: string; answer: string }[];
};

const cities: CitySpec[] = [
  {
    slug: "software-development-company-india",
    name: "India",
    presence: "NATIONAL",
    region: "India",
    place: "India",
    landscape:
      "India has one of the world's largest developer communities, a fast-growing digital economy, and businesses of every size moving operations, sales and service online.",
    sectors: ["Startups and SaaS", "Fintech and payments", "Retail and e-commerce", "Manufacturing and logistics"],
    projects: [
      { title: "Web platforms and portals", description: "Customer portals, dashboards and marketplaces built for Indian users and payment methods." },
      { title: "Mobile apps", description: "iOS and Android apps tuned for the device mix and network conditions you actually see in India." },
      { title: "Business systems", description: "CRM, ERP, inventory and HRMS software that replaces spreadsheets and manual re-entry." },
      { title: "AI assistants and automation", description: "Chatbots, document processing and workflow automation grounded in your own data." },
    ],
    metaHook: "across India",
    extraKeywords: ["custom software development india", "offshore software development india", "it outsourcing india"],
    faqs: [
      { question: "Why work with a software development company in India?", answer: "India combines deep engineering talent, overlapping hours with Indian businesses, and cost-efficient delivery. The real advantage is access to senior engineers who understand local payments, GST and compliance as well as global standards." },
      { question: "Can Torq Studio work with businesses across India?", answer: "Yes. Delivery is remote-first and documented, so we work with clients in any Indian city, with in-person workshops for discovery and key milestones when they add value." },
      { question: "Do you work with international clients too?", answer: "Yes. We act as a dedicated squad or project team for companies abroad, agree on overlap hours up front, and keep communication written and traceable." },
      { question: "How do you handle Indian payments and compliance?", answer: "We integrate UPI and local payment gateways and build GST-aware invoicing and reporting, mapping specific compliance obligations with your stakeholders during discovery." },
    ],
  },
  {
    slug: "software-development-company-mumbai",
    name: "Mumbai",
    presence: "HQ",
    region: "Maharashtra",
    place: "Mumbai",
    landscape:
      "Mumbai is India's financial capital and home to banks, insurers, media companies, trading firms and a dense startup scene.",
    sectors: ["Banking, fintech and insurance", "Media and entertainment", "Trading and logistics", "Startups and D2C brands"],
    projects: [
      { title: "Fintech and payments software", description: "Onboarding, ledgers, reconciliation and reporting with strong access controls and audit trails." },
      { title: "Customer and sales platforms", description: "CRM and customer-facing apps for high-volume sales and service teams." },
      { title: "Operations and logistics tools", description: "Tracking, dispatch and inventory systems for port, trade and distribution businesses." },
      { title: "Product builds for startups", description: "MVPs and scale-up platforms with a team that can meet you in person." },
    ],
    metaHook: "from our Mumbai base",
    extraKeywords: ["software company mumbai", "mobile app development mumbai", "web development company mumbai"],
    faqs: [
      { question: "Is Torq Studio based in Mumbai?", answer: "Yes. Mumbai is our home base, so Mumbai clients can meet the engineers building their product for discovery workshops, kickoff and milestone reviews." },
      { question: "What kinds of Mumbai businesses do you work with?", answer: "Startups, growth-stage companies and established firms across fintech, insurance, trading, media, retail and logistics, among others." },
      { question: "Can we meet in person?", answer: "Yes. For Mumbai clients we can hold workshops in person, with day-to-day work coordinated through your preferred tools." },
      { question: "Do you build custom CRM and business systems in Mumbai?", answer: "Yes. CRM, ERP, inventory and internal tools are among the most common builds. We often start with a short discovery to decide whether to configure a platform or build custom." },
      { question: "How long does a typical project take?", answer: "A focused MVP often takes a few months; larger or regulated systems take longer. We provide a written estimate range after discovery, not before." },
    ],
  },
  {
    slug: "software-development-company-ahmedabad",
    name: "Ahmedabad",
    presence: "SERVED",
    region: "Gujarat",
    place: "Ahmedabad",
    landscape:
      "Ahmedabad anchors Gujarat's industrial economy, with strong textile, pharmaceutical, chemical and engineering sectors alongside a growing startup community.",
    sectors: ["Textiles and manufacturing", "Pharma and chemicals", "Trading and distribution", "Startups and services"],
    projects: [
      { title: "Manufacturing and inventory software", description: "Production tracking, stock control and dispatch for plants and distributors." },
      { title: "Sales and distribution platforms", description: "Order management, dealer portals and field-sales apps." },
      { title: "ERP and reporting", description: "Replace disconnected spreadsheets and desktop tools with one reporting layer." },
      { title: "Websites and customer apps", description: "Fast, SEO-ready websites and mobile apps for growing local brands." },
    ],
    metaHook: "for Ahmedabad and Gujarat",
    extraKeywords: ["software company gujarat", "mobile app development ahmedabad", "web development company ahmedabad"],
    faqs: [
      { question: "Do you work with Ahmedabad and Gujarat businesses?", answer: "Yes. We serve companies across Ahmedabad and Gujarat, working remotely day to day with in-person workshops for discovery and major milestones." },
      { question: "Can you modernise software our factory or distribution business already uses?", answer: "Often yes. We start with an assessment of the existing system, data quality and integrations, then propose a phased replacement that avoids a risky big-bang cut-over." },
      { question: "Do you build ERP and inventory systems?", answer: "Yes. These are common builds for manufacturing and trading businesses, usually phased from the highest-value workflow outward." },
      { question: "Is a remote engagement realistic for a local business?", answer: "Yes. We share working hours, demo in staging every sprint and document decisions in writing, so remote delivery stays transparent." },
    ],
  },
  {
    slug: "software-development-company-pune",
    name: "Pune",
    presence: "SERVED",
    region: "Maharashtra",
    place: "Pune",
    landscape:
      "Pune combines a large IT and services sector with strong automotive and manufacturing roots and a steady flow of engineering graduates.",
    sectors: ["IT services and product companies", "Automotive and manufacturing", "Education and training", "Startups"],
    projects: [
      { title: "Industrial and automotive software", description: "Dashboards, quality tracking and supplier portals for manufacturing teams." },
      { title: "SaaS and product engineering", description: "Multi-tenant platforms with billing, roles and analytics." },
      { title: "Learning and training platforms", description: "LMS and assessment software for institutes and corporate trainers." },
      { title: "Engineering capacity", description: "Dedicated squads that extend an existing Pune product team." },
    ],
    metaHook: "for Pune businesses",
    extraKeywords: ["software company pune", "mobile app development pune", "web development company pune"],
    faqs: [
      { question: "Do you work with Pune companies?", answer: "Yes. We work with Pune startups, product companies and manufacturers remotely, with in-person workshops when a project calls for them." },
      { question: "Can you extend our in-house Pune team?", answer: "Yes. We can run as a dedicated squad that follows your branching, review and release practices, or cover specific skill gaps." },
      { question: "Do you build software for manufacturing and automotive businesses?", answer: "Yes. Typical work includes production and quality dashboards, supplier and dealer portals, and integrations with existing plant systems." },
      { question: "Can you build an LMS or training platform?", answer: "Yes. We build learning platforms with courses, assessments, progress tracking and reporting." },
    ],
  },
  {
    slug: "software-development-company-bengaluru",
    name: "Bengaluru",
    presence: "SERVED",
    region: "Karnataka",
    place: "Bengaluru",
    landscape:
      "Bengaluru is India's best-known technology hub, with a dense ecosystem of startups, SaaS companies, global capability centres and investors.",
    sectors: ["SaaS and B2B software", "Consumer internet and D2C", "Fintech and health-tech", "Deep-tech and AI"],
    projects: [
      { title: "MVPs and early products", description: "A focused first release built to validate demand and support the next funding conversation." },
      { title: "SaaS platforms", description: "Multi-tenant architecture, subscription billing, admin tooling and observability." },
      { title: "AI features and agents", description: "Retrieval, evaluation and guardrails for AI features that must be reliable in production." },
      { title: "Extra engineering capacity", description: "Senior engineers who slot into a fast-moving Bengaluru product team." },
    ],
    metaHook: "for Bengaluru startups and SaaS teams",
    extraKeywords: ["software company bengaluru", "software development company bangalore", "saas development bangalore"],
    faqs: [
      { question: "Do you work with Bengaluru startups?", answer: "Yes. We work with Bengaluru startups and product teams remotely, from first MVP through scaling the platform." },
      { question: "Can you build an MVP quickly?", answer: "We scope the first release around the single most valuable workflow, ship it to real users, and iterate. Timelines depend on scope and are agreed after discovery." },
      { question: "Do you build AI features and agents?", answer: "Yes. We build assistants, agents and automation with evaluation sets, logging and human review, and keep the model layer swappable." },
      { question: "Can you supplement our existing engineering team?", answer: "Yes. A dedicated squad or individual senior engineers can join your tooling, stand-ups and review process." },
      { question: "Who owns the code and infrastructure?", answer: "You do. Everything is built in repositories and cloud accounts you control, with documentation handed over." },
    ],
  },
  {
    slug: "software-development-company-hyderabad",
    name: "Hyderabad",
    presence: "SERVED",
    region: "Telangana",
    place: "Hyderabad",
    landscape:
      "Hyderabad is a major centre for IT services, pharmaceuticals and life sciences, with many global enterprise teams and a growing startup base.",
    sectors: ["IT services and enterprise teams", "Pharma and life sciences", "Healthcare", "Startups and product companies"],
    projects: [
      { title: "Healthcare and life-sciences software", description: "Portals, scheduling and data workflows built with privacy and auditability in mind." },
      { title: "Enterprise integrations", description: "Connect internal systems, ERPs and third-party APIs reliably." },
      { title: "Internal tools", description: "Admin panels and workflow apps that keep teams out of spreadsheets and databases." },
      { title: "Cloud and DevOps", description: "CI/CD, infrastructure as code and monitoring for teams moving to the cloud." },
    ],
    metaHook: "for Hyderabad teams",
    extraKeywords: ["software company hyderabad", "mobile app development hyderabad", "web development company hyderabad"],
    faqs: [
      { question: "Do you work with Hyderabad companies?", answer: "Yes. We serve Hyderabad enterprises, healthcare and life-science organisations and startups, working remotely with in-person sessions when useful." },
      { question: "Can you work in regulated healthcare or pharma settings?", answer: "Yes. We plan data handling, access control and audit trails from discovery and align early with your security and compliance stakeholders." },
      { question: "Can you integrate with our existing enterprise systems?", answer: "Usually, via APIs, webhooks or scheduled imports. We document each integration and its failure modes." },
      { question: "Do you help with cloud migration?", answer: "Yes. We assess the current setup, then plan migration, automation and monitoring in phases." },
    ],
  },
  {
    slug: "software-development-company-delhi-ncr",
    name: "Delhi NCR",
    presence: "SERVED",
    region: "Delhi, Gurugram and Noida",
    place: "Delhi NCR",
    landscape:
      "Delhi NCR spans Delhi, Gurugram and Noida, with a large base of enterprises, consulting firms, fintech and consumer companies, and one of India's busiest startup scenes.",
    sectors: ["Enterprise and consulting", "Fintech and e-commerce", "Real estate and construction", "Startups"],
    projects: [
      { title: "Enterprise portals and workflows", description: "Approvals, document flows and dashboards for large teams." },
      { title: "Fintech and commerce platforms", description: "Payment flows, onboarding and marketplace features that scale." },
      { title: "Real-estate and construction software", description: "Listings, CRM, project tracking and site-reporting tools." },
      { title: "CRM and sales operations", description: "Sales systems built around how your teams actually sell." },
    ],
    metaHook: "in Delhi, Gurugram and Noida",
    extraKeywords: ["software company gurgaon", "software company noida", "mobile app development delhi"],
    faqs: [
      { question: "Do you serve Gurugram and Noida as well as Delhi?", answer: "Yes. We work with businesses across Delhi NCR, including Gurugram and Noida, remotely with in-person workshops by arrangement." },
      { question: "What do Delhi NCR businesses usually ask you to build?", answer: "Common requests include CRM and sales tooling, fintech and e-commerce platforms, enterprise workflow software and real-estate systems." },
      { question: "Can you work alongside our in-house team?", answer: "Yes. We can embed as a dedicated squad or take ownership of a defined module or product." },
      { question: "How do we start?", answer: "Send a short problem statement. We reply with questions and, if it is a fit, propose a discovery call or architecture review." },
    ],
  },
  {
    slug: "software-development-company-surat",
    name: "Surat",
    presence: "SERVED",
    region: "Gujarat",
    place: "Surat",
    landscape:
      "Surat is known for its textile and diamond industries, with a large community of traders, manufacturers and exporters running on tight margins and fast cycles.",
    sectors: ["Textiles and apparel", "Diamonds and jewellery", "Trading and exports", "Local retail and services"],
    projects: [
      { title: "Inventory and order management", description: "Stock, orders and dispatch tracking for traders and manufacturers." },
      { title: "B2B ordering portals", description: "Catalogues, pricing and reordering for dealers and buyers." },
      { title: "Accounting and reporting integrations", description: "Connect existing accounting tools to dashboards and GST-aware reports." },
      { title: "Mobile apps for field teams", description: "Order capture and collections on the go." },
    ],
    metaHook: "for Surat businesses",
    extraKeywords: ["software company surat", "mobile app development surat", "web development company surat"],
    faqs: [
      { question: "Do you work with Surat businesses?", answer: "Yes. We serve Surat traders, manufacturers and service companies, working remotely with in-person workshops when a project needs them." },
      { question: "Can you build software for textile or diamond businesses?", answer: "Yes. Typical work covers inventory, order management, B2B portals and reporting, designed around how your operation already runs." },
      { question: "Can you connect to our existing accounting software?", answer: "Usually. We assess available APIs and exports and build reliable sync and reporting on top." },
      { question: "Can you build a mobile app for our sales team?", answer: "Yes. Field-sales apps for order capture and collections are a common request, built to work well on typical devices and networks." },
    ],
  },
];

const SERVICE_LINKS =
  '<a href="/services/web-development">web development</a>, <a href="/services/mobile-app-development">mobile app development</a>, <a href="/services/ai-solutions">AI solutions</a>, <a href="/services/crm-development">CRM development</a>, <a href="/services/remote-it">dedicated teams</a> and <a href="/services/technical-consulting">technical consulting</a>';

function pageTitle(c: CitySpec): string {
  return `Software Development Company in ${c.place}`;
}

function metaDescription(c: CitySpec): string {
  return `Custom web, mobile and AI software ${c.metaHook}. Senior engineers, clear scope, code you own. Book a free call.`;
}

function presenceParagraph(c: CitySpec): string {
  if (c.presence === "HQ") {
    return `<p>Mumbai is Torq Studio&rsquo;s home base, so ${c.place} clients can meet the engineers building their product. We run discovery workshops in person, then deliver in short sprints with a staging demo every cycle.</p>`;
  }
  if (c.presence === "NATIONAL") {
    return `<p>Torq Studio is headquartered in <a href="/locations/software-development-company-mumbai">Mumbai</a> and works with businesses across ${c.place}. Delivery is remote-first and documented, with in-person workshops for discovery and major milestones.</p>`;
  }
  return `<p>Torq Studio is headquartered in <a href="/locations/software-development-company-mumbai">Mumbai</a> and works with ${c.place} businesses remotely, in the same time zone and on your schedule. We arrange in-person workshops for discovery and key milestones when they add value.</p>`;
}

function siblingLinks(c: CitySpec): string {
  return cities
    .filter((o) => o.slug !== c.slug && o.presence !== "NATIONAL")
    .map((o) => `<a href="/locations/${o.slug}">${o.name}</a>`)
    .join(", ");
}

function buildBlocks(c: CitySpec): CmsBlock[] {
  const key = c.slug;
  const isNational = c.presence === "NATIONAL";
  const heading = isNational
    ? "Software development company in India for businesses that need to ship"
    : `Software development company in ${c.place}, built for how you work`;

  const blocks: CmsBlock[] = [
    {
      type: "hero",
      id: `hero_${key}`,
      eyebrow: `LOCATION · ${c.name.toUpperCase()}`,
      heading,
      subheading: `${c.landscape} Torq Studio is a senior-led team building custom web, mobile, AI and business software for ${isNational ? "Indian and international teams" : `${c.place} businesses`}.`,
      primaryCtaLabel: "Book a consultation",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "See case studies",
      secondaryCtaHref: "/case-studies",
    },
    {
      type: "summary",
      id: `summary_${key}`,
      heading: "Key takeaways",
      items: [
        c.presence === "HQ"
          ? "Torq Studio is a software development company headquartered in Mumbai, India."
          : `Torq Studio is a software development company serving ${c.place} businesses${c.presence === "NATIONAL" ? "" : ", headquartered in Mumbai"}.`,
        `We build custom web applications, mobile apps, AI assistants, CRM and business systems for ${c.sectors.slice(0, 3).join(", ").toLowerCase()} and more.`,
        "Work is led by senior engineers, estimated in writing after a short discovery, and delivered in sprints with a staging demo each cycle.",
        "You own the code, repositories and cloud accounts from day one.",
      ],
    },
    {
      type: "contentSection",
      id: `section_${key}_0`,
      eyebrow: "ABOUT THE MARKET",
      heading: isNational ? "Software development across India" : `Software development in ${c.place}`,
      bodyHtml: `<p>${c.landscape}</p><p>The sectors we see most often here: ${c.sectors.map((s) => s.toLowerCase()).join(", ")}. Each has its own integrations, compliance questions and user expectations, which is why we begin with a short discovery rather than a generic proposal.</p>${presenceParagraph(c)}`,
    },
    {
      type: "featureGrid",
      id: `features_${key}`,
      heading: `What ${isNational ? "Indian" : c.place} businesses build with us`,
      items: c.projects,
    },
    {
      type: "contentSection",
      id: `section_${key}_1`,
      eyebrow: "HOW WE WORK",
      heading: `A delivery process ${isNational ? "you" : `${c.place} teams`} can inspect`,
      bodyHtml: `<ul><li><strong>Discovery:</strong> a short block that turns your idea into a written scope, risks and an estimate range.</li><li><strong>Incremental delivery:</strong> working software in staging every sprint, demoed to you rather than described to you.</li><li><strong>Quality built in:</strong> automated tests, code review and CI on every change.</li><li><strong>Local fit:</strong> UPI and local payment gateways, GST-aware invoicing and interfaces designed for real devices and networks.</li><li><strong>Clean handover:</strong> documentation and repository access that let your team, or another vendor, take over.</li></ul>`,
    },
    {
      type: "contentSection",
      id: `section_${key}_2`,
      eyebrow: "SERVICES",
      heading: `Services available${isNational ? " across India" : ` in ${c.place}`}`,
      bodyHtml: `<p>Every <a href="/services">Torq Studio service</a> is available: ${SERVICE_LINKS}. Not sure which fits? Describe the problem on the <a href="/contact">contact page</a> and we will recommend the smallest first step.</p><p>We also work with businesses in ${siblingLinks(c)}. See all <a href="/locations">locations</a>.</p>`,
    },
    {
      type: "faq",
      id: `faq_${key}`,
      heading: `Questions about working with a software company ${isNational ? "in India" : `in ${c.place}`}.`,
      items: c.faqs,
    },
    {
      type: "cta",
      id: `cta_${key}`,
      eyebrow: "START THE CONVERSATION",
      heading: isNational
        ? "Tell us what you want to build and we will scope the first step."
        : `Building something in ${c.place}? Let's scope it.`,
      primaryCtaLabel: "Book a free consultation",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "See case studies →",
      secondaryCtaHref: "/case-studies",
      dark: true,
    },
  ];
  return blocks;
}

async function seedCity(c: CitySpec, opts: { force: boolean; status: "PUBLISHED" | "DRAFT" }) {
  const path = `/locations/${c.slug}`;
  const seedEntity = SEED_LOCATIONS.find((l) => l.slug === c.slug);
  if (!seedEntity) {
    throw new Error(`Add "${c.slug}" to SEED_LOCATIONS in src/lib/cms/entities.ts first.`);
  }

  // Entity row: create if missing, never clobber admin edits to name/summary.
  const entity = await prisma.location.upsert({
    where: { slug: c.slug },
    create: {
      slug: c.slug,
      name: seedEntity.name,
      summary: seedEntity.summary ?? null,
      category: c.region,
      sortOrder: SEED_LOCATIONS.indexOf(seedEntity),
    },
    update: {},
  });

  const existing = await getPageByPathAnyStatus(path);
  if (existing && !opts.force) {
    if (!entity.pageId) {
      await prisma.location.update({ where: { id: entity.id }, data: { pageId: existing.id } });
    }
    console.log(`  skipped ${path} (already exists — pass --force to overwrite)`);
    return;
  }

  const title = pageTitle(c);
  const blocks = buildBlocks(c);
  const focusKeyword = `software development company ${c.place.toLowerCase()}`;
  const seo = {
    metaTitle: title,
    metaDescription: metaDescription(c),
    focusKeyword,
    // For LOCATION pages this is also emitted as the Service schema's areaServed.
    breadcrumbLabel: c.name,
  };
  const brief = {
    targetKeyword: focusKeyword,
    secondaryKeywords: c.extraKeywords,
    searchIntent: "COMMERCIAL" as const,
    targetAudience: `Businesses in ${c.place} looking for a custom software, mobile or AI development partner`,
    buyerStage: "CONSIDERATION" as const,
  };

  let pageId: string;
  if (existing) {
    await updatePage(existing.id, {
      title,
      blocks,
      excerpt: seo.metaDescription,
      status: opts.status,
      seo,
      brief,
    });
    pageId = existing.id;
    console.log(`  updated ${path}`);
  } else {
    const page = await createPage({
      title,
      slug: c.slug,
      type: "LOCATION",
      status: opts.status,
      path,
      excerpt: seo.metaDescription,
      blocks,
      primaryEntityKind: "LOCATION",
      primaryEntityId: entity.id,
      seo,
      brief,
    });
    pageId = page.id;
    console.log(`  created ${path}`);
  }

  if (entity.pageId !== pageId) {
    await prisma.location.update({ where: { id: entity.id }, data: { pageId } });
  }
}

async function main() {
  const force = process.argv.includes("--force");
  const status = process.argv.includes("--draft") ? "DRAFT" : "PUBLISHED";
  console.log(`Seeding ${cities.length} location pages (${status.toLowerCase()}${force ? ", force" : ""})…`);
  for (const c of cities) await seedCity(c, { force, status });
  console.log("Done. Pages appear in the /locations grid once published.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
