import { prisma, readSingletonSetting, writeSingletonSetting, SINGLETON_KEY } from "@/lib/db";

export type FooterColumn = {
  eyebrow: string;
  links: { label: string; href: string }[];
};

export type FooterContent = {
  blurb: string;
  tagline: string;
  columns: FooterColumn[];
};

/** Fallback used when the DB is empty/unavailable — `Footer.tsx` renders whatever
 *  `readFooterContent()` returns, it has no separate hardcoded copy of its own. */
function getDefaultFooterContent(): FooterContent {
  return {
    blurb:
      "Senior software engineers for mobile applications, web platforms, public APIs, and grounded AI workflows. Clear scope, direct communication, production-quality delivery — every engagement.",
    tagline: "BASED IN MUMBAI · OVERLAP WITH INDIA / EU / MENA",
    columns: [
      {
        eyebrow: "PLATFORM",
        links: [
          { href: "/services/mobile-app-development", label: "Mobile applications" },
          { href: "/services/web-development", label: "Web & APIs" },
          { href: "/services/ai-solutions", label: "AI workflows" },
          { href: "/services/remote-it", label: "Remote engineering" },
          { href: "/services/technical-consulting", label: "Advisory" },
        ],
      },
      {
        eyebrow: "EVIDENCE",
        links: [
          { href: "/case-studies", label: "Case studies" },
          { href: "/blog", label: "Blog & guides" },
          { href: "/freebies", label: "Free templates" },
          { href: "/tech-news", label: "Tech news" },
          { href: "/#testimonials", label: "Client voices" },
        ],
      },
      {
        eyebrow: "COMPANY",
        links: [
          { href: "/about", label: "About Torq Studio" },
          { href: "/#why-us", label: "Why us" },
          { href: "/contact", label: "Contact sales" },
          { href: "/privacy", label: "Privacy" },
          { href: "/terms", label: "Terms" },
        ],
      },
      {
        eyebrow: "GET STARTED",
        links: [
          { href: "/contact", label: "Book a consultation" },
          { href: "mailto:connect@torqstudio.com", label: "connect@torqstudio.com" },
          { href: "/services", label: "Service catalogue" },
        ],
      },
    ],
  };
}

function isFooterColumnArray(v: unknown): v is FooterColumn[] {
  return (
    Array.isArray(v) &&
    v.every(
      (c) =>
        c &&
        typeof c === "object" &&
        typeof (c as FooterColumn).eyebrow === "string" &&
        Array.isArray((c as FooterColumn).links),
    )
  );
}

export async function readFooterContent(): Promise<FooterContent> {
  return readSingletonSetting(
    () => prisma.footer.findUnique({ where: { key: SINGLETON_KEY } }),
    getDefaultFooterContent,
    (row, d) => ({
      blurb: row.blurb || d.blurb,
      tagline: row.tagline || d.tagline,
      columns: isFooterColumnArray(row.columns) ? row.columns : d.columns,
    }),
  );
}

export async function writeFooterContent(data: FooterContent): Promise<void> {
  await writeSingletonSetting((args) => prisma.footer.upsert(args), {
    blurb: data.blurb,
    tagline: data.tagline,
    columns: data.columns,
  });
}
