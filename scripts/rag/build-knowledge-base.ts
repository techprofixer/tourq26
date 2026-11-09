/**
 * Rebuilds the RAG knowledge base: pulls current site content, chunks and embeds it, and
 * replaces the KnowledgeChunk collection. Run after `npm run rag:index` (once) and whenever
 * CMS content changes meaningfully:
 *
 *   npm run rag:build
 */
import TurndownService from "turndown";
import { prisma } from "../../src/lib/prisma";
import { readBlogPosts, publishedBlogPosts } from "../../src/lib/content";
import { readCaseStudies } from "../../src/lib/case-studies-content";
import { chunkText } from "../../src/lib/rag/chunk";
import { embedBatch } from "../../src/lib/rag/embeddings";
import { CUSTOM_UPLOAD_SOURCE_TYPE } from "../../src/lib/rag/custom-knowledge";

const turndown = new TurndownService();

type SourceDoc = {
  sourceType: string;
  sourceId: string;
  title: string;
  content: string;
  url: string | null;
};

function htmlToText(html: string): string {
  return turndown.turndown(html || "").trim();
}

async function collectSourceDocs(): Promise<SourceDoc[]> {
  const docs: SourceDoc[] = [];

  const [services, solutions, industries, technologies, faqs, pricingPlans, posts, caseStudies] =
    await Promise.all([
      prisma.service.findMany({ where: { isActive: true } }),
      prisma.solution.findMany({ where: { isActive: true } }),
      prisma.industry.findMany({ where: { isActive: true } }),
      prisma.technology.findMany({ where: { isActive: true } }),
      prisma.faq.findMany({ where: { isActive: true } }),
      prisma.pricingPlan.findMany({ where: { isActive: true } }),
      readBlogPosts(),
      readCaseStudies(),
    ]);

  for (const [entities, sourceType, urlPrefix] of [
    [services, "service", "/services"],
    [solutions, "solution", "/solutions"],
    [industries, "industry", "/industries"],
    [technologies, "technology", "/technologies"],
  ] as const) {
    for (const e of entities) {
      const parts = [e.name, e.summary ?? "", e.description ?? ""].filter(Boolean);
      if (!parts.length) continue;
      docs.push({
        sourceType,
        sourceId: e.id,
        title: e.name,
        content: parts.join("\n\n"),
        url: `${urlPrefix}/${e.slug}`,
      });
    }
  }

  for (const faq of faqs) {
    docs.push({
      sourceType: "faq",
      sourceId: faq.id,
      title: faq.question,
      content: `Q: ${faq.question}\nA: ${faq.answer}`,
      url: null,
    });
  }

  for (const plan of pricingPlans) {
    const blob = (plan.features && typeof plan.features === "object" ? plan.features : {}) as {
      items?: unknown;
      monthlyPrice?: unknown;
      discountPercent?: unknown;
    };
    const monthlyPrice = Number(blob.monthlyPrice) || 0;
    const discountPercent = Number(blob.discountPercent) || 0;
    const finalMonthly = monthlyPrice * (1 - discountPercent / 100);
    const priceText =
      monthlyPrice > 0
        ? `${plan.currency ?? "₹"}${Math.round(finalMonthly)}/month${discountPercent > 0 ? ` (${discountPercent}% off the ${plan.currency ?? "₹"}${monthlyPrice} list price)` : ""}`
        : "";
    const parts = [
      plan.summary ?? "",
      priceText,
      Array.isArray(blob.items) ? JSON.stringify(blob.items) : "",
    ].filter(Boolean);
    if (!parts.length) continue;
    docs.push({
      sourceType: "pricing_plan",
      sourceId: plan.id,
      title: plan.name,
      content: parts.join("\n"),
      url: null,
    });
  }

  for (const post of publishedBlogPosts(posts)) {
    const body = htmlToText(post.body);
    const content = [post.description, body].filter(Boolean).join("\n\n");
    if (!content.trim()) continue;
    docs.push({
      sourceType: "blog_post",
      sourceId: post.slug,
      title: post.title,
      content,
      url: `/blog/${post.slug}`,
    });
  }

  for (const cs of caseStudies) {
    const body = htmlToText(cs.body);
    const content = [
      cs.description,
      `Client: ${cs.client} (${cs.industry})`,
      `Challenge: ${cs.challenge}`,
      `Outcome: ${cs.outcome} (${cs.metric} ${cs.metricLabel})`,
      body,
    ]
      .filter(Boolean)
      .join("\n\n");
    if (!content.trim()) continue;
    docs.push({
      sourceType: "case_study",
      sourceId: cs.slug,
      title: cs.title,
      content,
      url: `/case-studies/${cs.slug}`,
    });
  }

  return docs;
}

async function main() {
  console.log("Collecting source content...");
  const docs = await collectSourceDocs();
  console.log(`Found ${docs.length} source documents.`);

  const chunks: { sourceType: string; sourceId: string; chunkIndex: number; title: string; content: string; url: string | null }[] = [];
  for (const doc of docs) {
    const pieces = chunkText(doc.content);
    pieces.forEach((content, chunkIndex) => {
      chunks.push({
        sourceType: doc.sourceType,
        sourceId: doc.sourceId,
        chunkIndex,
        title: doc.title,
        content,
        url: doc.url,
      });
    });
  }
  console.log(`Split into ${chunks.length} chunks. Embedding...`);

  const embeddings = await embedBatch(chunks.map((c) => c.content));

  console.log("Replacing CMS-sourced knowledge (custom uploads via /admin/knowledge-base are preserved)...");
  await prisma.knowledgeChunk.deleteMany({ where: { sourceType: { not: CUSTOM_UPLOAD_SOURCE_TYPE } } });
  await prisma.knowledgeChunk.createMany({
    data: chunks.map((c, i) => ({
      sourceType: c.sourceType,
      sourceId: c.sourceId,
      chunkIndex: c.chunkIndex,
      title: c.title,
      content: c.content,
      url: c.url,
      embedding: embeddings[i],
    })),
  });

  console.log(`Done. ${chunks.length} chunks indexed.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
