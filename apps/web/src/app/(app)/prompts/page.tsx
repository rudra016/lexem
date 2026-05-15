import { requireUser } from "@/lib/session";
import { prisma } from "@lexem/db";
import Link from "next/link";

export default async function PromptsPage() {
  const user = await requireUser();

  const prompts = await prisma.prompt.findMany({
    where: { project: { team: { members: { some: { userId: user.id } } } } },
    orderBy: { updatedAt: "desc" },
    include: {
      project: { select: { name: true, slug: true } },
      currentVersion: { select: { commitMessage: true, createdAt: true } },
      _count: { select: { versions: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">All prompts</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Across every project you have access to.
        </p>
      </div>

      {prompts.length === 0 ? (
        <div className="bg-white border border-dashed border-black/30 p-12 text-center">
          <div className="text-lg font-medium mb-1">No prompts yet</div>
          <p className="text-sm text-neutral-500">
            Open a project and add your first prompt.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000]">
          {prompts.map((p, i) => (
            <Link
              key={p.id}
              href={`/projects/${p.project.slug}/${p.slug}`}
              className={`block px-5 py-4 hover:bg-neutral-50 ${i > 0 ? "border-t border-neutral-200" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5 font-mono">
                    {p.project.slug} / {p.slug}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 text-right">
                  <div>{p._count.versions} version{p._count.versions === 1 ? "" : "s"}</div>
                  {p.currentVersion && (
                    <div className="mt-0.5">
                      {new Date(p.currentVersion.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
