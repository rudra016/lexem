"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, ScorerType, Provider } from "@lexem/db";
import { requireUser } from "@/lib/session";
import { getPromptForUser } from "@/lib/authz";
import { rethrowAsFriendly } from "@/lib/errors";
import { runCase, type CaseResult } from "@/lib/eval-runner";
import { decrypt } from "@/lib/crypto";
import { DEFAULT_MODELS } from "@/lib/providers";
import { EVAL_TEMPLATES } from "@/lib/eval-templates";

const CreateEvalInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  name: z.string().min(1).max(80),
  providerKeyId: z.string().optional().nullable(),
  model: z.string().max(80).optional().nullable(),
});

export async function createEvalAction(input: z.infer<typeof CreateEvalInput>) {
  const user = await requireUser();
  const parsed = CreateEvalInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  try {
    const evalRow = await prisma.eval.create({
      data: {
        promptId: prompt.id,
        name: parsed.name,
        providerKeyId: parsed.providerKeyId || null,
        model: parsed.model || null,
      },
    });
    revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}/evals`);
    return evalRow;
  } catch (e) {
    rethrowAsFriendly(e);
  }
}

const UpdateEvalInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  evalId: z.string(),
  name: z.string().min(1).max(80).optional(),
  providerKeyId: z.string().optional().nullable(),
  model: z.string().max(80).optional().nullable(),
});

export async function updateEvalAction(input: z.infer<typeof UpdateEvalInput>) {
  const user = await requireUser();
  const parsed = UpdateEvalInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  const data: Record<string, unknown> = {};
  if (parsed.name !== undefined) data.name = parsed.name;
  if (parsed.providerKeyId !== undefined) data.providerKeyId = parsed.providerKeyId || null;
  if (parsed.model !== undefined) data.model = parsed.model || null;

  try {
    await prisma.eval.updateMany({
      where: { id: parsed.evalId, promptId: prompt.id },
      data,
    });
  } catch (e) {
    rethrowAsFriendly(e);
  }
  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}/evals`);
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

// ---------- Templates ----------

const CreateFromTemplateInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  templateId: z.string(),
  name: z.string().min(1).max(80).optional(),
  providerKeyId: z.string().optional().nullable(),
  model: z.string().max(80).optional().nullable(),
});

export async function createEvalFromTemplateAction(
  input: z.infer<typeof CreateFromTemplateInput>,
) {
  const user = await requireUser();
  const parsed = CreateFromTemplateInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  const template = EVAL_TEMPLATES.find((t) => t.id === parsed.templateId);
  if (!template) throw new Error("Template not found");

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const evalRow = await tx.eval.create({
      data: {
        promptId: prompt.id,
        name: parsed.name ?? template.name,
        providerKeyId: parsed.providerKeyId || null,
        model: parsed.model || null,
      },
    });
    for (const c of template.cases) {
      await tx.evalCase.create({
        data: {
          evalId: evalRow.id,
          name: c.name,
          inputVars: c.inputVars as Prisma.InputJsonValue,
          expectedOutput: c.expectedOutput ?? null,
          scorerType: c.scorerType as ScorerType,
          scorerConfig: c.scorerConfig
            ? (c.scorerConfig as Prisma.InputJsonValue)
            : Prisma.DbNull,
        },
      });
    }
  });

  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}/evals`);
}

// ---------- Runner ----------

const RunEvalInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  evalId: z.string(),
  versionId: z.string().optional(),
});

export async function runEvalAction(input: z.infer<typeof RunEvalInput>) {
  const user = await requireUser();
  const parsed = RunEvalInput.parse(input);
  const prompt = await getPromptForUser(user.id, parsed.projectSlug, parsed.promptSlug);

  const evalRow = await prisma.eval.findFirst({
    where: { id: parsed.evalId, promptId: prompt.id },
    include: {
      cases: { orderBy: { createdAt: "asc" } },
      providerKey: true,
    },
  });
  if (!evalRow) throw new Error("Eval not found");
  if (evalRow.cases.length === 0) throw new Error("Add at least one case before running.");

  const versionId = parsed.versionId ?? prompt.currentVersionId;
  if (!versionId) throw new Error("This prompt has no committed version yet.");

  const version = await prisma.version.findFirst({
    where: { id: versionId, promptId: prompt.id },
  });
  if (!version) throw new Error("Version not found");

  // Resolve provider key — eval's own, or fall back to first team key.
  let providerKeyRow = evalRow.providerKey;
  if (!providerKeyRow) {
    const teamKey = await prisma.providerKey.findFirst({
      where: { team: { projects: { some: { id: prompt.projectId } } } },
      orderBy: { createdAt: "asc" },
    });
    if (!teamKey) {
      throw new Error("No provider key configured. Add one in Settings.");
    }
    providerKeyRow = teamKey;
  }

  const apiKey = decrypt(providerKeyRow.encryptedKey);
  const provider = providerKeyRow.provider as Provider;
  const model =
    evalRow.model ||
    providerKeyRow.defaultModel ||
    DEFAULT_MODELS[provider][0];

  const run = await prisma.run.create({
    data: {
      evalId: evalRow.id,
      versionId: version.id,
      status: "RUNNING",
      provider,
      model,
      startedAt: new Date(),
    },
  });

  try {
    const results: CaseResult[] = [];
    for (const c of evalRow.cases) {
      const r = await runCase(
        { provider, apiKey, model },
        version.content,
        {
          id: c.id,
          name: c.name,
          inputVars: c.inputVars as Record<string, unknown>,
          expectedOutput: c.expectedOutput,
          scorerType: c.scorerType as ScorerType,
          scorerConfig: (c.scorerConfig as Record<string, unknown> | null) ?? null,
        },
      );
      results.push(r);
    }

    const tokensIn = results.reduce((s, r) => s + r.tokensIn, 0);
    const tokensOut = results.reduce((s, r) => s + r.tokensOut, 0);
    const scoreAvg =
      results.length > 0
        ? results.reduce((s, r) => s + r.score, 0) / results.length
        : 0;
    const score = Math.round(scoreAvg * 1000) / 10;

    await prisma.run.update({
      where: { id: run.id },
      data: {
        status: "SUCCEEDED",
        score,
        results: results as unknown as Prisma.InputJsonValue,
        tokensIn,
        tokensOut,
        completedAt: new Date(),
      },
    });
  } catch (e) {
    await prisma.run.update({
      where: { id: run.id },
      data: { status: "FAILED", completedAt: new Date() },
    });
    throw e;
  }

  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}/evals`);
}
