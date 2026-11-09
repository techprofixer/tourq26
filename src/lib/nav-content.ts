import { prisma, withDbTimeout } from "@/lib/db";

export type NavLink = {
  label: string;
  href: string;
  openInNewTab: boolean;
};

const NAV_KEY = "primary";

/** Fallback used when the DB is empty/unavailable — `Header.tsx` renders whatever `readPrimaryNav()`
 *  returns, it has no separate hardcoded copy of its own. */
function getDefaultNavLinks(): NavLink[] {
  return [
    { label: "torqOS", href: "/torqos", openInNewTab: false },
    { label: "About", href: "/about", openInNewTab: false },
    { label: "Services", href: "/services", openInNewTab: false },
    { label: "Solutions", href: "/solutions", openInNewTab: false },
    { label: "Industries", href: "/industries", openInNewTab: false },
    { label: "Why Us", href: "/#why-us", openInNewTab: false },
    { label: "Blog", href: "/blog", openInNewTab: false },
    { label: "Freebies", href: "/freebies", openInNewTab: false },
    { label: "Testimonials", href: "/#testimonials", openInNewTab: false },
  ];
}

export type NavMegaMenuItem = { label: string; href: string };
/** Hover dropdown contents for top-level nav links, keyed by that link's `href`. */
export type NavMegaMenus = Record<string, NavMegaMenuItem[]>;

/**
 * Live catalogue lists for the Services/Solutions/Industries nav dropdowns — pulled directly from
 * the Service/Solution/Industry tables so new entries (e.g. a newly published service) show up in
 * the nav without a content edit.
 */
export async function readNavMegaMenus(): Promise<NavMegaMenus> {
  try {
    const [services, solutions, industries] = await withDbTimeout(
      Promise.all([
        prisma.service.findMany({
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
        prisma.solution.findMany({
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
        prisma.industry.findMany({
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
      ]),
    );
    return {
      "/services": services.map((s) => ({ label: s.name, href: `/services/${s.slug}` })),
      "/solutions": solutions.map((s) => ({ label: s.name, href: `/solutions/${s.slug}` })),
      "/industries": industries.map((s) => ({ label: s.name, href: `/industries/${s.slug}` })),
    };
  } catch {
    return {};
  }
}

export async function readPrimaryNav(): Promise<NavLink[]> {
  let nav;
  try {
    nav = await withDbTimeout(
      prisma.navigation.findUnique({
        where: { key: NAV_KEY },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      }),
    );
  } catch {
    return getDefaultNavLinks();
  }
  if (!nav || nav.items.length === 0) return getDefaultNavLinks();
  return nav.items.map((i) => ({
    label: i.label,
    href: i.href ?? "",
    openInNewTab: i.openInNewTab,
  }));
}

export async function writePrimaryNav(links: NavLink[]): Promise<void> {
  const nav = await prisma.navigation.upsert({
    where: { key: NAV_KEY },
    create: { key: NAV_KEY, label: "Primary navigation" },
    update: {},
  });
  await prisma.$transaction([
    prisma.menuItem.deleteMany({ where: { navigationId: nav.id } }),
    ...links.map((link, i) =>
      prisma.menuItem.create({
        data: {
          navigationId: nav.id,
          label: link.label,
          href: link.href,
          openInNewTab: link.openInNewTab,
          sortOrder: i,
        },
      }),
    ),
  ]);
}
