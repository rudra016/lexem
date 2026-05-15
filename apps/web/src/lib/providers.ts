import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Provider } from "@lexem/db";

export const PROVIDER_LABELS: Record<Provider, string> = {
  OPENAI: "OpenAI",
  ANTHROPIC: "Anthropic",
  GOOGLE: "Google",
};

// Suggested defaults — users can type any model name they have access to.
export const DEFAULT_MODELS: Record<Provider, string[]> = {
  OPENAI: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "gpt-4.1-mini", "o4-mini"],
  ANTHROPIC: [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
    "claude-opus-4-7",
    "claude-3-5-sonnet-latest",
  ],
  GOOGLE: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-1.5-pro"],
};

export type ChatResult = {
  output: string;
  tokensIn: number;
  tokensOut: number;
};

export async function completeChat({
  provider,
  apiKey,
  model,
  system,
  user,
  jsonOutput = false,
  temperature = 0,
}: {
  provider: Provider;
  apiKey: string;
  model: string;
  system?: string;
  user?: string;
  jsonOutput?: boolean;
  temperature?: number;
}): Promise<ChatResult> {
  if (provider === "OPENAI") {
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model,
      temperature,
      ...(jsonOutput ? { response_format: { type: "json_object" as const } } : {}),
      messages: [
        ...(system ? [{ role: "system" as const, content: system }] : []),
        ...(user ? [{ role: "user" as const, content: user }] : []),
      ],
    });
    return {
      output: (res.choices[0]?.message?.content ?? "").trim(),
      tokensIn: res.usage?.prompt_tokens ?? 0,
      tokensOut: res.usage?.completion_tokens ?? 0,
    };
  }

  if (provider === "ANTHROPIC") {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature,
      system: system ?? undefined,
      messages: [{ role: "user", content: user ?? "" }],
    });
    const text = res.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("")
      .trim();
    return {
      output: text,
      tokensIn: res.usage.input_tokens,
      tokensOut: res.usage.output_tokens,
    };
  }

  if (provider === "GOOGLE") {
    const client = new GoogleGenerativeAI(apiKey);
    const m = client.getGenerativeModel({
      model,
      ...(system ? { systemInstruction: system } : {}),
      ...(jsonOutput
        ? { generationConfig: { temperature, responseMimeType: "application/json" } }
        : { generationConfig: { temperature } }),
    });
    const res = await m.generateContent(user ?? "");
    const text = res.response.text().trim();
    const usage = res.response.usageMetadata;
    return {
      output: text,
      tokensIn: usage?.promptTokenCount ?? 0,
      tokensOut: usage?.candidatesTokenCount ?? 0,
    };
  }

  throw new Error(`Unknown provider: ${String(provider)}`);
}
