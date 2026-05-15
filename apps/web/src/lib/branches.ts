import { prisma } from "@lexem/db";

export const MAIN_BRANCH = "main";

export async function ensureMainBranch(promptId: string, headId: string | null) {
  const existing = await prisma.branch.findFirst({
    where: { promptId, name: MAIN_BRANCH },
  });
  if (existing) {
    if (existing.headId !== headId && headId) {
      await prisma.branch.update({ where: { id: existing.id }, data: { headId } });
    }
    return existing;
  }
  return prisma.branch.create({
    data: { promptId, name: MAIN_BRANCH, headId: headId ?? undefined },
  });
}

export async function listBranches(promptId: string) {
  const branches = await prisma.branch.findMany({
    where: { promptId },
    orderBy: [{ name: "asc" }],
    include: { head: { select: { id: true, content: true, commitMessage: true, createdAt: true } } },
  });
  return branches;
}

export async function getBranch(promptId: string, name: string) {
  return prisma.branch.findFirst({
    where: { promptId, name },
    include: { head: true },
  });
}
