"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma, TeamRole } from "@lexem/db";
import { requireUser } from "@/lib/session";
import {
  canManageMember,
  getMembershipForTeam,
  maxAssignableRole,
  PermissionError,
  ROLE_RANK,
} from "@/lib/authz";

const ROLE_VALUES = ["VIEWER", "EDITOR", "ADMIN", "OWNER"] as const;
const RoleEnum = z.enum(ROLE_VALUES);

async function requireActor(userId: string, teamId: string) {
  const m = await getMembershipForTeam(userId, teamId);
  if (!m) throw new PermissionError("You're not a member of this team.");
  if (ROLE_RANK[m.role] < ROLE_RANK.ADMIN) {
    throw new PermissionError("Only admins and owners can manage members.");
  }
  return m;
}

// ---------- Team ----------

const RenameTeamInput = z.object({
  teamId: z.string(),
  name: z.string().min(1).max(60),
});

export async function renameTeamAction(
  input: z.infer<typeof RenameTeamInput>,
) {
  const user = await requireUser();
  const parsed = RenameTeamInput.parse(input);
  await requireActor(user.id, parsed.teamId);

  await prisma.team.update({
    where: { id: parsed.teamId },
    data: { name: parsed.name.trim() },
  });
  revalidatePath("/settings");
}

// ---------- Members ----------

const UpdateMemberRoleInput = z.object({
  teamId: z.string(),
  memberId: z.string(),
  role: RoleEnum,
});

export async function updateMemberRoleAction(
  input: z.infer<typeof UpdateMemberRoleInput>,
) {
  const user = await requireUser();
  const parsed = UpdateMemberRoleInput.parse(input);
  const actor = await requireActor(user.id, parsed.teamId);

  const target = await prisma.teamMember.findFirst({
    where: { id: parsed.memberId, teamId: parsed.teamId },
  });
  if (!target) throw new Error("Member not found");
  if (!canManageMember(actor.role, target.role)) {
    throw new PermissionError("You can't manage this member.");
  }
  if (ROLE_RANK[parsed.role] > ROLE_RANK[maxAssignableRole(actor.role)]) {
    throw new PermissionError(
      `You can assign roles up to ${maxAssignableRole(actor.role)}.`,
    );
  }
  if (target.userId === user.id) {
    throw new PermissionError("You can't change your own role.");
  }

  await prisma.teamMember.update({
    where: { id: target.id },
    data: { role: parsed.role as TeamRole },
  });
  revalidatePath("/settings");
}

const RemoveMemberInput = z.object({
  teamId: z.string(),
  memberId: z.string(),
});

export async function removeMemberAction(
  input: z.infer<typeof RemoveMemberInput>,
) {
  const user = await requireUser();
  const parsed = RemoveMemberInput.parse(input);
  const actor = await requireActor(user.id, parsed.teamId);

  const target = await prisma.teamMember.findFirst({
    where: { id: parsed.memberId, teamId: parsed.teamId },
  });
  if (!target) throw new Error("Member not found");
  if (target.userId === user.id) {
    throw new PermissionError("You can't remove yourself.");
  }
  if (!canManageMember(actor.role, target.role)) {
    throw new PermissionError("You can't remove this member.");
  }

  await prisma.teamMember.delete({ where: { id: target.id } });
  revalidatePath("/settings");
}

// ---------- Invites ----------

const CreateInviteInput = z.object({
  teamId: z.string(),
  email: z.string().email().max(120),
  role: RoleEnum,
});

const INVITE_TTL_DAYS = 7;

export async function createInviteAction(
  input: z.infer<typeof CreateInviteInput>,
) {
  const user = await requireUser();
  const parsed = CreateInviteInput.parse(input);
  const actor = await requireActor(user.id, parsed.teamId);

  if (ROLE_RANK[parsed.role] > ROLE_RANK[maxAssignableRole(actor.role)]) {
    throw new PermissionError(
      `You can invite up to ${maxAssignableRole(actor.role)}.`,
    );
  }

  // If the email is already a member, bail early.
  const existing = await prisma.teamMember.findFirst({
    where: {
      teamId: parsed.teamId,
      user: { email: { equals: parsed.email, mode: "insensitive" } },
    },
  });
  if (existing) {
    throw new Error("That email is already on this team.");
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const invite = await prisma.teamInvite.create({
    data: {
      teamId: parsed.teamId,
      email: parsed.email.toLowerCase(),
      role: parsed.role as TeamRole,
      token,
      expiresAt,
    },
  });

  revalidatePath("/settings");
  return { id: invite.id, token, expiresAt: expiresAt.toISOString() };
}

const RevokeInviteInput = z.object({
  teamId: z.string(),
  inviteId: z.string(),
});

export async function revokeInviteAction(
  input: z.infer<typeof RevokeInviteInput>,
) {
  const user = await requireUser();
  const parsed = RevokeInviteInput.parse(input);
  await requireActor(user.id, parsed.teamId);

  await prisma.teamInvite.deleteMany({
    where: { id: parsed.inviteId, teamId: parsed.teamId },
  });
  revalidatePath("/settings");
}

// ---------- Accept ----------

const AcceptInviteInput = z.object({
  token: z.string().min(1),
});

export async function acceptInviteAction(
  input: z.infer<typeof AcceptInviteInput>,
) {
  const user = await requireUser();
  const parsed = AcceptInviteInput.parse(input);

  const invite = await prisma.teamInvite.findUnique({
    where: { token: parsed.token },
  });
  if (!invite) throw new Error("This invite is invalid or has been used.");
  if (invite.expiresAt < new Date()) {
    throw new Error("This invite has expired.");
  }
  if (user.email && user.email.toLowerCase() !== invite.email) {
    throw new Error(
      `This invite is for ${invite.email}. Sign in as that user to accept.`,
    );
  }

  const already = await prisma.teamMember.findFirst({
    where: { teamId: invite.teamId, userId: user.id },
  });
  if (already) {
    await prisma.teamInvite.delete({ where: { id: invite.id } });
    return { teamId: invite.teamId, alreadyMember: true };
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: invite.teamId,
        userId: user.id,
        role: invite.role,
      },
    }),
    prisma.teamInvite.delete({ where: { id: invite.id } }),
  ]);

  return { teamId: invite.teamId, alreadyMember: false };
}
