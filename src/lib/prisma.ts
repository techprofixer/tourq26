import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Singleton Prisma client for serverless-friendly reuse.
 * After `npx prisma db push` or schema changes, run `npx prisma generate` and **restart** `next dev`
 * so this process loads a client that includes new models (e.g. `interviewBankItem`).
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
