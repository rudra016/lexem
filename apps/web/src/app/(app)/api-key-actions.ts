"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@lexem/db";
import { requireUser } from "@/lib/session";
import { requireProjectRole } from "@/lib/authz";
import { generateApiKey } from "@/lib/api-keys";

const CreateInput = z.object({
  projectSlug: z.string(),
  name: z.string().min(1).max(60),
});

export async function createApiKeyAction(input: z.infer<typeof CreateInput>) {
  const user = await requireUser();
  const parsed = CreateInput.parse(input);
  const project = await requireProjectRole(user.id, parsed.projectSlug, "ADMIN");

  const { raw, hashed, prefix } = generateApiKey();

  await prisma.apiKey.create({
    data: {
      projectId: project.id,
      name: parsed.name.trim(),
      hashedKey: hashed,
      prefix,
    },
  });

  revalidatePath(`/projects/${parsed.projectSlug}/api-keys`);
  // The raw key is returned exactly once; it cannot be retrieved later.
  return { raw, prefix };
}

const RevokeInput = z.object({
  projectSlug: z.string(),
  keyId: z.string(),
});

export async function revokeApiKeyAction(input: z.infer<typeof RevokeInput>) {
  const user = await requireUser();
  const parsed = RevokeInput.parse(input);
  const project = await requireProjectRole(user.id, parsed.projectSlug, "ADMIN");

  await prisma.apiKey.updateMany({
    where: { id: parsed.keyId, projectId: project.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  revalidatePath(`/projects/${parsed.projectSlug}/api-keys`);
}
