import { Prisma } from "@lexem/db";

export class FriendlyError extends Error {
  readonly friendly = true;
}

const UNIQUE_FIELD_MESSAGES: Record<string, string> = {
  "Prompt_projectId_slug_key": "A prompt with that slug already exists in this project.",
  "Project_teamId_slug_key": "A project with that slug already exists in this team.",
  "Team_slug_key": "That team slug is taken.",
  "User_email_key": "An account with that email already exists.",
  "VersionTag_versionId_name_key": "That tag already exists on this version.",
  "Branch_promptId_name_key": "A branch with that name already exists on this prompt.",
};

export function rethrowAsFriendly(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string | string[] | undefined);
      const key = Array.isArray(target) ? target.join("_") : target ?? "";
      const msg =
        UNIQUE_FIELD_MESSAGES[key] ??
        `Value already in use${target ? ` (${Array.isArray(target) ? target.join(", ") : target})` : ""}.`;
      throw new FriendlyError(msg);
    }
    if (err.code === "P2025") {
      throw new FriendlyError("Record not found.");
    }
  }
  throw err;
}
