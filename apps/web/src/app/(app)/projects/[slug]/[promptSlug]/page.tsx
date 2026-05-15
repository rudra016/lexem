import { requireUser } from "@/lib/session";
import { getPromptForUser } from "@/lib/authz";
import { PromptEditor } from "@/components/prompt-editor";
import { VersionHistory } from "@/components/version-history";
import { BranchBar } from "@/components/branch-bar";
import { prisma } from "@lexem/db";
import { MAIN_BRANCH, ensureMainBranch, listBranches } from "@/lib/branches";
import Link from "next/link";

export default async function PromptPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; promptSlug: string }>;
  searchParams: Promise<{ branch?: string }>;
}) {
  const { slug, promptSlug } = await params;
  const { branch: branchParam } = await searchParams;
  const branchName = branchParam || MAIN_BRANCH;

  const user = await requireUser();
  const prompt = await getPromptForUser(user.id, slug, promptSlug);

  await ensureMainBranch(prompt.id, prompt.currentVersionId);
  const branches = await listBranches(prompt.id);
  const branch = branches.find((b) => b.name === branchName) ?? branches[0];

  const versions = await prisma.version.findMany({
    where: { promptId: prompt.id, branchName: branch.name },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, email: true } },
      tags: { select: { id: true, name: true }, orderBy: { createdAt: "asc" } },
    },
  });

  const initialContent = branch.head?.content ?? "";
  const isMain = branch.name === MAIN_BRANCH;

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div className="text-xs text-neutral-500 mb-2">
        <Link href="/dashboard" className="hover:underline">Projects</Link>
        <span className="mx-2">/</span>
        <Link href={`/projects/${slug}`} className="hover:underline">{prompt.project.slug}</Link>
        <span className="mx-2">/</span>
        <span>{prompt.slug}</span>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{prompt.name}</h1>
          {prompt.description && (
            <p className="text-sm text-neutral-500 mt-1">{prompt.description}</p>
          )}
        </div>
        <Link
          href={`/projects/${slug}/${promptSlug}/evals`}
          className="h-10 px-4 border border-black bg-white text-black text-sm font-medium inline-flex items-center gap-2 transition-colors hover:bg-black hover:text-white"
        >
          Evals →
        </Link>
      </div>

      <BranchBar
        projectSlug={slug}
        promptSlug={promptSlug}
        currentBranch={branch.name}
        branches={branches.map((b) => ({
          id: b.id,
          name: b.name,
          headId: b.headId,
          headContent: b.head?.content ?? "",
        }))}
        currentVersionId={prompt.currentVersionId}
      />

      <PromptEditor
        projectSlug={slug}
        promptSlug={promptSlug}
        branchName={branch.name}
        initialContent={initialContent}
        hasVersion={Boolean(branch.head)}
      />

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-3">
          Versions {!isMain && <span className="text-sm text-neutral-500 font-normal">on <span className="font-mono">{branch.name}</span></span>}
        </h2>
        <VersionHistory
          versions={versions.map((v) => ({
            id: v.id,
            commitMessage: v.commitMessage,
            content: v.content,
            createdAt: v.createdAt.toISOString(),
            author: v.author,
            tags: v.tags,
          }))}
          currentVersionId={branch.headId}
          projectSlug={slug}
          promptSlug={promptSlug}
        />
      </div>
    </div>
  );
}
