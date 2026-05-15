import type { Provider, ScorerType } from "@lexem/db";
import { VAR_RE } from "./variables";
import { completeChat } from "./providers";

export const JUDGE_PASS_THRESHOLD = 0.7;

export function renderTemplate(content: string, vars: Record<string, unknown>): string {
  return content.replace(VAR_RE, (_match, name: string) => {
    if (name in vars) {
      const v = vars[name];
      return v === null || v === undefined ? "" : String(v);
    }
    return `{{${name}}}`;
  });
}

export type CaseInput = {
  id: string;
  name: string | null;
  inputVars: Record<string, unknown>;
  expectedOutput: string | null;
  scorerType: ScorerType;
  scorerConfig: Record<string, unknown> | null;
};

export type CaseResult = {
  caseId: string;
  caseName: string | null;
  scorerType: ScorerType;
  passed: boolean;
  score: number;
  output: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  error?: string;
  judgeReason?: string;
};

export type RunConfig = {
  provider: Provider;
  apiKey: string;
  model: string;
};

const JUDGE_SYSTEM = `You are a strict evaluator. Score the assistant's output against the rubric.
Return ONLY a JSON object of the shape: {"score": <number 0..1>, "reason": "<one short sentence>"}.
score=1 means fully satisfies the rubric; 0 means fails entirely. Be calibrated.`;

export async function runCase(
  config: RunConfig,
  systemPrompt: string,
  caseRow: CaseInput,
): Promise<CaseResult> {
  const rendered = renderTemplate(systemPrompt, caseRow.inputVars);
  const t0 = Date.now();
  try {
    const res = await completeChat({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      system: rendered,
      user: "Respond now.",
    });
    const output = res.output;
    let tokensIn = res.tokensIn;
    let tokensOut = res.tokensOut;

    let passed = false;
    let score = 0;
    let judgeReason: string | undefined;

    if (caseRow.scorerType === "EXACT_MATCH") {
      const expected = (caseRow.expectedOutput ?? "").trim();
      passed = expected === output;
      score = passed ? 1 : 0;
    } else if (caseRow.scorerType === "REGEX") {
      const pattern = (caseRow.scorerConfig?.pattern as string | undefined) ?? "";
      if (!pattern) {
        throw new Error("Regex pattern is empty");
      }
      const re = new RegExp(pattern, "s");
      passed = re.test(output);
      score = passed ? 1 : 0;
    } else if (caseRow.scorerType === "LLM_JUDGE") {
      const rubric = (caseRow.scorerConfig?.rubric as string | undefined) ?? "";
      if (!rubric) throw new Error("Judge rubric is empty");
      const judge = await completeChat({
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
        system: JUDGE_SYSTEM,
        user: `Rubric:\n${rubric}\n\nAssistant output:\n${output}`,
        jsonOutput: true,
      });
      tokensIn += judge.tokensIn;
      tokensOut += judge.tokensOut;
      try {
        const parsed = JSON.parse(judge.output) as { score?: unknown; reason?: unknown };
        const s = Number(parsed.score);
        score = Number.isFinite(s) ? Math.max(0, Math.min(1, s)) : 0;
        judgeReason = typeof parsed.reason === "string" ? parsed.reason : undefined;
      } catch {
        score = 0;
        judgeReason = "Judge returned non-JSON";
      }
      passed = score >= JUDGE_PASS_THRESHOLD;
    }

    return {
      caseId: caseRow.id,
      caseName: caseRow.name,
      scorerType: caseRow.scorerType,
      passed,
      score,
      output,
      tokensIn,
      tokensOut,
      latencyMs: Date.now() - t0,
      judgeReason,
    };
  } catch (e) {
    return {
      caseId: caseRow.id,
      caseName: caseRow.name,
      scorerType: caseRow.scorerType,
      passed: false,
      score: 0,
      output: "",
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: Date.now() - t0,
      error: e instanceof Error ? e.message : "Failed",
    };
  }
}
