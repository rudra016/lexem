import Link from "next/link";
import { requireUser, getUserTeams } from "@/lib/session";
import { prisma } from "@lexem/db";
import { DEFAULT_ENVIRONMENTS } from "@/lib/environments";

export default async function EnvironmentsPage() {
  const user = await requireUser();
  const teams = await getUserTeams(user.id);
  const teamIds = teams.map((t) => t.id);

  const projects = await prisma.project.findMany({
    where: { teamId: { in: teamIds } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { prompts: true } },
      environments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          promptEnvironments: {
            where: { activeVersionId: { not: null } },
            select: { id: true },
          },
        },
      },
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Environments</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Pick a project to see what&apos;s deployed to dev, staging, and production.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-dashed border-black/30 p-12 text-center">
          <div className="text-lg font-medium mb-1">No projects yet</div>
          <p className="text-sm text-neutral-500">
            Create a project from the dashboard to start managing environments.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000]">
          {projects.map((p, i) => {
            const orderedEnvs = [...p.environments].sort((a, b) => {
              const ai = DEFAULT_ENVIRONMENTS.indexOf(a.name as never);
              const bi = DEFAULT_ENVIRONMENTS.indexOf(b.name as never);
              return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            });
            return (
              <Link
                key={p.id}
                href={`/projects/${p.slug}/environments`}
                className={`block px-5 py-4 hover:bg-neutral-50 ${i > 0 ? "border-t border-black/10" : ""}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 font-mono">
                      {p.slug} · {p._count.prompts} prompt
                      {p._count.prompts === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {orderedEnvs.length === 0 ? (
                      <span className="text-xs text-neutral-400 italic">no envs</span>
                    ) : (
                      orderedEnvs.map((env) => (
                        <span
                          key={env.id}
                          className="text-[10px] font-mono uppercase px-1.5 py-0.5 border border-black/20 bg-white"
                          title={`${env.promptEnvironments.length} active`}
                        >
                          {env.name}
                          <span className="ml-1 text-neutral-500">
                            {env.promptEnvironments.length}
                          </span>
                        </span>
                      ))
                    )}
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
