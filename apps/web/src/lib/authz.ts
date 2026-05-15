import { prisma } from "@lexem/db";
import { notFound } from "next/navigation";

export async function getProjectForUser(userId: string, slug: string) {
  const project = await prisma.project.findFirst({
    where: {
      slug,
      team: { members: { some: { userId } } },
    },
  });
  if (!project) notFound();
  return project;
}

export async function getPromptForUser(userId: string, projectSlug: string, promptSlug: string) {
  const prompt = await prisma.prompt.findFirst({
    where: {
      slug: promptSlug,
      project: {
        slug: projectSlug,
        team: { members: { some: { userId } } },
      },
    },
    include: { currentVersion: true, project: true },
  });
  if (!prompt) notFound();
  return prompt;
}
