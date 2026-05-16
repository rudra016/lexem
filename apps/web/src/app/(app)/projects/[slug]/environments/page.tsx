import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getProjectForUser } from "@/lib/authz";
import { prisma } from "@lexem/db";
import {
  DEFAULT_ENVIRONMENTS,
  ensureDefaultEnvironments,
  previousEnvInChain,
} from "@/lib/environments";
import { PromoteDialog } from "@/components/promote-dialog";
import { EnvApprovalToggle } from "@/components/env-approval-toggle";
import { DeploymentReviewButtons } from "@/components/deployment-review";

export default async function ProjectEnvironmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const project = await getProjectForUser(user.id, slug);

  await ensureDefaultEnvironments(project.id);

  const [environments, prompts, pendingDeployments] = await Promise.all([
    prisma.environment.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.prompt.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            commitMessage: true,
            createdAt: true,
            branchName: true,
          },
        },
        promptEnvironments: {
          include: {
            environment: { select: { name: true } },
            activeVersion: {
              select: { id: true, commitMessage: true, createdAt: true },
            },
          },
        },
        deployments: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            environment: { select: { name: true } },
          },
        },
      },
    }),
    prisma.deployment.findMany({
      where: {
        status: "PENDING_APPROVAL",
        environment: { projectId: project.id },
      },
      orderBy: { createdAt: "asc" },
      include: {
        environment: { select: { name: true } },
        prompt: { select: { name: true, slug: true } },
        version: {
          select: {
            id: true,
            commitMessage: true,
            branchName: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  const envByName = new Map(environments.map((e) => [e.name, e]));
  const orderedEnvNames = [
    ...DEFAULT_ENVIRONMENTS.filter((n) => envByName.has(n)),
    ...environments
      .map((e) => e.name)
      .filter((n) => !DEFAULT_ENVIRONMENTS.includes(n as never)),
  ];

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="text-xs text-neutral-500 mb-2">
        <Link href="/dashboard" className="hover:underline">Projects</Link>
        <span className="mx-2">/</span>
        <Link href={`/projects/${project.slug}`} className="hover:underline">{project.slug}</Link>
        <span className="mx-2">/</span>
        <span>environments</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Environments</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Promote versions through <span className="font-mono">dev → staging → production</span>.
          Toggle approval on any env to require sign-off before deploys go live.
        </p>
      </div>

      {pendingDeployments.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            Pending approvals
            <span className="ml-2 text-xs font-normal text-neutral-500">
              ({pendingDeployments.length})
            </span>
          </h2>
          <div className="bg-white border border-amber-300 shadow-[6px_6px_0px_#000]">
            {pendingDeployments.map((d, i) => (
              <div
                key={d.id}
                className={`px-5 py-4 flex items-center justify-between gap-4 ${i > 0 ? "border-t border-black/10" : ""}`}
              >
                <div className="min-w-0">
                  <div className="text-sm">
                    <span className="font-medium">{d.prompt.name}</span>
                    <span className="text-neutral-500"> → </span>
                    <span className="font-mono">{d.environment.name}</span>
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5 truncate">
                    {d.version.commitMessage}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
                    {d.version.branchName} · {d.version.id.slice(-7)} ·{" "}
                    requested {new Date(d.createdAt).toLocaleString()}
                  </div>
                </div>
                <DeploymentReviewButtons
                  projectSlug={project.slug}
                  deploymentId={d.id}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {prompts.length === 0 ? (
        <div className="bg-white border border-dashed border-black/30 p-12 text-center">
          <div className="text-lg font-medium mb-1">No prompts yet</div>
          <p className="text-sm text-neutral-500">
            Add a prompt to the project before promoting versions.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 bg-neutral-50">
                <th className="text-left font-semibold px-5 py-3 w-1/4 min-w-[180px]">
                  Prompt
                </th>
                {orderedEnvNames.map((name) => {
                  const env = envByName.get(name)!;
                  return (
                    <th
                      key={name}
                      className="text-left font-semibold px-5 py-3 min-w-[220px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{name}</span>
                        <EnvApprovalToggle
                          projectSlug={project.slug}
                          environmentName={name}
                          requiresApproval={env.requiresApproval}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {prompts.map((p, rowIdx) => {
                const peByEnvName = new Map(
                  p.promptEnvironments.map((pe) => [pe.environment.name, pe]),
                );
                const lastDeployByEnv = new Map<string, Date>();
                for (const d of p.deployments) {
                  if (!lastDeployByEnv.has(d.environment.name)) {
                    lastDeployByEnv.set(d.environment.name, d.createdAt);
                  }
                }
                return (
                  <tr
                    key={p.id}
                    className={rowIdx > 0 ? "border-t border-black/10" : ""}
                  >
                    <td className="px-5 py-4 align-top">
                      <Link
                        href={`/projects/${project.slug}/${p.slug}`}
                        className="font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs text-neutral-500 mt-0.5 font-mono truncate">
                        {p.slug}
                      </div>
                    </td>
                    {orderedEnvNames.map((envName) => {
                      const env = envByName.get(envName)!;
                      const pe = peByEnvName.get(envName);
                      const active = pe?.activeVersion ?? null;
                      const lastDeploy = lastDeployByEnv.get(envName);
                      const prevName = previousEnvInChain(envName);
                      const prevActive = prevName
                        ? peByEnvName.get(prevName)?.activeVersionId ?? null
                        : null;
                      return (
                        <td
                          key={envName}
                          className="px-5 py-4 align-top border-l border-black/10"
                        >
                          {active ? (
                            <div>
                              <div className="text-sm font-medium truncate">
                                {active.commitMessage}
                              </div>
                              <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
                                {active.id.slice(-7)}
                                {lastDeploy && (
                                  <> · {new Date(lastDeploy).toLocaleDateString()}</>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-neutral-400 italic">
                              not deployed
                            </div>
                          )}
                          <div className="mt-2">
                            <PromoteDialog
                              projectSlug={project.slug}
                              environmentName={envName}
                              promptId={p.id}
                              promptName={p.name}
                              activeVersionId={active?.id ?? null}
                              versions={p.versions.map((v) => ({
                                id: v.id,
                                commitMessage: v.commitMessage,
                                createdAt: v.createdAt.toISOString(),
                                branchName: v.branchName,
                              }))}
                              triggerLabel={active ? "Change version" : "Promote"}
                              requiresApproval={env.requiresApproval}
                              previousEnvName={prevName}
                              previousEnvActiveVersionId={prevActive}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
