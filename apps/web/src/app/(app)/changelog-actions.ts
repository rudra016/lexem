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

const SYSTEM_PROMPT = `You are a senior engineer reviewing changes to an AI system prompt.
Given the previous and updated version, write a short summary of what changed.

Requirements:
- 2 to 4 sentences, plain English.
- Focus on intent and behavioural impact, not character-level edits.
- Do NOT quote the full prompt; only short fragments if useful.
- If the change is purely cosmetic (whitespace, formatting), say so plainly.
- No headings, no markdown, no bullet points.`;

export async function generateChangelogAction(input: z.infer<typeof ChangelogInput>) {
  const user = await requireUser();
  const parsed = ChangelogInput.parse(input);

  if (parsed.fromContent === parsed.toContent) {
    return "No changes between these versions.";
  }

  // Use the first provider key available to any of the user's teams.
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
    temperature: 0.2,
  });

  return res.output || "Could not generate summary.";
}
