import { headers } from "next/headers";
import { requireUser, getUserTeams } from "@/lib/session";
import { prisma, TeamRole } from "@lexem/db";
import { ProviderKeysClient } from "@/components/provider-keys-client";
import { MembersClient } from "@/components/members-client";
import { TeamNameEdit } from "@/components/team-name-edit";
import {
  ROLE_LABEL,
  ROLE_RANK,
  getMembershipForTeam,
} from "@/lib/authz";

export default async function SettingsPage() {
  const user = await requireUser();
  const teams = await getUserTeams(user.id);
  const team = teams[0];

  const [keys, members, invites, myMembership] = await Promise.all([
    team
      ? prisma.providerKey.findMany({
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
      : Promise.resolve([]),
    team
      ? prisma.teamMember.findMany({
          where: { teamId: team.id },
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        })
      : Promise.resolve([]),
    team
      ? prisma.teamInvite.findMany({
          where: { teamId: team.id, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    team ? getMembershipForTeam(user.id, team.id) : Promise.resolve(null),
  ]);

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;

  const myRole: TeamRole = myMembership?.role ?? "VIEWER";

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
              <div>
                <span className="text-neutral-500">Team:</span>{" "}
                <TeamNameEdit
                  teamId={team.id}
                  name={team.name}
                  canEdit={ROLE_RANK[myRole] >= ROLE_RANK.ADMIN}
                />{" "}
                <span className="text-xs text-neutral-500 font-mono ml-1">
                  ({ROLE_LABEL[myRole]})
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {team && (
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-semibold">Members</h2>
            <p className="text-xs text-neutral-500">
              Admins manage members; Owners can promote to Admin.
            </p>
          </div>
          <MembersClient
            teamId={team.id}
            myRole={myRole}
            members={members.map((m) => ({
              id: m.id,
              userId: m.userId,
              role: m.role,
              name: m.user.name,
              email: m.user.email,
              image: m.user.image,
              isYou: m.userId === user.id,
            }))}
            invites={invites.map((i) => ({
              id: i.id,
              email: i.email,
              role: i.role,
              token: i.token,
              expiresAt: i.expiresAt.toISOString(),
            }))}
            baseUrl={baseUrl}
          />
        </section>
      )}

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
