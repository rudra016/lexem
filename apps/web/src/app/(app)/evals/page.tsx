import { requireUser } from "@/lib/session";
import { prisma } from "@lexem/db";
import Link from "next/link";

export default async function EvalsPage() {
  const user = await requireUser();

  const evals = await prisma.eval.findMany({
    where: {
      prompt: { project: { team: { members: { some: { userId: user.id } } } } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      prompt: { select: { name: true, slug: true, project: { select: { slug: true } } } },
      _count: { select: { cases: true } },
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { score: true, status: true, createdAt: true },
      },
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">All evals</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Every eval suite across your projects.
        </p>
      </div>

      {evals.length === 0 ? (
        <div className="bg-white border border-dashed border-black/30 p-12 text-center">
          <div className="text-lg font-medium mb-1">No eval suites yet</div>
          <p className="text-sm text-neutral-500">
            Open a prompt and add a suite to measure quality.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000]">
          {evals.map((e, i) => {
            const lastRun = e.runs[0];
            const score = lastRun?.score;
            return (
              <Link
                key={e.id}
                href={`/projects/${e.prompt.project.slug}/${e.prompt.slug}/evals`}
                className={`block px-5 py-4 hover:bg-neutral-50 ${i > 0 ? "border-t border-black/10" : ""}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 font-mono truncate">
                      {e.prompt.project.slug} / {e.prompt.slug}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {score != null ? (
                      <div className="text-lg font-black tabular-nums leading-none">
                        {score.toFixed(1)}
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-400 italic">no runs</div>
                    )}
                    <div className="text-xs text-neutral-500 mt-1">
                      {e._count.cases} case{e._count.cases === 1 ? "" : "s"}
                      {lastRun && (
                        <span className="ml-2">
                          {new Date(lastRun.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
