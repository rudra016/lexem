"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, ScorerType } from "@lexem/db";
import { requireUser } from "@/lib/session";
import { getPromptForUser } from "@/lib/authz";
import { rethrowAsFriendly } from "@/lib/errors";

const CreateEvalInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  name: z.string().min(1).max(80),
});

export async function createEvalAction(input: z.infer<typeof CreateEvalInput>) {
  const user = await requireUser();
  const parsed = CreateEvalInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  try {
    const evalRow = await prisma.eval.create({
      data: { promptId: prompt.id, name: parsed.name },
    });
    revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}/evals`);
    return evalRow;
  } catch (e) {
    rethrowAsFriendly(e);
  }
}

const DeleteEvalInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  evalId: z.string(),
});

export async function deleteEvalAction(input: z.infer<typeof DeleteEvalInput>) {
  const user = await requireUser();
  const parsed = DeleteEvalInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  await prisma.eval.deleteMany({
    where: { id: parsed.evalId, promptId: prompt.id },
  });
  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}/evals`);
}

const ScorerSchema = z.enum(["EXACT_MATCH", "LLM_JUDGE", "REGEX"]);

const CaseFieldsSchema = z.object({
  name: z.string().max(80).optional(),
  inputVars: z.record(z.string(), z.unknown()),
  expectedOutput: z.string().optional().nullable(),
  scorerType: ScorerSchema,
  scorerConfig: z.record(z.string(), z.unknown()).optional().nullable(),
});

const CreateCaseInput = CaseFieldsSchema.extend({
  projectSlug: z.string(),
  promptSlug: z.string(),
  evalId: z.string(),
});

export async function createCaseAction(input: z.infer<typeof CreateCaseInput>) {
  const user = await requireUser();
  const parsed = CreateCaseInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  const evalRow = await prisma.eval.findFirst({
    where: { id: parsed.evalId, promptId: prompt.id },
    select: { id: true },
  });
  if (!evalRow) throw new Error("Eval not found");

  await prisma.evalCase.create({
    data: {
      evalId: evalRow.id,
      name: parsed.name,
      inputVars: parsed.inputVars as Prisma.InputJsonValue,
      expectedOutput: parsed.expectedOutput ?? null,
      scorerType: parsed.scorerType as ScorerType,
      scorerConfig: parsed.scorerConfig
        ? (parsed.scorerConfig as Prisma.InputJsonValue)
        : undefined,
    },
  });
  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}/evals`);
}

const UpdateCaseInput = CaseFieldsSchema.extend({
  projectSlug: z.string(),
  promptSlug: z.string(),
  caseId: z.string(),
});

export async function updateCaseAction(input: z.infer<typeof UpdateCaseInput>) {
  const user = await requireUser();
  const parsed = UpdateCaseInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  const updated = await prisma.evalCase.updateMany({
    where: { id: parsed.caseId, eval: { promptId: prompt.id } },
    data: {
      name: parsed.name,
      inputVars: parsed.inputVars as Prisma.InputJsonValue,
      expectedOutput: parsed.expectedOutput ?? null,
      scorerType: parsed.scorerType as ScorerType,
      scorerConfig: parsed.scorerConfig
        ? (parsed.scorerConfig as Prisma.InputJsonValue)
        : Prisma.DbNull,
    },
  });
  if (updated.count === 0) throw new Error("Case not found");

  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}/evals`);
}

const DeleteCaseInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  caseId: z.string(),
});

export async function deleteCaseAction(input: z.infer<typeof DeleteCaseInput>) {
  const user = await requireUser();
  const parsed = DeleteCaseInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  await prisma.evalCase.deleteMany({
    where: { id: parsed.caseId, eval: { promptId: prompt.id } },
  });
  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}/evals`);
}
