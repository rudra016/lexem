import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@lexem/db";
import { getProjectUsageSummary } from "@/lib/usage-analytics";

const WINDOW_DAYS = 30;

export default async function AnalyticsIndexPage() {
  const user = await requireUser();

  const projects = await prisma.project.findMany({
    where: { team: { members: { some: { userId: user.id } } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      team: { select: { name: true } },
    },
  });

  const summaries = await Promise.all(
    projects.map(async (p) => ({
      project: p,
      usage: await getProjectUsageSummary(p.id, WINDOW_DAYS),
    })),
  );

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Token usage across your projects over the last {WINDOW_DAYS} days.
          Counts come from eval runs and{" "}
          <code className="font-mono">lexem.logUsage()</code> calls.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-dashed border-black/30 p-12 text-center">
          <div className="text-lg font-medium mb-1">No projects yet</div>
          <p className="text-sm text-neutral-500">
            Create a project to start tracking usage.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000]">
          <div className="grid grid-cols-[1fr_repeat(4,minmax(0,90px))_24px] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-widest text-neutral-500 border-b border-black/10 bg-neutral-50">
            <span>Project</span>
            <span className="text-right">Events</span>
            <span className="text-right">Avg in</span>
            <span className="text-right">Avg out</span>
            <span className="text-right">Total</span>
            <span />
          </div>
          {summaries.map(({ project, usage }, i) => {
            const totalTokens = usage.totalTokensIn + usage.totalTokensOut;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.slug}/analytics`}
                className={`grid grid-cols-[1fr_repeat(4,minmax(0,90px))_24px] gap-3 px-5 py-3 items-center text-sm hover:bg-neutral-50 ${
                  i > 0 ? "border-t border-black/5" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{project.name}</div>
                  <div className="text-xs text-neutral-500 font-mono truncate">
                    {project.slug} · {project.team.name}
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  {usage.totalEvents.toLocaleString()}
                </div>
                <div className="text-right tabular-nums">
                  {usage.avgTokensIn.toLocaleString()}
                </div>
                <div className="text-right tabular-nums">
                  {usage.avgTokensOut.toLocaleString()}
                </div>
                <div className="text-right tabular-nums font-medium">
                  {totalTokens.toLocaleString()}
                </div>
                <ArrowRight size={14} className="text-neutral-400" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
