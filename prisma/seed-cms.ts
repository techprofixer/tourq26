import { servicePages } from "../src/data/services-content";
import { prisma } from "../src/lib/prisma";
import type { CmsBlock } from "../src/lib/cms/blocks";
import { seedCmsEntities } from "../src/lib/cms/entities";
import { createPage, getPageByPathAnyStatus, updatePage } from "../src/lib/cms/pages";

function blocksFromLegacyService(page: (typeof servicePages)[number]): CmsBlock[] {
  const blocks: CmsBlock[] = [
    {
      type: "hero",
      id: `hero_${page.slug}`,
      eyebrow: `SERVICE · ${page.slug.replace(/-/g, " ").toUpperCase()}`,
      heading: page.h1,
      subheading: page.intro,
      primaryCtaLabel: "Book a consultation",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "See case studies",
      secondaryCtaHref: "/case-studies",
    },
  ];

  page.sections.forEach((section, i) => {
    blocks.push({
      type: "contentSection",
      id: `section_${page.slug}_${i}`,
      eyebrow: `${String(i + 1).padStart(2, "0")} · SECTION`,
      heading: section.heading,
      bodyHtml: section.body,
    });
  });

  blocks.push({
    type: "faq",
    id: `faq_${page.slug}`,
    heading: "Questions buyers ask before kickoff.",
    items: page.faqs,
  });

  blocks.push({
    type: "cta",
    id: `cta_${page.slug}`,
    eyebrow: "START THE CONVERSATION",
    heading: `Ready to scope a ${page.title.toLowerCase()} engagement?`,
    primaryCtaLabel: "Book a free consultation",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "See case studies →",
    secondaryCtaHref: "/case-studies",
    dark: true,
  });

  return blocks;
}

async function main() {
  console.log("Seeding CMS entities…");
  const counts = await seedCmsEntities();
  console.log(counts);

  console.log("Migrating legacy service pages into CMS…");
  for (const legacy of servicePages) {
    const path = `/services/${legacy.slug}`;
    const existing = await getPageByPathAnyStatus(path);
    const blocks = blocksFromLegacyService(legacy);
    const service = await prisma.service.findUnique({ where: { slug: legacy.slug } });

    if (existing) {
      await updatePage(existing.id, {
        title: legacy.title,
        blocks,
        excerpt: legacy.description,
        seo: {
          metaTitle: legacy.title,
          metaDescription: legacy.description,
          schemaKeys: ["Service", "FAQPage"],
          focusKeyword: legacy.title.toLowerCase(),
        },
        status: "PUBLISHED",
      });
      if (service && !service.pageId) {
        await prisma.service.update({
          where: { id: service.id },
          data: { pageId: existing.id },
        });
      }
      console.log(`  updated ${path}`);
    } else {
      const page = await createPage({
        title: legacy.title,
        slug: legacy.slug,
        type: "SERVICE",
        status: "PUBLISHED",
        path,
        excerpt: legacy.description,
        blocks,
        primaryEntityKind: "SERVICE",
        primaryEntityId: service?.id ?? null,
        seo: {
          metaTitle: legacy.title,
          metaDescription: legacy.description,
          schemaKeys: ["Service", "FAQPage"],
          focusKeyword: legacy.title.toLowerCase(),
          breadcrumbLabel: legacy.title,
        },
        brief: {
          targetKeyword: legacy.title.toLowerCase(),
          searchIntent: "COMMERCIAL",
          buyerStage: "CONSIDERATION",
        },
      });
      if (service) {
        await prisma.service.update({
          where: { id: service.id },
          data: { pageId: page.id },
        });
        await prisma.pageEntity.create({
          data: {
            pageId: page.id,
            entityKind: "SERVICE",
            entityId: service.id,
            isPrimary: true,
          },
        });
      }
      console.log(`  created ${path}`);
    }
  }

  console.log("CMS seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
