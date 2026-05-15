import { requireUser } from "@/lib/session";
import { getProjectForUser } from "@/lib/authz";
import { prisma } from "@lexem/db";
import { CreatePromptDialog } from "@/components/create-prompt-dialog";
import Link from "next/link";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const project = await getProjectForUser(user.id, slug);

  const prompts = await prisma.prompt.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    include: { currentVersion: { select: { commitMessage: true, createdAt: true } } },
  });

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="text-xs text-neutral-500 mb-2">
        <Link href="/dashboard" className="hover:underline">Projects</Link>
        <span className="mx-2">/</span>
        <span>{project.slug}</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{project.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">{prompts.length} prompt{prompts.length === 1 ? "" : "s"}</p>
        </div>
        <CreatePromptDialog projectSlug={project.slug} />
      </div>

      {prompts.length === 0 ? (
        <div className="bg-white border border-dashed border-black/30 p-12 text-center">
          <div className="text-lg font-medium mb-1">No prompts yet</div>
          <p className="text-sm text-neutral-500">Add a prompt to start versioning it.</p>
        </div>
      ) : (
        <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000]">
          {prompts.map((p, i) => (
            <Link
              key={p.id}
              href={`/projects/${project.slug}/${p.slug}`}
              className={`block px-5 py-4 hover:bg-neutral-50 ${i > 0 ? "border-t border-neutral-200" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5 font-mono">{p.slug}</div>
                </div>
                <div className="text-xs text-neutral-500 text-right">
                  {p.currentVersion ? (
                    <>
                      <div>{p.currentVersion.commitMessage}</div>
                      <div className="mt-0.5">
                        {new Date(p.currentVersion.createdAt).toLocaleDateString()}
                      </div>
                    </>
                  ) : (
                    <span className="italic">no versions</span>
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
