"use client";

import { useState, useTransition } from "react";
import { Copy, Trash2 } from "lucide-react";
import {
  updateMemberRoleAction,
  removeMemberAction,
  createInviteAction,
  revokeInviteAction,
} from "@/app/(app)/team-actions";
import { Spinner } from "@/components/spinner";

type Role = "VIEWER" | "EDITOR" | "ADMIN" | "OWNER";

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

const ROLE_LABEL: Record<Role, string> = {
  VIEWER: "Viewer",
  EDITOR: "Editor",
  ADMIN: "Admin",
  OWNER: "Owner",
};

type Member = {
  id: string;
  userId: string;
  role: Role;
  name: string | null;
  email: string;
  image: string | null;
  isYou: boolean;
};

type Invite = {
  id: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
};

export function MembersClient({
  teamId,
  myRole,
  members,
  invites,
  baseUrl,
}: {
  teamId: string;
  myRole: Role;
  members: Member[];
  invites: Invite[];
  baseUrl: string;
}) {
  const canManage = ROLE_RANK[myRole] >= ROLE_RANK.ADMIN;
  const maxAssign: Role =
    myRole === "OWNER" ? "ADMIN" : myRole === "ADMIN" ? "EDITOR" : "VIEWER";

  const assignableRoles: Role[] = (["VIEWER", "EDITOR", "ADMIN", "OWNER"] as Role[])
    .filter((r) => ROLE_RANK[r] <= ROLE_RANK[maxAssign]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000]">
        {members.map((m, i) => (
          <MemberRow
            key={m.id}
            teamId={teamId}
            member={m}
            myRole={myRole}
            assignableRoles={assignableRoles}
            divider={i > 0}
          />
        ))}
      </div>

      {canManage && (
        <InviteSection
          teamId={teamId}
          assignableRoles={assignableRoles}
          invites={invites}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
}

function MemberRow({
  teamId,
  member,
  myRole,
  assignableRoles,
  divider,
}: {
  teamId: string;
  member: Member;
  myRole: Role;
  assignableRoles: Role[];
  divider: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const canModify =
    !member.isYou &&
    ROLE_RANK[myRole] >= ROLE_RANK.ADMIN &&
    ROLE_RANK[myRole] > ROLE_RANK[member.role];

  function changeRole(next: Role) {
    if (next === member.role) return;
    setError(null);
    start(async () => {
      try {
        await updateMemberRoleAction({
          teamId,
          memberId: member.id,
          role: next,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function remove() {
    if (!confirm(`Remove ${member.name ?? member.email}?`)) return;
    setError(null);
    start(async () => {
      try {
        await removeMemberAction({ teamId, memberId: member.id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div
      className={`px-5 py-3 flex items-center justify-between gap-4 ${divider ? "border-t border-black/10" : ""}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {member.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.image}
            alt=""
            className="w-7 h-7 object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="w-7 h-7 bg-neutral-200 text-neutral-700 text-xs flex items-center justify-center shrink-0 font-medium">
            {(member.name ?? member.email)[0]?.toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">
            {member.name ?? member.email}
            {member.isYou && (
              <span className="ml-2 text-[10px] font-mono uppercase text-neutral-500">
                you
              </span>
            )}
          </div>
          {member.name && (
            <div className="text-xs text-neutral-500 truncate">{member.email}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {error && <span className="text-xs text-red-600">{error}</span>}
        {pending && <Spinner size={12} />}
        {canModify ? (
          <select
            value={member.role}
            onChange={(e) => changeRole(e.target.value as Role)}
            disabled={pending}
            className="text-xs px-2 py-1 border border-neutral-300 bg-white"
          >
            {assignableRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
            {/* Always show current role even if not directly assignable */}
            {!assignableRoles.includes(member.role) && (
              <option value={member.role} disabled>
                {ROLE_LABEL[member.role]}
              </option>
            )}
          </select>
        ) : (
          <span className="text-xs font-mono uppercase px-1.5 py-0.5 border border-black/20">
            {ROLE_LABEL[member.role]}
          </span>
        )}
        {canModify && (
          <button
            onClick={remove}
            disabled={pending}
            title="Remove from team"
            className="p-1.5 text-neutral-500 hover:text-red-700 hover:bg-neutral-100 disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function InviteSection({
  teamId,
  assignableRoles,
  invites,
  baseUrl,
}: {
  teamId: string;
  assignableRoles: Role[];
  invites: Invite[];
  baseUrl: string;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(
    assignableRoles.includes("EDITOR") ? "EDITOR" : assignableRoles[0],
  );
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedLink(null);
    start(async () => {
      try {
        const res = await createInviteAction({ teamId, email, role });
        setCreatedLink(`${baseUrl}/invite/${res.token}`);
        setEmail("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Invite a teammate</h3>
      <form
        onSubmit={submit}
        className="bg-white border border-black/10 shadow-[6px_6px_0px_#000] p-4 space-y-3"
      >
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            className="flex-1 px-3 py-2 border border-neutral-300 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="text-sm px-2 py-1 border border-neutral-300 bg-white"
          >
            {assignableRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending || !email}
            className="h-9 px-4 bg-black text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
          >
            {pending && <Spinner size={14} />}
            Generate link
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {createdLink && <CopyLink link={createdLink} />}
      </form>

      {invites.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Pending invites</h3>
          <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000]">
            {invites.map((inv, i) => (
              <InviteRow
                key={inv.id}
                teamId={teamId}
                invite={inv}
                baseUrl={baseUrl}
                divider={i > 0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InviteRow({
  teamId,
  invite,
  baseUrl,
  divider,
}: {
  teamId: string;
  invite: Invite;
  baseUrl: string;
  divider: boolean;
}) {
  const [pending, start] = useTransition();
  const link = `${baseUrl}/invite/${invite.token}`;

  function revoke() {
    if (!confirm(`Revoke invite for ${invite.email}?`)) return;
    start(async () => {
      await revokeInviteAction({ teamId, inviteId: invite.id });
    });
  }

  return (
    <div
      className={`px-5 py-3 flex items-center justify-between gap-4 ${divider ? "border-t border-black/10" : ""}`}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{invite.email}</div>
        <div className="text-xs text-neutral-500 mt-0.5">
          {ROLE_LABEL[invite.role]} · expires{" "}
          {new Date(invite.expiresAt).toLocaleDateString()}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <CopyLink link={link} compact />
        <button
          onClick={revoke}
          disabled={pending}
          title="Revoke invite"
          className="p-1.5 text-neutral-500 hover:text-red-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function CopyLink({ link, compact }: { link: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (compact) {
    return (
      <button
        onClick={copy}
        className="h-7 px-2 border border-black/20 bg-white text-xs inline-flex items-center gap-1 hover:bg-neutral-50"
      >
        <Copy size={12} />
        {copied ? "Copied" : "Copy link"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono">
      <span className="truncate flex-1">{link}</span>
      <button
        onClick={copy}
        className="shrink-0 h-7 px-2 border border-black/20 bg-white inline-flex items-center gap-1 hover:bg-white"
      >
        <Copy size={12} />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
