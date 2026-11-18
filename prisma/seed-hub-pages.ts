/**
 * Seeds editorial SEO content for the five category hubs:
 * /services, /solutions, /industries, /technologies, /locations.
 *
 * Each hub renders a published CMS page at its own path (see makeHubPage / services/page.tsx),
 * so this creates one Page per hub. Existing pages are left alone — edits made in Admin → CMS →
 * Pages are never overwritten — unless you pass --force.
 *
 *   npx tsx prisma/seed-hub-pages.ts          # create missing hub pages (published)
 *   npx tsx prisma/seed-hub-pages.ts --draft  # create them as drafts to review first
 *   npx tsx prisma/seed-hub-pages.ts --force  # overwrite existing hub pages
 *
 * Copy deliberately avoids invented statistics, prices and client names. Add real numbers and
 * proof points from Admin before publishing if you have them.
 */
import { prisma } from "../src/lib/prisma";
import type { CmsBlock } from "../src/lib/cms/blocks";
import { createPage, getPageByPathAnyStatus, updatePage } from "../src/lib/cms/pages";

type HubSpec = {
  path: "/services" | "/solutions" | "/industries" | "/technologies" | "/locations";
  kind: "SERVICE" | "SOLUTION" | "INDUSTRY" | "TECHNOLOGY" | "LOCATION";
  title: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  targetAudience: string;
  searchIntent: "COMMERCIAL" | "INFORMATIONAL";
  eyebrow: string;
  h1: string;
  subheading: string;
  takeaways: string[];
  sections: { eyebrow: string; heading: string; bodyHtml: string }[];
  gridEyebrow: string;
  gridHeading: string;
  /** Inserted after the first `sections.length - 1` sections so the live catalogue sits mid-page. */
  gridAfterSection: number;
  faqHeading: string;
  faqs: { question: string; answer: string }[];
  ctaHeading: string;
};

const hubs: HubSpec[] = [
  // ───────────────────────────── /services ─────────────────────────────
  {
    path: "/services",
    kind: "SERVICE",
    title: "Software Development Services",
    metaTitle: "Software Development Services",
    metaDescription:
      "Custom software development services from senior engineers: web, mobile, AI, CRM and remote teams. Clear scope, honest estimates, and code you own.",
    focusKeyword: "software development services",
    secondaryKeywords: [
      "custom software development services",
      "mobile app development company",
      "web application development services",
      "ai development services",
      "dedicated development team",
    ],
    targetAudience:
      "Founders, CTOs and product leaders comparing software development partners for a new build, a rescue, or extra engineering capacity",
    searchIntent: "COMMERCIAL",
    eyebrow: "SERVICES",
    h1: "Software development services built around outcomes, not hours",
    subheading:
      "Torq Studio is a senior-led engineering team delivering custom web, mobile, AI and business-systems software. Pick a service below, or tell us the problem and we will recommend the smallest engagement that proves the answer.",
    takeaways: [
      "Torq Studio provides custom software development across web, mobile, AI, CRM/ERP and remote engineering teams.",
      "Work is led by senior engineers from discovery through release, so the people who scope the project are the people who build it.",
      "Engagements start with a short discovery or architecture review, then move to a fixed-scope MVP or a dedicated squad depending on how well the requirements are known.",
      "You own the code, the infrastructure accounts and the documentation from day one.",
    ],
    sections: [
      {
        eyebrow: "WHAT WE BUILD",
        heading: "One engineering team across the whole product surface",
        bodyHtml:
          "<p>Most products need more than one discipline. A marketplace needs a web app, a mobile client, an admin back office and a payments integration; an AI assistant needs retrieval, evaluation and a front end people actually trust. Splitting that across three vendors is where scope leaks and finger-pointing starts.</p><p>Our services cover the full stack of a modern product: <a href=\"/services/web-development\">web development and APIs</a>, <a href=\"/services/mobile-app-development\">mobile app development</a> for iOS and Android, <a href=\"/services/ai-solutions\">AI solutions</a> such as assistants, agents and automation, <a href=\"/services/crm-development\">CRM development</a> and integration, <a href=\"/services/remote-it\">remote IT and dedicated teams</a>, and <a href=\"/services/technical-consulting\">technical consulting</a> for architecture, audits and fractional CTO support.</p>",
      },
      {
        eyebrow: "HOW WE WORK",
        heading: "A delivery process you can inspect",
        bodyHtml:
          "<p>Good software projects fail quietly: unclear scope, late integration, nobody owning quality. We design the process to surface those problems in week two instead of month six.</p><ul><li><strong>Discovery:</strong> a short, paid-for-in-time block that turns an idea into a written scope, risks, and a realistic estimate range.</li><li><strong>Incremental delivery:</strong> working software in a staging environment every sprint, demoed to you rather than described to you.</li><li><strong>Quality built in:</strong> automated tests, code review and CI on every change, with environments kept separate from the start.</li><li><strong>Clean handover:</strong> documentation, runbooks and repository access that let your team, or another vendor, take over without us.</li></ul>",
      },
      {
        eyebrow: "ENGAGEMENT MODELS",
        heading: "Choose the engagement model that matches the uncertainty",
        bodyHtml:
          "<p><strong>Fixed-scope MVP.</strong> Best when requirements are bounded and you need a date. We agree on scope, milestones and acceptance criteria before writing code.</p><p><strong>Dedicated squad.</strong> Best when the roadmap keeps changing and you need steady velocity. You get a named team that works inside your tools and rituals, with a monthly cost that is easy to forecast.</p><p><strong>Advisory block.</strong> Best when the decision is the deliverable: an architecture review, a build-vs-buy analysis or a vendor rescue. You leave with a written recommendation, whether or not we build anything.</p><p>If you are not sure which fits, that is a normal place to start. Describe your constraints on the <a href=\"/contact\">contact page</a> and we will suggest a first step.</p>",
      },
      {
        eyebrow: "WHY TORQ STUDIO",
        heading: "Senior engineers, plain-language estimates, no lock-in",
        bodyHtml:
          "<p>We keep the team small and senior on purpose. That means fewer hand-offs, faster decisions and estimates that account for the unglamorous work: authentication edge cases, data migration, app-store review, monitoring.</p><p>We also write down the trade-offs. When a cheaper option exists, such as configuring an existing platform instead of building custom, we will say so, because a project that should not have been built is the most expensive kind. Read how that plays out in our <a href=\"/case-studies\">case studies</a>, or browse the <a href=\"/blog\">blog</a> for the technical thinking behind our decisions.</p>",
      },
    ],
    gridEyebrow: "SERVICE CATALOGUE",
    gridHeading: "Every service, with scope, process and FAQs.",
    gridAfterSection: 2,
    faqHeading: "Questions buyers ask before choosing a development partner.",
    faqs: [
      {
        question: "What software development services does Torq Studio offer?",
        answer:
          "We design and build custom web applications and APIs, mobile apps for iOS and Android, AI assistants, agents and automation, CRM and business-systems software, and provide remote engineering teams and technical consulting. The full list is in the catalogue on this page.",
      },
      {
        question: "How much does custom software development cost?",
        answer:
          "Cost depends on scope, integrations, compliance needs and team size, so we do not quote from a price list. After a short discovery we give a written estimate range with the assumptions behind it, and we flag the items most likely to move it.",
      },
      {
        question: "How long does a typical project take?",
        answer:
          "A focused MVP usually takes a few months, while larger or regulated systems take longer. We commit to a timeline after discovery, because a date given before the problem is understood is just a guess.",
      },
      {
        question: "Do we own the source code and infrastructure?",
        answer:
          "Yes. Code, repositories, cloud accounts, app-store accounts and documentation belong to you, subject to your contract. We build in accounts you control so there is no lock-in.",
      },
      {
        question: "Can you work with our in-house developers?",
        answer:
          "Yes. We regularly embed alongside internal teams, follow your branching and review conventions, and can run as a dedicated squad or fill specific skill gaps.",
      },
      {
        question: "How do we get started?",
        answer:
          "Send a short problem statement through the contact form. We reply with clarifying questions and, if it is a fit, propose a discovery call or architecture review as a low-risk first step.",
      },
    ],
    ctaHeading: "Tell us what you are building and we will scope the first step.",
  },

  // ───────────────────────────── /solutions ─────────────────────────────
  {
    path: "/solutions",
    kind: "SOLUTION",
    title: "Custom Software Solutions",
    metaTitle: "Custom Software Solutions",
    metaDescription:
      "Build custom CRM, ERP, SaaS, marketplace, POS and AI assistant software. Torq Studio turns a business problem into a working product with clear scope.",
    focusKeyword: "custom software solutions",
    secondaryKeywords: [
      "build custom crm",
      "custom erp software development",
      "saas product development",
      "marketplace development",
      "internal tools development",
    ],
    targetAudience:
      "Business owners, operations leaders and founders who know the product they need (a CRM, ERP, marketplace or AI tool) and want a partner to build it",
    searchIntent: "COMMERCIAL",
    eyebrow: "SOLUTIONS",
    h1: "Custom software solutions for the product you need to build",
    subheading:
      "Services describe how we work; solutions describe what you walk away with. Browse the products we build most often, from CRM and ERP to marketplaces, SaaS platforms and AI assistants.",
    takeaways: [
      "Solution pages are organised by the product you want to build, such as a CRM, ERP, marketplace, HRMS, POS or AI chatbot.",
      "Most business software is a mix of standard modules and a few workflows unique to your company; we build the unique parts and reuse proven patterns for the rest.",
      "We recommend configuring an existing platform when it fits, and custom development when your data model or workflow genuinely does not.",
      "Every solution starts with a written scope covering users, data, integrations and what is deliberately out of version one.",
    ],
    sections: [
      {
        eyebrow: "WHAT IS A SOLUTION",
        heading: "Start from the product, not the technology",
        bodyHtml:
          "<p>Buyers rarely search for &ldquo;React plus Postgres plus a queue.&rdquo; They search for the outcome: a CRM their sales team will use, an inventory system that matches the warehouse, a booking platform customers can trust with a payment.</p><p>Each solution page below describes a product category: who it is for, the modules it normally includes, the integrations that cause the most surprises, and a realistic way to phase the build. It is the fastest way to see whether what you have in mind is a six-week project or a six-month one.</p>",
      },
      {
        eyebrow: "BUILD VS BUY",
        heading: "When custom software beats an off-the-shelf tool",
        bodyHtml:
          "<p>Off-the-shelf software is the right answer more often than agencies admit. Custom development earns its cost in a few situations:</p><ul><li>Your core workflow is the competitive advantage and generic tools force you to bend it.</li><li>You are stitching together four or five subscriptions with spreadsheets and manual re-entry between them.</li><li>Per-seat licensing becomes more expensive than owning the system as headcount grows.</li><li>You are building the product itself, such as a vertical SaaS or a marketplace, so there is nothing to buy.</li></ul><p>For a worked example, see how we approach <a href=\"/solutions/build-crm\">building a custom CRM</a> versus configuring a platform.</p>",
      },
      {
        eyebrow: "HOW IT GETS BUILT",
        heading: "A phased path from first release to full platform",
        bodyHtml:
          "<p>We rarely recommend building everything at once. A typical path looks like this:</p><ol><li><strong>Core workflow first:</strong> the one process that, if it works, proves the product is worth finishing.</li><li><strong>Integrations next:</strong> payments, accounting, messaging, identity, and the legacy systems you cannot switch off.</li><li><strong>Reporting and administration:</strong> dashboards, roles, audit trails and the back-office tooling that keeps support teams out of the database.</li><li><strong>Scale and hardening:</strong> performance, monitoring, backups and security reviews as usage grows.</li></ol><p>Each phase ships to real users, so feedback shapes the next one instead of a specification written months earlier.</p>",
      },
      {
        eyebrow: "WHERE AI FITS",
        heading: "AI assistants, chatbots and agents as part of the product",
        bodyHtml:
          "<p>AI features are strongest when they sit on top of well-structured business data: a support assistant that reads your knowledge base, an agent that drafts quotes from past orders, a chatbot that qualifies leads and hands off to a human. We build these with evaluation sets, logging and human review in the loop, rather than as a one-off demo. See our <a href=\"/services/ai-solutions\">AI solutions service</a> for how we approach reliability and cost control.</p>",
      },
    ],
    gridEyebrow: "SOLUTION CATALOGUE",
    gridHeading: "Pick the product you want to build.",
    gridAfterSection: 1,
    faqHeading: "Questions about building custom business software.",
    faqs: [
      {
        question: "What is the difference between a service and a solution?",
        answer:
          "A service is a capability, like web development or consulting. A solution is a finished type of product, like a CRM, marketplace or POS system. Solutions are built using one or more of our services.",
      },
      {
        question: "Should we build custom software or buy a SaaS product?",
        answer:
          "If an existing product covers most of your workflow, buy it and integrate the gaps. Build custom when your workflow is your advantage, when subscriptions and manual work are piling up, or when the software itself is what you sell.",
      },
      {
        question: "Can you build a minimum viable version first?",
        answer:
          "Yes, and we usually recommend it. We scope a first release around the single most valuable workflow, ship it to real users, and expand from there.",
      },
      {
        question: "Can the new system integrate with the tools we already use?",
        answer:
          "Usually, through APIs, webhooks or scheduled imports. We document each integration and what happens if it fails, so operations teams are not surprised in production.",
      },
      {
        question: "What if our requirements are not fully defined?",
        answer:
          "That is common. A short discovery phase turns rough requirements into user flows, a data model and an estimate range, so you can decide with real information.",
      },
    ],
    ctaHeading: "Describe the product you want built and get a scoped first step.",
  },

  // ───────────────────────────── /industries ─────────────────────────────
  {
    path: "/industries",
    kind: "INDUSTRY",
    title: "Industry Software Development",
    metaTitle: "Industry Software Development",
    metaDescription:
      "Software development for healthcare, fintech, logistics, retail and manufacturing. Domain-aware engineering for compliance and legacy systems.",
    focusKeyword: "industry software development",
    secondaryKeywords: [
      "healthcare software development",
      "fintech software development",
      "logistics software development",
      "retail software development",
      "manufacturing software development",
    ],
    targetAudience:
      "Leaders in regulated or operations-heavy industries looking for a development partner that understands their domain constraints",
    searchIntent: "COMMERCIAL",
    eyebrow: "INDUSTRIES",
    h1: "Software development for industries with real-world constraints",
    subheading:
      "Compliance rules, legacy systems and floor-level workflows decide whether software gets adopted. We build for healthcare, fintech, logistics, retail, manufacturing and other sectors where the details matter.",
    takeaways: [
      "Torq Studio builds software for healthcare, fintech, retail, manufacturing, logistics, construction, education, insurance, real estate, travel, hospitality and automotive businesses.",
      "Industry context shapes the architecture: audit trails, data residency, offline use and integration with existing systems are decided at the start, not retrofitted.",
      "We involve your compliance, security and operations stakeholders early so approvals do not become last-minute blockers.",
      "Shared engineering patterns carry across industries, so you get proven foundations plus domain-specific logic.",
    ],
    sections: [
      {
        eyebrow: "WHY DOMAIN MATTERS",
        heading: "The same feature behaves differently in every industry",
        bodyHtml:
          "<p>A &ldquo;user login&rdquo; in a retail app and in a patient portal are not the same feature. One needs fast checkout and social sign-in; the other needs role-based access, consent records and a defensible audit trail. Treating industries as interchangeable is how projects stall in security review.</p><p>Our industry pages explain the recurring requirements in each sector, the integrations that tend to dominate the timeline, and the questions to settle before development begins.</p>",
      },
      {
        eyebrow: "COMMON REQUIREMENTS",
        heading: "What we plan for before the first sprint",
        bodyHtml:
          "<ul><li><strong>Compliance and privacy:</strong> data handling, retention and consent mapped to your regulators and customers, with documentation security teams can review.</li><li><strong>Legacy integration:</strong> ERPs, core banking, hospital systems, warehouse and telematics platforms that cannot be replaced, only connected.</li><li><strong>Real-world usage:</strong> poor connectivity, shared devices, barcode scanners and non-technical users shape the interface.</li><li><strong>Reliability:</strong> monitoring, backups and graceful failure for workflows where downtime costs money.</li></ul>",
      },
      {
        eyebrow: "EXAMPLES",
        heading: "Where the work usually lands",
        bodyHtml:
          "<p><strong>Healthcare and insurance</strong> teams ask for portals, scheduling, claims workflows and secure data exchange. <strong>Fintech</strong> teams need onboarding, payments, ledgers and reconciliation built with strong controls. <strong>Logistics, manufacturing and construction</strong> teams need tracking, inventory, dispatch and field apps that work on the floor or on site. <strong>Retail, hospitality and travel</strong> businesses invest in commerce, booking and loyalty platforms. <strong>Education and real estate</strong> teams build learning platforms, listings and CRM tooling.</p><p>Browse relevant delivery work in our <a href=\"/case-studies\">case studies</a>.</p>",
      },
      {
        eyebrow: "GETTING STARTED",
        heading: "Bring the constraints; we will bring the plan",
        bodyHtml:
          "<p>The fastest way to a good estimate is to share the constraints that worry you most: a regulator, a legacy system, a deadline, a data-sensitivity concern. We turn those into a short written plan covering architecture, risks and phasing. From there you can choose a fixed-scope first release or a <a href=\"/services/remote-it\">dedicated team</a>.</p>",
      },
    ],
    gridEyebrow: "INDUSTRY CATALOGUE",
    gridHeading: "Find your sector and see how we approach it.",
    gridAfterSection: 1,
    faqHeading: "Questions about industry-specific software development.",
    faqs: [
      {
        question: "Do you have experience in regulated industries?",
        answer:
          "Yes. We work with healthcare, fintech and insurance clients and plan for compliance, privacy and auditability from discovery. We align with your legal and security stakeholders early rather than at launch.",
      },
      {
        question: "Can you build for an industry we do not see listed?",
        answer:
          "Often yes. The engineering fundamentals carry across sectors, and discovery is where we learn your domain. Contact us with the specifics and we will say honestly whether we are a fit.",
      },
      {
        question: "How do you handle integration with legacy systems?",
        answer:
          "We assess each system first: APIs available, data quality and failure modes. Then we build adapters, document them, and plan a safe cut-over rather than a risky big-bang replacement.",
      },
      {
        question: "Will our data stay secure and compliant?",
        answer:
          "We apply least-privilege access, encryption in transit and at rest, and careful handling of third-party SDKs and logs. Specific compliance obligations are mapped with your stakeholders during discovery.",
      },
    ],
    ctaHeading: "Share your industry constraints and get a practical plan.",
  },

  // ───────────────────────────── /technologies ─────────────────────────────
  {
    path: "/technologies",
    kind: "TECHNOLOGY",
    title: "Technologies We Build With",
    metaTitle: "Technologies We Build With",
    metaDescription:
      "The technology stack Torq Studio uses in production: React, Next.js, Node.js, Python, Flutter, AWS, PostgreSQL and AI tools such as OpenAI and Claude.",
    focusKeyword: "software development technologies",
    secondaryKeywords: [
      "react development company",
      "node.js development services",
      "python development services",
      "flutter app development",
      "aws cloud development",
    ],
    targetAudience:
      "CTOs, technical leads and non-technical buyers who want to know which technologies a development partner uses and why",
    searchIntent: "INFORMATIONAL",
    eyebrow: "TECHNOLOGIES",
    h1: "The technologies we build with, and why we choose them",
    subheading:
      "Frontend, backend, mobile, cloud, data and AI. We pick tools for maintainability and hiring ease first, novelty last, so the system stays healthy long after launch.",
    takeaways: [
      "Torq Studio works across React, Next.js, Node.js, NestJS, Python, Java, .NET and Go for web and backend development.",
      "Mobile apps are built with Flutter and React Native, or natively where platform depth is required.",
      "Cloud and DevOps work centres on AWS and Azure with Docker and Kubernetes; data work uses PostgreSQL and MongoDB.",
      "AI systems use models such as OpenAI, Claude and Gemini with frameworks like LangChain, LangGraph and MCP.",
    ],
    sections: [
      {
        eyebrow: "OUR APPROACH",
        heading: "Choose boring technology for the foundation",
        bodyHtml:
          "<p>The right stack is rarely the newest. It is the one your next hire already knows, that has a healthy ecosystem, and that fits the problem. We recommend mainstream, well-supported technologies for the foundation and reserve experimentation for the parts of the product where it creates real advantage.</p><p>Every recommendation comes with the trade-off stated in plain language, so non-technical stakeholders can take part in the decision.</p>",
      },
      {
        eyebrow: "THE STACK",
        heading: "Frontend, backend, mobile, cloud and data",
        bodyHtml:
          "<ul><li><strong>Frontend:</strong> <a href=\"/technologies/react\">React</a> and <a href=\"/technologies/next-js\">Next.js</a> for fast, SEO-friendly web applications.</li><li><strong>Backend:</strong> <a href=\"/technologies/node-js\">Node.js</a>, NestJS, <a href=\"/technologies/python\">Python</a>, Java, .NET and Go, matched to team skills and performance needs.</li><li><strong>Mobile:</strong> <a href=\"/technologies/flutter\">Flutter</a> and React Native for shared codebases, native iOS and Android when required.</li><li><strong>Cloud and DevOps:</strong> <a href=\"/technologies/aws\">AWS</a>, Azure, Docker and Kubernetes with automated pipelines.</li><li><strong>Data:</strong> <a href=\"/technologies/postgresql\">PostgreSQL</a> and MongoDB, chosen by access patterns and consistency needs.</li></ul>",
      },
      {
        eyebrow: "AI TOOLING",
        heading: "Models and frameworks for production AI",
        bodyHtml:
          "<p>For AI features we work with OpenAI, Claude and Gemini models, orchestrated with LangChain, LangGraph and the Model Context Protocol (MCP) where tool use and agents are needed. We choose models by accuracy, latency and cost on your own evaluation data, and design the system so a model can be swapped without a rewrite. Learn more on our <a href=\"/services/ai-solutions\">AI solutions</a> page.</p>",
      },
      {
        eyebrow: "HOW TO CHOOSE",
        heading: "Questions to ask before committing to a stack",
        bodyHtml:
          "<ol><li>How easy is it to hire or contract engineers for this technology in two years?</li><li>Does it fit the performance, security and compliance needs of the product?</li><li>What does it cost to run at ten times today&rsquo;s traffic?</li><li>Can another vendor take over the codebase without a rewrite?</li></ol><p>If you are weighing options, our <a href=\"/services/technical-consulting\">technical consulting</a> team can review the decision and write a recommendation.</p>",
      },
    ],
    gridEyebrow: "TECHNOLOGY CATALOGUE",
    gridHeading: "Explore each technology and how we use it.",
    gridAfterSection: 2,
    faqHeading: "Questions about our technology choices.",
    faqs: [
      {
        question: "Which technology stack should we use for our project?",
        answer:
          "It depends on your product, team and constraints. We recommend a mainstream stack that is easy to hire for and maintain, and explain the trade-offs. A short architecture review is often enough to settle it.",
      },
      {
        question: "Do you build with React Native or Flutter?",
        answer:
          "Both. We choose between them, or native, based on your team, performance needs and how much platform-specific behaviour the app requires.",
      },
      {
        question: "Can you work with our existing technology?",
        answer:
          "Yes. We regularly extend existing codebases and cloud setups. We start with an assessment of architecture, test coverage and dependency health before proposing changes.",
      },
      {
        question: "Which AI models do you use?",
        answer:
          "We work with OpenAI, Claude and Gemini and choose per use case by testing on your data for quality, speed and cost, keeping the integration flexible.",
      },
      {
        question: "Will we be locked into your stack?",
        answer:
          "No. We use open, widely adopted technologies and build in accounts you own, so you can bring development in-house or change vendors.",
      },
    ],
    ctaHeading: "Not sure which stack fits? We will review it with you.",
  },

  // ───────────────────────────── /locations ─────────────────────────────
  {
    path: "/locations",
    kind: "LOCATION",
    title: "Software Development Company in India",
    metaTitle: "Software Development Company India",
    metaDescription:
      "Torq Studio is a software development company in India, based in Mumbai and serving Ahmedabad, Gujarat and clients nationwide. Talk to our engineers.",
    focusKeyword: "software development company in india",
    secondaryKeywords: [
      "software development company mumbai",
      "software development company ahmedabad",
      "software company gujarat",
      "custom software development india",
      "offshore development team india",
    ],
    targetAudience:
      "Businesses in India, and international teams considering India-based engineering, looking for a software partner in or near their city",
    searchIntent: "COMMERCIAL",
    eyebrow: "LOCATIONS",
    h1: "A software development company in India, built for local businesses and global teams",
    subheading:
      "Torq Studio is headquartered in Mumbai and works with clients across Maharashtra, Gujarat and the rest of India. Find your city below, or work with us remotely wherever you are.",
    takeaways: [
      "Torq Studio is a software development company headquartered in Mumbai, India.",
      "We serve businesses in Mumbai, Ahmedabad, Gujarat and across India, in person where useful and remotely by default.",
      "Teams work in overlapping hours with clients in India and can align schedules with international time zones.",
      "The same senior engineering team delivers web, mobile, AI and business software wherever the client is based.",
    ],
    sections: [
      {
        eyebrow: "WHERE WE WORK",
        heading: "Based in Mumbai, serving India and beyond",
        bodyHtml:
          "<p>Our home base is <a href=\"/locations/software-development-company-mumbai\">Mumbai</a>, one of India&rsquo;s largest business and financial centres. From here we work with startups, mid-sized companies and enterprises across the country, including clients in <a href=\"/locations/software-development-company-ahmedabad\">Ahmedabad and Gujarat</a>.</p><p>Most delivery is remote and well documented, with in-person workshops for discovery, kickoff and key milestones when they add value. For a country-wide view, see our page on <a href=\"/locations/software-development-company-india\">software development in India</a>.</p>",
      },
      {
        eyebrow: "WHY LOCAL MATTERS",
        heading: "Local context, shared time zone, direct access to engineers",
        bodyHtml:
          "<p>Working with a team in your own country removes a lot of friction: the same working hours, familiarity with local payment methods and regulations, and the ability to meet when a decision is complicated. For Indian businesses that often means integrating with UPI and local payment gateways, GST-aware invoicing, and regional-language or low-bandwidth user needs.</p><p>You speak directly with the engineers building your product, not through layers of account management.</p>",
      },
      {
        eyebrow: "GLOBAL TEAMS",
        heading: "India-based engineering for international clients",
        bodyHtml:
          "<p>International companies use us as an extension of their product team: a <a href=\"/services/remote-it\">dedicated squad</a> that follows your tooling, stand-ups and review practices. We agree on overlap hours up front and communicate in writing so progress never depends on a single meeting.</p><p>Documentation, demos and access to repositories are part of the working rhythm, which keeps distributed delivery predictable.</p>",
      },
      {
        eyebrow: "WHAT WE DELIVER",
        heading: "The same full-service engineering in every location",
        bodyHtml:
          "<p>Whichever city you are in, you get access to the full range of <a href=\"/services\">Torq Studio services</a>: web and mobile development, AI solutions, CRM and business systems, and technical consulting. Start with a conversation on the <a href=\"/contact\">contact page</a> and tell us where you are and what you need.</p>",
      },
    ],
    gridEyebrow: "LOCATION PAGES",
    gridHeading: "Find the page for your city.",
    gridAfterSection: 1,
    faqHeading: "Questions about working with a software company in India.",
    faqs: [
      {
        question: "Where is Torq Studio based?",
        answer:
          "Our headquarters are in Mumbai, India. We also serve clients in Ahmedabad, Gujarat and across the country, and work with international teams remotely.",
      },
      {
        question: "Do you work with clients outside Mumbai?",
        answer:
          "Yes. Most delivery is remote, so location rarely limits who we can work with. We travel for workshops and milestones when it adds value.",
      },
      {
        question: "Can you meet in person?",
        answer:
          "Yes, particularly for discovery workshops and kickoff. We can arrange meetings in Mumbai and discuss visits to other cities based on the project.",
      },
      {
        question: "Do you work with international clients?",
        answer:
          "Yes. We work with teams abroad as a dedicated squad or project team, agree on overlapping hours, and keep communication and documentation clear and written.",
      },
      {
        question: "Do you understand local requirements like UPI and GST?",
        answer:
          "Yes. We have experience integrating Indian payment methods and building invoicing and compliance features suited to Indian businesses.",
      },
    ],
    ctaHeading: "Tell us your city and what you want to build.",
  },
];

function buildBlocks(h: HubSpec): CmsBlock[] {
  const key = h.path.slice(1);
  const blocks: CmsBlock[] = [
    {
      type: "hero",
      id: `hero_hub_${key}`,
      eyebrow: h.eyebrow,
      heading: h.h1,
      subheading: h.subheading,
      primaryCtaLabel: "Book a consultation",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "See case studies",
      secondaryCtaHref: "/case-studies",
    },
    {
      type: "summary",
      id: `summary_hub_${key}`,
      heading: "Key takeaways",
      items: h.takeaways,
    },
  ];

  h.sections.forEach((s, i) => {
    blocks.push({
      type: "contentSection",
      id: `section_hub_${key}_${i}`,
      eyebrow: s.eyebrow,
      heading: s.heading,
      bodyHtml: s.bodyHtml,
    });
    if (i + 1 === h.gridAfterSection) {
      blocks.push({
        type: "entityGrid",
        id: `grid_hub_${key}`,
        kind: h.kind,
        eyebrow: h.gridEyebrow,
        heading: h.gridHeading,
      });
    }
  });

  blocks.push(
    { type: "faq", id: `faq_hub_${key}`, heading: h.faqHeading, items: h.faqs },
    {
      type: "cta",
      id: `cta_hub_${key}`,
      eyebrow: "START THE CONVERSATION",
      heading: h.ctaHeading,
      primaryCtaLabel: "Book a free consultation",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "See case studies →",
      secondaryCtaHref: "/case-studies",
      dark: true,
    },
  );
  return blocks;
}

async function seedHub(h: HubSpec, opts: { force: boolean; status: "PUBLISHED" | "DRAFT" }) {
  const existing = await getPageByPathAnyStatus(h.path);
  if (existing && !opts.force) {
    console.log(`  skipped ${h.path} (already exists — pass --force to overwrite)`);
    return;
  }

  const blocks = buildBlocks(h);
  const seo = {
    metaTitle: h.metaTitle,
    metaDescription: h.metaDescription,
    focusKeyword: h.focusKeyword,
    breadcrumbLabel: h.eyebrow.charAt(0) + h.eyebrow.slice(1).toLowerCase(),
  };
  const brief = {
    targetKeyword: h.focusKeyword,
    secondaryKeywords: h.secondaryKeywords,
    searchIntent: h.searchIntent,
    targetAudience: h.targetAudience,
    buyerStage: "CONSIDERATION" as const,
  };

  if (existing) {
    await updatePage(existing.id, {
      title: h.title,
      blocks,
      excerpt: h.metaDescription,
      status: opts.status,
      seo,
      brief,
    });
    console.log(`  updated ${h.path}`);
    return;
  }

  // CUSTOM, not the entity types: SERVICE/LOCATION/etc. add Service JSON-LD, which is wrong for a
  // hub that lists many things. Hubs get WebPage + BreadcrumbList + FAQPage schema.
  await createPage({
    title: h.title,
    slug: h.path.slice(1),
    type: "CUSTOM",
    status: opts.status,
    path: h.path,
    excerpt: h.metaDescription,
    blocks,
    seo,
    brief,
  });
  console.log(`  created ${h.path}`);
}

async function main() {
  const force = process.argv.includes("--force");
  const status = process.argv.includes("--draft") ? "DRAFT" : "PUBLISHED";
  console.log(`Seeding category hub pages (${status.toLowerCase()}${force ? ", force" : ""})…`);
  for (const h of hubs) await seedHub(h, { force, status });
  console.log("Done. Revalidate or wait for the hourly ISR window to see the pages live.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
