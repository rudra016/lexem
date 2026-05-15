import { requireUser, getUserTeams } from "@/lib/session";
import { prisma } from "@lexem/db";
import { ProviderKeysClient } from "@/components/provider-keys-client";

export default async function SettingsPage() {
  const user = await requireUser();
  const teams = await getUserTeams(user.id);
  const team = teams[0];

  const keys = team
    ? await prisma.providerKey.findMany({
        where: { teamId: team.id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          provider: true,
          label: true,
          defaultModel: true,
          createdAt: true,
        },
      })
    : [];

  return (
    <div className="max-w-3xl mx-auto px-8 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Settings</h1>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Account</h2>
        <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000] p-6">
          <div className="text-sm text-neutral-700 space-y-1">
            <div><span className="text-neutral-500">Name:</span> {user.name ?? "—"}</div>
            <div><span className="text-neutral-500">Email:</span> {user.email}</div>
            {team && (
              <div><span className="text-neutral-500">Team:</span> {team.name}</div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold">Provider keys</h2>
          <p className="text-xs text-neutral-500">
            Keys are encrypted at rest and used to run evals.
          </p>
        </div>
        <ProviderKeysClient
          keys={keys.map((k) => ({
            id: k.id,
            provider: k.provider,
            label: k.label,
            defaultModel: k.defaultModel,
            createdAt: k.createdAt.toISOString(),
          }))}
        />
      </section>
    </div>
  );
}
