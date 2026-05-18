"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, ScorerType, Provider } from "@lexem/db";
import { requireUser } from "@/lib/session";
import { requirePromptRole } from "@/lib/authz";
import { rethrowAsFriendly } from "@/lib/errors";
import { runCase, type CaseResult } from "@/lib/eval-runner";
import { decrypt } from "@/lib/crypto";
import { completeChat, DEFAULT_MODELS } from "@/lib/providers";
import { parseVariables } from "@/lib/variables";

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
  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");

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
  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");

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
  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");

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
  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");

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
  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");

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
  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");

  await prisma.evalCase.deleteMany({
    where: { id: parsed.caseId, eval: { promptId: prompt.id } },
  });
  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}/evals`);
}

// ---------- Auto case generation ----------

const GenerateInput = z.object({
  projectSlug: z.string(),
  promptSlug: z.string(),
  name: z.string().min(1).max(80),
  count: z.number().int().min(5).max(15),
  providerKeyId: z.string().optional().nullable(),
  model: z.string().max(80).optional().nullable(),
});

const GENERATOR_SYSTEM = `You are an expert at writing test cases for AI system prompts.
You will be given a system prompt and the list of variables it accepts. Your job is to
brainstorm a diverse set of test cases that, taken together, exercise the prompt's
behaviour across realistic scenarios — happy paths, edge cases, adversarial inputs,
empty inputs, and tone/scope boundaries.

Return a JSON object with this exact shape:

{
  "cases": [
    {
      "name": string,           // 2-5 words, Title Case, describes what this case probes
      "inputVars": { ... },     // object mapping each declared variable name to a concrete value of the correct type
      "rubric": string          // 1-2 sentences telling an LLM judge how to grade the output. Specific and verifiable.
    }
  ]
}

Rules:
- Generate exactly the number of cases requested.
- Every case MUST provide a value for every variable, of the correct type (string/number/boolean).
- If the prompt has no variables, "inputVars" is an empty object {} and each case probes a different aspect of the output.
- Cases must be meaningfully different from each other — different intents, register, length, edge cases.
- Rubrics describe what a CORRECT output looks like for THIS case. They should be checkable: mention concrete content, format, tone, or refusal expectations.
- No markdown, no code fences, JSON only.`;

const GeneratedCaseSchema = z.object({
  name: z.string().min(1).max(80),
  inputVars: z.record(z.string(), z.unknown()),
  rubric: z.string().min(1).max(500),
});
const GeneratorOutputSchema = z.object({
  cases: z.array(GeneratedCaseSchema).min(1).max(20),
});

function stripCodeFence(s: string): string {
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fence ? fence[1] : s;
}

export async function createEvalWithGeneratedCasesAction(
  input: z.infer<typeof GenerateInput>,
) {
  const user = await requireUser();
  const parsed = GenerateInput.parse(input);
  const prompt = await requirePromptRole(
    user.id,
    parsed.projectSlug,
    parsed.promptSlug,
    "EDITOR",
  );

  // Need a committed version to read prompt content + variables.
  const currentVersionId = prompt.currentVersionId;
  if (!currentVersionId) {
    throw new Error("Commit a version first — there's nothing to generate cases for yet.");
  }
  const version = await prisma.version.findFirst({
    where: { id: currentVersionId, promptId: prompt.id },
    select: { content: true },
  });
  if (!version) throw new Error("Current version not found.");

  // Resolve provider key — preferred from input, otherwise first team key.
  let providerKeyRow = parsed.providerKeyId
    ? await prisma.providerKey.findFirst({
        where: {
          id: parsed.providerKeyId,
          team: { projects: { some: { id: prompt.projectId } } },
        },
      })
    : null;
  if (!providerKeyRow) {
    providerKeyRow = await prisma.providerKey.findFirst({
      where: { team: { projects: { some: { id: prompt.projectId } } } },
      orderBy: { createdAt: "asc" },
    });
  }
  if (!providerKeyRow) {
    throw new Error("Add a provider key in Settings before generating cases.");
  }

  const apiKey = decrypt(providerKeyRow.encryptedKey);
  const provider = providerKeyRow.provider as Provider;
  const generationModel =
    parsed.model || providerKeyRow.defaultModel || DEFAULT_MODELS[provider][0];

  const variables = parseVariables(version.content);
  const variableDescription =
    variables.length > 0
      ? variables
          .map(
            (v) =>
              `  - {{${v.name}}}: ${v.type}${v.default != null ? ` (default: ${JSON.stringify(v.default)})` : ""}`,
          )
          .join("\n")
      : "  (none — generate cases with empty inputVars)";

  const userPrompt = [
    `System prompt under test:`,
    "```",
    version.content,
    "```",
    "",
    `Declared variables:`,
    variableDescription,
    "",
    `Generate exactly ${parsed.count} test cases.`,
  ].join("\n");

  const res = await completeChat({
    provider,
    apiKey,
    model: generationModel,
    system: GENERATOR_SYSTEM,
    user: userPrompt,
    jsonOutput: true,
    temperature: 0.7,
  });

  const raw = res.output?.trim() ?? "";
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripCodeFence(raw));
  } catch {
    throw new Error("The model returned invalid JSON. Try again or pick a different model.");
  }
  const generated = GeneratorOutputSchema.safeParse(parsedJson);
  if (!generated.success) {
    throw new Error("The model returned an unexpected shape. Try again or pick a different model.");
  }

  // Coerce values to declared variable types where possible.
  const varTypes = new Map(variables.map((v) => [v.name, v.type] as const));
  function coerce(value: unknown, type: "string" | "number" | "boolean"): unknown {
    if (type === "number") {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isFinite(n) ? n : 0;
    }
    if (type === "boolean") {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") return value.toLowerCase() === "true";
      return Boolean(value);
    }
    return typeof value === "string" ? value : String(value ?? "");
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const evalRow = await tx.eval.create({
        data: {
          promptId: prompt.id,
          name: parsed.name,
          providerKeyId: parsed.providerKeyId || null,
          model: parsed.model || null,
        },
      });
      for (const c of generated.data.cases) {
        const inputVars: Record<string, unknown> = {};
        for (const v of variables) {
          inputVars[v.name] = coerce(c.inputVars[v.name], v.type);
        }
        // Allow extra keys from the LLM through too, in case prompt has dynamic vars.
        for (const [k, val] of Object.entries(c.inputVars)) {
          if (!varTypes.has(k)) inputVars[k] = val;
        }

        await tx.evalCase.create({
          data: {
            evalId: evalRow.id,
            name: c.name,
            inputVars: inputVars as Prisma.InputJsonValue,
            expectedOutput: null,
            scorerType: "LLM_JUDGE" as ScorerType,
            scorerConfig: { rubric: c.rubric } as Prisma.InputJsonValue,
          },
        });
      }
    });
  } catch (e) {
    rethrowAsFriendly(e);
  }

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
  const prompt = await requirePromptRole(user.id, parsed.projectSlug, parsed.promptSlug, "EDITOR");

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

    if (tokensIn > 0 || tokensOut > 0) {
      await prisma.usageEvent.create({
        data: {
          projectId: prompt.projectId,
          promptId: prompt.id,
          versionId: version.id,
          envName: null,
          tokensIn,
          tokensOut,
          source: "eval",
        },
      });
    }
  } catch (e) {
    await prisma.run.update({
      where: { id: run.id },
      data: { status: "FAILED", completedAt: new Date() },
    });
    throw e;
  }

  revalidatePath(`/projects/${parsed.projectSlug}/${parsed.promptSlug}/evals`);
}
