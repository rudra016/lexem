import { prisma, Prisma } from "@lexem/db";

export const DEFAULT_ENVIRONMENTS = ["dev", "staging", "production"] as const;
export type DefaultEnvName = (typeof DEFAULT_ENVIRONMENTS)[number];

/**
 * Returns the env that must already hold this version as active before promote
 * to `name` is allowed. Returns null for envs outside the default chain or for
 * the first env in the chain.
 */
export function previousEnvInChain(name: string): DefaultEnvName | null {
  const idx = (DEFAULT_ENVIRONMENTS as readonly string[]).indexOf(name);
  if (idx <= 0) return null;
  return DEFAULT_ENVIRONMENTS[idx - 1];
}

export async function ensureDefaultEnvironments(
  projectId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await tx.environment.createMany({
    data: DEFAULT_ENVIRONMENTS.map((name) => ({ projectId, name })),
    skipDuplicates: true,
  });
}
