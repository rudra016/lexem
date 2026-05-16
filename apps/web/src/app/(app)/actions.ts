"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, Prisma } from "@lexem/db";
import { requireUser } from "@/lib/session";
import {
  requireRole,
  requireProjectRole,
  requirePromptRole,
} from "@/lib/authz";
import { rethrowAsFriendly } from "@/lib/errors";
import { parseVariables } from "@/lib/variables";
import { MAIN_BRANCH, ensureMainBranch } from "@/lib/branches";
import { ensureDefaultEnvironments } from "@/lib/environments";

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

  await requireRole(user.id, parsed.teamId, "EDITOR");

  try {
    const project = await prisma.project.create({
      data: { teamId: parsed.teamId, name: parsed.name, slug: parsed.slug },
    });
    await ensureDefaultEnvironments(project.id);
    revalidatePath("/dashboard");
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
  const project = await requireProjectRole(user.id, parsed.projectSlug, "EDITOR");

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
  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");

  const target = await prisma.version.findFirst({
    where: { id: parsed.versionId, promptId: prompt.id },
  });
  if (!target) throw new Error("Version not found");

  if (target.id === prompt.currentVersionId) {
    throw new Error("That version is already current.");
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");

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
  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");

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
  branchName: z.string().default(MAIN_BRANCH),
});

export async function commitVersionAction(input: z.infer<typeof CommitVersionInput>) {
  const user = await requireUser();
  const parsed = CommitVersionInput.parse(input);
  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");

  const variables = parseVariables(parsed.content);

  await ensureMainBranch(prompt.id, prompt.currentVersionId);
  const branch = await prisma.branch.findFirst({
    where: { promptId: prompt.id, name: parsed.branchName },
  });
  if (!branch) throw new Error(`Branch "${parsed.branchName}" not found`);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const v = await tx.version.create({
      data: {
        promptId: prompt.id,
        authorId: user.id,
        branchName: parsed.branchName,
        content: parsed.content,
        commitMessage: parsed.commitMessage,
        parentVersionId: branch.headId ?? undefined,
        variables: variables as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.branch.update({ where: { id: branch.id }, data: { headId: v.id } });
    if (parsed.branchName === MAIN_BRANCH) {
      await tx.prompt.update({
        where: { id: prompt.id },
        data: { currentVersionId: v.id },
      });
    }
  });

  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}`);
}

// ---------- Branching ----------

const CreateBranchInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  name: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-zA-Z0-9._/-]+$/, "letters, numbers, dot, dash, underscore, slash only"),
  fromVersionId: z.string(),
});

export async function createBranchAction(input: z.infer<typeof CreateBranchInput>) {
  const user = await requireUser();
  const parsed = CreateBranchInput.parse(input);
  if (parsed.name === MAIN_BRANCH) throw new Error("`main` is reserved.");

  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");
  const version = await prisma.version.findFirst({
    where: { id: parsed.fromVersionId, promptId: prompt.id },
  });
  if (!version) throw new Error("Source version not found");

  try {
    await prisma.branch.create({
      data: { promptId: prompt.id, name: parsed.name, headId: version.id },
    });
  } catch (e) {
    rethrowAsFriendly(e);
  }

  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}`);
}

const DeleteBranchInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  branchId: z.string(),
});

export async function deleteBranchAction(input: z.infer<typeof DeleteBranchInput>) {
  const user = await requireUser();
  const parsed = DeleteBranchInput.parse(input);
  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");

  const branch = await prisma.branch.findFirst({
    where: { id: parsed.branchId, promptId: prompt.id },
  });
  if (!branch) throw new Error("Branch not found");
  if (branch.name === MAIN_BRANCH) throw new Error("Cannot delete `main` branch.");

  await prisma.branch.delete({ where: { id: branch.id } });
  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}`);
}

// ---------- Merge ----------

const MergeInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  fromBranchName: z.string(),
  toBranchName: z.string().default(MAIN_BRANCH),
  resolvedContent: z.string(),
  commitMessage: z.string().min(1).max(200),
  deleteSource: z.boolean().default(false),
});

export async function mergeBranchAction(input: z.infer<typeof MergeInput>) {
  const user = await requireUser();
  const parsed = MergeInput.parse(input);
  if (parsed.fromBranchName === parsed.toBranchName) {
    throw new Error("Source and target branch are the same.");
  }

  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");
  await ensureMainBranch(prompt.id, prompt.currentVersionId);

  const [from, to] = await Promise.all([
    prisma.branch.findFirst({
      where: { promptId: prompt.id, name: parsed.fromBranchName },
    }),
    prisma.branch.findFirst({
      where: { promptId: prompt.id, name: parsed.toBranchName },
    }),
  ]);
  if (!from) throw new Error("Source branch not found");
  if (!to) throw new Error("Target branch not found");

  const variables = parseVariables(parsed.resolvedContent);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const v = await tx.version.create({
      data: {
        promptId: prompt.id,
        authorId: user.id,
        branchName: parsed.toBranchName,
        content: parsed.resolvedContent,
        commitMessage: parsed.commitMessage,
        parentVersionId: to.headId ?? undefined,
        variables: variables as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.branch.update({ where: { id: to.id }, data: { headId: v.id } });
    if (parsed.toBranchName === MAIN_BRANCH) {
      await tx.prompt.update({
        where: { id: prompt.id },
        data: { currentVersionId: v.id },
      });
    }
    if (parsed.deleteSource && from.name !== MAIN_BRANCH) {
      await tx.branch.delete({ where: { id: from.id } });
    }
  });

  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}`);
}
