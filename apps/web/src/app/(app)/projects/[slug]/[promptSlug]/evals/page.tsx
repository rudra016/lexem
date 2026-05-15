import { requireUser } from "@/lib/session";
import { getPromptForUser } from "@/lib/authz";
import { prisma } from "@lexem/db";
import { parseVariables } from "@/lib/variables";
import { EvalsClient } from "@/components/evals-client";
import Link from "next/link";

export default async function EvalsPage({
  params,
}: {
  params: Promise<{ slug: string; promptSlug: string }>;
}) {
  const { slug, promptSlug } = await params;
  const user = await requireUser();
  const prompt = await getPromptForUser(user.id, slug, promptSlug);

  const evals = await prisma.eval.findMany({
    where: { promptId: prompt.id },
    orderBy: { createdAt: "asc" },
    include: {
      cases: { orderBy: { createdAt: "asc" } },
      runs: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          version: { select: { id: true, commitMessage: true, branchName: true } },
        },
      },
    },
  });

  const REGRESSION_THRESHOLD = 5;

  const variables = prompt.currentVersion
    ? parseVariables(prompt.currentVersion.content)
    : [];

  const providerKeys = await prisma.providerKey.findMany({
    where: { team: { projects: { some: { id: prompt.projectId } } } },
    orderBy: { createdAt: "asc" },
    select: { id: true, provider: true, label: true, defaultModel: true },
  });

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div className="text-xs text-neutral-500 mb-2">
        <Link href="/dashboard" className="hover:underline">Projects</Link>
        <span className="mx-2">/</span>
        <Link href={`/projects/${slug}`} className="hover:underline">{prompt.project.slug}</Link>
        <span className="mx-2">/</span>
        <Link href={`/projects/${slug}/${promptSlug}`} className="hover:underline">
          {prompt.slug}
        </Link>
        <span className="mx-2">/</span>
        <span>evals</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">Evals</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Test suites for <span className="font-mono">{prompt.slug}</span>.
        </p>
      </div>

      <EvalsClient
        projectSlug={slug}
        promptSlug={promptSlug}
        hasCurrentVersion={Boolean(prompt.currentVersion)}
        variables={variables}
        providerKeys={providerKeys}
        evals={evals.map((e) => ({
          id: e.id,
          name: e.name,
          providerKeyId: e.providerKeyId,
          model: e.model,
          createdAt: e.createdAt.toISOString(),
          cases: e.cases.map((c) => ({
            id: c.id,
            name: c.name,
            inputVars: c.inputVars as Record<string, unknown>,
            expectedOutput: c.expectedOutput,
            scorerType: c.scorerType,
            scorerConfig: (c.scorerConfig as Record<string, unknown> | null) ?? null,
          })),
          lastRun: e.runs[0]
            ? {
                id: e.runs[0].id,
                status: e.runs[0].status,
                score: e.runs[0].score,
                tokensIn: e.runs[0].tokensIn,
                tokensOut: e.runs[0].tokensOut,
                completedAt: e.runs[0].completedAt?.toISOString() ?? null,
                createdAt: e.runs[0].createdAt.toISOString(),
                results:
                  (e.runs[0].results as Array<Record<string, unknown>> | null) ?? null,
                version: e.runs[0].version,
              }
            : null,
          history: (() => {
            const succeeded = e.runs
              .filter((r) => r.status === "SUCCEEDED" && r.score != null)
              .slice()
              .reverse(); // oldest → newest
            return succeeded.map((r, i) => {
              const prev = i > 0 ? succeeded[i - 1] : null;
              const regression =
                prev != null &&
                prev.score != null &&
                r.score != null &&
                r.score < prev.score - REGRESSION_THRESHOLD;
              return {
                id: r.id,
                score: r.score!,
                commitMessage: r.version?.commitMessage ?? "—",
                createdAt: r.createdAt.toISOString(),
                regression,
              };
            });
          })(),
        }))}
      />
    </div>
  );
}
