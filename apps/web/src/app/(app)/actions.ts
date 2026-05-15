"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, Prisma } from "@lexem/db";
import { requireUser } from "@/lib/session";
import { getProjectForUser, getPromptForUser } from "@/lib/authz";
import { rethrowAsFriendly } from "@/lib/errors";
import { parseVariables } from "@/lib/variables";

const CreateProjectInput = z.object({
  teamId: z.string(),
  name: z.string().min(1).max(60),
  slug: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, and dashes only"),
});

export async function createProjectAction(input: z.infer<typeof CreateProjectInput>) {
  const user = await requireUser();
  const parsed = CreateProjectInput.parse(input);

  const membership = await prisma.teamMember.findFirst({
    where: { teamId: parsed.teamId, userId: user.id },
  });
  if (!membership) throw new Error("Not a member of this team");

  try {
    const project = await prisma.project.create({
      data: { teamId: parsed.teamId, name: parsed.name, slug: parsed.slug },
    });
    revalidatePath("/");
    return project;
  } catch (e) {
    rethrowAsFriendly(e);
  }
}

const CreatePromptInput = z.object({
  projectSlug: z.string(),
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  description: z.string().max(200).optional(),
});

export async function createPromptAction(input: z.infer<typeof CreatePromptInput>) {
  const user = await requireUser();
  const parsed = CreatePromptInput.parse(input);
  const project = await getProjectForUser(user.id, parsed.projectSlug);

  let prompt;
  try {
    prompt = await prisma.prompt.create({
      data: {
        projectId: project.id,
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description,
      },
    });
  } catch (e) {
    rethrowAsFriendly(e);
  }

  revalidatePath(`/projects/${project.slug}`);
  redirect(`/projects/${project.slug}/${prompt!.slug}`);
}

const RollbackInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  versionId: z.string(),
});

export async function rollbackToVersionAction(input: z.infer<typeof RollbackInput>) {
  const user = await requireUser();
  const parsed = RollbackInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  const target = await prisma.version.findFirst({
    where: { id: parsed.versionId, promptId: prompt.id },
  });
  if (!target) throw new Error("Version not found");

  if (target.id === prompt.currentVersionId) {
    throw new Error("That version is already current.");
  }

  await prisma.$transaction(async (tx) => {
    const v = await tx.version.create({
      data: {
        promptId: prompt.id,
        authorId: user.id,
        content: target.content,
        commitMessage: `Rollback to ${target.id.slice(-7)}: ${target.commitMessage}`,
        parentVersionId: prompt.currentVersionId ?? undefined,
      },
    });
    await tx.prompt.update({
      where: { id: prompt.id },
      data: { currentVersionId: v.id },
    });
  });

  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}`);
}

const AddTagInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  versionId: z.string(),
  tag: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/, "letters, numbers, dot, dash, underscore only"),
});

export async function addTagAction(input: z.infer<typeof AddTagInput>) {
  const user = await requireUser();
  const parsed = AddTagInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  const version = await prisma.version.findFirst({
    where: { id: parsed.versionId, promptId: prompt.id },
    select: { id: true },
  });
  if (!version) throw new Error("Version not found");

  try {
    await prisma.versionTag.create({
      data: { versionId: version.id, name: parsed.tag },
    });
  } catch (e) {
    rethrowAsFriendly(e);
  }

  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}`);
}

const RemoveTagInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  tagId: z.string(),
});

export async function removeTagAction(input: z.infer<typeof RemoveTagInput>) {
  const user = await requireUser();
  const parsed = RemoveTagInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  await prisma.versionTag.deleteMany({
    where: { id: parsed.tagId, version: { promptId: prompt.id } },
  });

  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}`);
}

const CommitVersionInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  content: z.string(),
  commitMessage: z.string().min(1).max(200),
});

export async function commitVersionAction(input: z.infer<typeof CommitVersionInput>) {
  const user = await requireUser();
  const parsed = CommitVersionInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  const variables = parseVariables(parsed.content);

  await prisma.$transaction(async (tx) => {
    const v = await tx.version.create({
      data: {
        promptId: prompt.id,
        authorId: user.id,
        content: parsed.content,
        commitMessage: parsed.commitMessage,
        parentVersionId: prompt.currentVersionId ?? undefined,
        variables: variables as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.prompt.update({
      where: { id: prompt.id },
      data: { currentVersionId: v.id },
    });
  });

  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}`);
}
