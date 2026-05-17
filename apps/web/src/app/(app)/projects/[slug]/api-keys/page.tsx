import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getProjectForUser, ROLE_RANK } from "@/lib/authz";
import { prisma } from "@lexem/db";
import { ApiKeysPanel } from "@/components/api-keys-panel";

export default async function ProjectApiKeysPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const project = await getProjectForUser(user.id, slug);
  const canManage = ROLE_RANK[project.role] >= ROLE_RANK.ADMIN;

  const keys = await prisma.apiKey.findMany({
    where: { projectId: project.id },
    orderBy: [{ revokedAt: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <div className="text-xs text-neutral-500 mb-2">
        <Link href="/dashboard" className="hover:underline">Projects</Link>
        <span className="mx-2">/</span>
        <Link href={`/projects/${project.slug}`} className="hover:underline">{project.slug}</Link>
        <span className="mx-2">/</span>
        <span>api keys</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">API keys</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Use these to fetch prompts from the Lexem SDK. Keys are scoped to this
          project and only shown once on creation.
        </p>
      </div>

      {!canManage && (
        <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-300 text-sm text-amber-900">
          Only project admins and owners can generate or revoke keys.
        </div>
      )}

      <ApiKeysPanel
        projectSlug={project.slug}
        canManage={canManage}
        keys={keys.map((k) => ({
          id: k.id,
          name: k.name,
          prefix: k.prefix,
          createdAt: k.createdAt.toISOString(),
          lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
          revokedAt: k.revokedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
