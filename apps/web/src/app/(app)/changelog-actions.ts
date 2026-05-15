"use server";

import OpenAI from "openai";
import { z } from "zod";
import { requireUser } from "@/lib/session";

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
  await requireUser();
  const parsed = ChangelogInput.parse(input);

  if (parsed.fromContent === parsed.toContent) {
    return "No changes between these versions.";
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set on the server.");
  }

  const client = new OpenAI();

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

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  return res.choices[0]?.message?.content?.trim() ?? "Could not generate summary.";
}
