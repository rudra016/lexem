"use server";

import { z } from "zod";
import { prisma } from "@lexem/db";
import { requireUser } from "@/lib/session";
import { decrypt } from "@/lib/crypto";
import { completeChat, DEFAULT_MODELS } from "@/lib/providers";

const ChangelogInput = z.object({
  fromContent: z.string(),
  toContent: z.string(),
  fromLabel: z.string().optional(),
  toLabel: z.string().optional(),
});

export type ImpactSeverity = "info" | "warn" | "high";

export type DiffSummary = {
  summary: string;
  impacts: { severity: ImpactSeverity; note: string }[];
};

const SYSTEM_PROMPT = `You are a senior engineer reviewing changes to an AI system prompt.
You will be given the previous and updated version. Return a JSON object with two fields:

{
  "summary": string,   // 2-3 sentences, plain English, no markdown. Describe intent of the change, not character edits. If the change is purely cosmetic (whitespace, reordering with no semantic shift), say so plainly.
  "impacts": [         // 0-5 entries flagging behavioural risks the change may introduce in production
    {
      "severity": "info" | "warn" | "high",
      "note": string   // one short sentence (<= 25 words)
    }
  ]
}

When deciding impacts, look for:
- Tone or persona shifts (e.g. became more formal, more terse, more apologetic).
- Scope changes (new tasks the model is now asked to do, or tasks removed).
- Instructions that contradict each other or contradict surviving instructions.
- Removed or weakened safety/guardrail language, refusal triggers, or PII handling.
- New required output format (JSON shape, length limits) that downstream code may not handle.
- New variables referenced that weren't declared, or declared variables that are no longer used.

Severity guide:
- "high": likely to break callers or change refusal/safety behaviour.
- "warn": output style or scope will visibly shift; evals likely affected.
- "info": worth knowing but unlikely to break things.

If the change is cosmetic, return an empty impacts array. Output JSON only — no prose, no code fences.`;

const ImpactItem = z.object({
  severity: z.enum(["info", "warn", "high"]),
  note: z.string().min(1).max(400),
});
const ResultSchema = z.object({
  summary: z.string().min(1),
  impacts: z.array(ImpactItem).max(10).default([]),
});

export async function generateChangelogAction(
  input: z.infer<typeof ChangelogInput>,
): Promise<DiffSummary> {
  const user = await requireUser();
  const parsed = ChangelogInput.parse(input);

  if (parsed.fromContent === parsed.toContent) {
    return { summary: "No changes between these versions.", impacts: [] };
  }

  const keyRow = await prisma.providerKey.findFirst({
    where: { team: { members: { some: { userId: user.id } } } },
    orderBy: { createdAt: "asc" },
  });
  if (!keyRow) {
    throw new Error(
      "Add a provider key in Settings to enable AI-generated summaries.",
    );
  }

  const apiKey = decrypt(keyRow.encryptedKey);
  const model = keyRow.defaultModel || DEFAULT_MODELS[keyRow.provider][0];

  const userPrompt = [
    `Previous (${parsed.fromLabel ?? "from"}):`,
    "```",
    parsed.fromContent,
    "```",
    "",
    `Updated (${parsed.toLabel ?? "to"}):`,
    "```",
    parsed.toContent,
    "```",
  ].join("\n");

  const res = await completeChat({
    provider: keyRow.provider,
    apiKey,
    model,
    system: SYSTEM_PROMPT,
    user: userPrompt,
    jsonOutput: true,
    temperature: 0.2,
  });

  const raw = res.output?.trim() ?? "";
  const jsonText = stripCodeFence(raw);

  try {
    const parsedJson = JSON.parse(jsonText);
    return ResultSchema.parse(parsedJson);
  } catch {
    return {
      summary: raw || "Could not generate summary.",
      impacts: [],
    };
  }
}

function stripCodeFence(s: string): string {
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fence ? fence[1] : s;
}
