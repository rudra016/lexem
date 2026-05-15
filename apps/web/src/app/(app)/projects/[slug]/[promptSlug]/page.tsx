import { requireUser } from "@/lib/session";
import { getPromptForUser } from "@/lib/authz";
import { PromptEditor } from "@/components/prompt-editor";
import { VersionHistory } from "@/components/version-history";
import { prisma } from "@lexem/db";
import Link from "next/link";

export default async function PromptPage({
  params,
}: {
  params: Promise<{ slug: string; promptSlug: string }>;
}) {
  const { slug, promptSlug } = await params;
  const user = await requireUser();
  const prompt = await getPromptForUser(user.id, slug, promptSlug);

  const versions = await prisma.version.findMany({
    where: { promptId: prompt.id },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, email: true } },
      tags: { select: { id: true, name: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <div className="text-xs text-neutral-500 mb-2">
        <Link href="/" className="hover:underline">Projects</Link>
        <span className="mx-2">/</span>
        <Link href={`/projects/${slug}`} className="hover:underline">{prompt.project.slug}</Link>
        <span className="mx-2">/</span>
        <span>{prompt.slug}</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{prompt.name}</h1>
        {prompt.description && (
          <p className="text-sm text-neutral-500 mt-1">{prompt.description}</p>
        )}
      </div>

      <PromptEditor
        projectSlug={slug}
        promptSlug={promptSlug}
        initialContent={prompt.currentVersion?.content ?? ""}
        hasVersion={Boolean(prompt.currentVersion)}
      />

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Versions</h2>
        <VersionHistory
          versions={versions.map((v) => ({
            id: v.id,
            commitMessage: v.commitMessage,
            content: v.content,
            createdAt: v.createdAt.toISOString(),
            author: v.author,
            tags: v.tags,
          }))}
          currentVersionId={prompt.currentVersionId}
          projectSlug={slug}
          promptSlug={promptSlug}
        />
      </div>
    </div>
  );
}
