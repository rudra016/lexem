"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Provider } from "@lexem/db";
import { requireUser, getUserTeams } from "@/lib/session";
import { requireRole } from "@/lib/authz";
import { rethrowAsFriendly } from "@/lib/errors";
import { encrypt } from "@/lib/crypto";

async function getActiveTeamId(userId: string) {
  const teams = await getUserTeams(userId);
  if (teams.length === 0) throw new Error("No team found");
  return teams[0].id;
}

async function getActiveTeamIdAtLeast(userId: string, minRole: "EDITOR" | "ADMIN" | "OWNER") {
  const teamId = await getActiveTeamId(userId);
  await requireRole(userId, teamId, minRole);
  return teamId;
}

const ProviderEnum = z.enum(["OPENAI", "ANTHROPIC", "GOOGLE"]);

const CreateProviderKeyInput = z.object({
  provider: ProviderEnum,
  label: z.string().min(1).max(40),
  apiKey: z.string().min(10),
  defaultModel: z.string().max(80).optional().nullable(),
});

export async function createProviderKeyAction(
  input: z.infer<typeof CreateProviderKeyInput>,
) {
  const user = await requireUser();
  const parsed = CreateProviderKeyInput.parse(input);
  const teamId = await getActiveTeamIdAtLeast(user.id, "ADMIN");

  try {
    await prisma.providerKey.create({
      data: {
        teamId,
        provider: parsed.provider as Provider,
        label: parsed.label,
        encryptedKey: encrypt(parsed.apiKey),
        defaultModel: parsed.defaultModel || null,
        createdById: user.id,
      },
    });
  } catch (e) {
    rethrowAsFriendly(e);
  }

  revalidatePath("/settings");
}

const UpdateProviderKeyInput = z.object({
  id: z.string(),
  label: z.string().min(1).max(40).optional(),
  apiKey: z.string().min(10).optional(),
  defaultModel: z.string().max(80).optional().nullable(),
});

export async function updateProviderKeyAction(
  input: z.infer<typeof UpdateProviderKeyInput>,
) {
  const user = await requireUser();
  const parsed = UpdateProviderKeyInput.parse(input);
  const teamId = await getActiveTeamIdAtLeast(user.id, "ADMIN");

  const data: Record<string, unknown> = {};
  if (parsed.label !== undefined) data.label = parsed.label;
  if (parsed.apiKey !== undefined) data.encryptedKey = encrypt(parsed.apiKey);
  if (parsed.defaultModel !== undefined) data.defaultModel = parsed.defaultModel || null;

  try {
    await prisma.providerKey.updateMany({
      where: { id: parsed.id, teamId },
      data,
    });
  } catch (e) {
    rethrowAsFriendly(e);
  }
  revalidatePath("/settings");
}

const DeleteProviderKeyInput = z.object({ id: z.string() });

export async function deleteProviderKeyAction(
  input: z.infer<typeof DeleteProviderKeyInput>,
) {
  const user = await requireUser();
  const parsed = DeleteProviderKeyInput.parse(input);
  const teamId = await getActiveTeamIdAtLeast(user.id, "ADMIN");

  await prisma.providerKey.deleteMany({ where: { id: parsed.id, teamId } });
  revalidatePath("/settings");
}
