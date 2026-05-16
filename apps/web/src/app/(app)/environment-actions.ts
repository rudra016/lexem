"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma } from "@lexem/db";
import { requireUser } from "@/lib/session";
import { requireProjectRole } from "@/lib/authz";
import { previousEnvInChain } from "@/lib/environments";

const PromoteInput = z.object({
  projectSlug: z.string(),
  environmentName: z.string().min(1),
  promptId: z.string(),
  versionId: z.string(),
});

export async function promoteVersionAction(input: z.infer<typeof PromoteInput>) {
  const user = await requireUser();
  const parsed = PromoteInput.parse(input);
  const project = await requireProjectRole(user.id, parsed.projectSlug, "ADMIN");

  const [environment, prompt, version] = await Promise.all([
    prisma.environment.findFirst({
      where: { projectId: project.id, name: parsed.environmentName },
    }),
    prisma.prompt.findFirst({
      where: { id: parsed.promptId, projectId: project.id },
      select: { id: true },
    }),
    prisma.version.findFirst({
      where: { id: parsed.versionId, promptId: parsed.promptId },
      select: { id: true },
    }),
  ]);
  if (!environment) throw new Error(`Environment "${parsed.environmentName}" not found`);
  if (!prompt) throw new Error("Prompt not found");
  if (!version) throw new Error("Version not found");

  // Enforce dev → staging → production ordering.
  const prevName = previousEnvInChain(environment.name);
  if (prevName) {
    const prevEnv = await prisma.environment.findFirst({
      where: { projectId: project.id, name: prevName },
      include: {
        promptEnvironments: {
          where: { promptId: prompt.id },
          select: { activeVersionId: true },
        },
      },
    });
    const liveInPrev = prevEnv?.promptEnvironments[0]?.activeVersionId;
    if (liveInPrev !== version.id) {
      throw new Error(
        `This version must be live in "${prevName}" before promoting to "${environment.name}".`,
      );
    }
  }

  const status = environment.requiresApproval ? "PENDING_APPROVAL" : "ACTIVE";

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.deployment.create({
      data: {
        environmentId: environment.id,
        promptId: prompt.id,
        versionId: version.id,
        deployedBy: user.id,
        status,
        approvedBy: status === "ACTIVE" ? user.id : null,
        approvedAt: status === "ACTIVE" ? new Date() : null,
      },
    });
    if (status === "ACTIVE") {
      await tx.promptEnvironment.upsert({
        where: {
          promptId_environmentId: {
            promptId: prompt.id,
            environmentId: environment.id,
          },
        },
        create: {
          promptId: prompt.id,
          environmentId: environment.id,
          activeVersionId: version.id,
        },
        update: { activeVersionId: version.id },
      });
    }
  });

  revalidatePath(`/projects/${parsed.projectSlug}/environments`);
}

const DeploymentReviewInput = z.object({
  projectSlug: z.string(),
  deploymentId: z.string(),
});

export async function approveDeploymentAction(
  input: z.infer<typeof DeploymentReviewInput>,
) {
  const user = await requireUser();
  const parsed = DeploymentReviewInput.parse(input);
  const project = await requireProjectRole(user.id, parsed.projectSlug, "ADMIN");

  const deployment = await prisma.deployment.findFirst({
    where: { id: parsed.deploymentId, environment: { projectId: project.id } },
  });
  if (!deployment) throw new Error("Deployment not found");
  if (deployment.status !== "PENDING_APPROVAL") {
    throw new Error(`Deployment is ${deployment.status.toLowerCase()}, not pending`);
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.deployment.update({
      where: { id: deployment.id },
      data: {
        status: "ACTIVE",
        approvedBy: user.id,
        approvedAt: new Date(),
      },
    });
    await tx.promptEnvironment.upsert({
      where: {
        promptId_environmentId: {
          promptId: deployment.promptId,
          environmentId: deployment.environmentId,
        },
      },
      create: {
        promptId: deployment.promptId,
        environmentId: deployment.environmentId,
        activeVersionId: deployment.versionId,
      },
      update: { activeVersionId: deployment.versionId },
    });
  });

  revalidatePath(`/projects/${parsed.projectSlug}/environments`);
}

export async function rejectDeploymentAction(
  input: z.infer<typeof DeploymentReviewInput>,
) {
  const user = await requireUser();
  const parsed = DeploymentReviewInput.parse(input);
  const project = await requireProjectRole(user.id, parsed.projectSlug, "ADMIN");

  const deployment = await prisma.deployment.findFirst({
    where: { id: parsed.deploymentId, environment: { projectId: project.id } },
  });
  if (!deployment) throw new Error("Deployment not found");
  if (deployment.status !== "PENDING_APPROVAL") {
    throw new Error(`Deployment is ${deployment.status.toLowerCase()}, not pending`);
  }

  await prisma.deployment.update({
    where: { id: deployment.id },
    data: {
      status: "REJECTED",
      approvedBy: user.id,
      approvedAt: new Date(),
    },
  });

  revalidatePath(`/projects/${parsed.projectSlug}/environments`);
}

const SetApprovalInput = z.object({
  projectSlug: z.string(),
  environmentName: z.string(),
  requiresApproval: z.boolean(),
});

export async function setEnvironmentApprovalAction(
  input: z.infer<typeof SetApprovalInput>,
) {
  const user = await requireUser();
  const parsed = SetApprovalInput.parse(input);
  const project = await requireProjectRole(user.id, parsed.projectSlug, "ADMIN");

  const env = await prisma.environment.findFirst({
    where: { projectId: project.id, name: parsed.environmentName },
  });
  if (!env) throw new Error("Environment not found");

  await prisma.environment.update({
    where: { id: env.id },
    data: { requiresApproval: parsed.requiresApproval },
  });

  revalidatePath(`/projects/${parsed.projectSlug}/environments`);
}
