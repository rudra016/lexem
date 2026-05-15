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
    },
  });

  const variables = prompt.currentVersion
    ? parseVariables(prompt.currentVersion.content)
    : [];

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div className="text-xs text-neutral-500 mb-2">
        <Link href="/" className="hover:underline">Projects</Link>
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
        <h1 className="text-2xl font-semibold">Evals</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Test suites for <span className="font-mono">{prompt.slug}</span>.
        </p>
      </div>

      <EvalsClient
        projectSlug={slug}
        promptSlug={promptSlug}
        variables={variables}
        evals={evals.map((e) => ({
          id: e.id,
          name: e.name,
          createdAt: e.createdAt.toISOString(),
          cases: e.cases.map((c) => ({
            id: c.id,
            name: c.name,
            inputVars: c.inputVars as Record<string, unknown>,
            expectedOutput: c.expectedOutput,
            scorerType: c.scorerType,
            scorerConfig: (c.scorerConfig as Record<string, unknown> | null) ?? null,
          })),
        }))}
      />
    </div>
  );
}
