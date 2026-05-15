import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __lexemPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.__lexemPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__lexemPrisma = prisma;
}

export { Prisma, TeamRole, ScorerType, RunStatus } from "@prisma/client";
export type * from "@prisma/client";
