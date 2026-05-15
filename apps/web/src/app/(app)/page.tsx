import { requireUser, getUserTeams } from "@/lib/session";
import { prisma } from "@lexem/db";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();
  const teams = await getUserTeams(user.id);
  const teamIds = teams.map((t) => t.id);

  const projects = await prisma.project.findMany({
    where: { teamId: { in: teamIds } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { prompts: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-neutral-500 mt-1">
            A project groups related prompts for one product or team.
          </p>
        </div>
        <CreateProjectDialog teamId={teams[0]?.id} />
      </div>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className="block bg-white border border-neutral-200 rounded-xl p-5 hover:border-neutral-400 transition"
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{p.slug}</div>
              <div className="text-sm text-neutral-600 mt-4">
                {p._count.prompts} prompt{p._count.prompts === 1 ? "" : "s"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-12 text-center">
      <div className="text-lg font-medium mb-1">No projects yet</div>
      <p className="text-sm text-neutral-500 max-w-md mx-auto">
        Create your first project to start versioning prompts.
      </p>
    </div>
  );
}
