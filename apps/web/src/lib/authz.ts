import { prisma, TeamRole } from "@lexem/db";
import { notFound } from "next/navigation";

export const ROLE_RANK: Record<TeamRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

export const ROLE_LABEL: Record<TeamRole, string> = {
  VIEWER: "Viewer",
  EDITOR: "Editor",
  ADMIN: "Admin",
  OWNER: "Owner",
};

export class PermissionError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "PermissionError";
  }
}

export async function getMembershipForTeam(userId: string, teamId: string) {
  return prisma.teamMember.findFirst({ where: { userId, teamId } });
}

export async function requireRole(
  userId: string,
  teamId: string,
  minRole: TeamRole,
) {
  const m = await getMembershipForTeam(userId, teamId);
  if (!m) throw new PermissionError("You're not a member of this team.");
  if (ROLE_RANK[m.role] < ROLE_RANK[minRole]) {
    throw new PermissionError(
      `This action requires the ${ROLE_LABEL[minRole]} role or higher.`,
    );
  }
  return m;
}

/**
 * Can `actor` change the role of (or remove) `target`?
 * Rules:
 *  - actor must be ADMIN or OWNER
 *  - actor must outrank target strictly (no peer-modify)
 *  - OWNER can demote ADMIN; ADMIN cannot touch ADMIN or OWNER
 */
export function canManageMember(actor: TeamRole, target: TeamRole): boolean {
  if (ROLE_RANK[actor] < ROLE_RANK.ADMIN) return false;
  return ROLE_RANK[actor] > ROLE_RANK[target];
}

/**
 * The maximum role an actor can assign to a managed member. Cannot exceed
 * actor's own rank − 1, except OWNER who can assign up to ADMIN (owners are
 * promoted via a separate ownership-transfer flow, not implemented here).
 */
export function maxAssignableRole(actor: TeamRole): TeamRole {
  switch (actor) {
    case "OWNER":
      return "ADMIN";
    case "ADMIN":
      return "EDITOR";
    default:
      return "VIEWER";
  }
}

export async function getProjectForUser(userId: string, slug: string) {
  const project = await prisma.project.findFirst({
    where: { slug, team: { members: { some: { userId } } } },
  });
  if (!project) notFound();
  const membership = await getMembershipForTeam(userId, project.teamId);
  if (!membership) notFound();
  return { ...project, role: membership.role };
}

export async function getPromptForUser(
  userId: string,
  projectSlug: string,
  promptSlug: string,
) {
  const prompt = await prisma.prompt.findFirst({
    where: {
      slug: promptSlug,
      project: {
        slug: projectSlug,
        team: { members: { some: { userId } } },
      },
    },
    include: { currentVersion: true, project: true },
  });
  if (!prompt) notFound();
  const membership = await getMembershipForTeam(userId, prompt.project.teamId);
  if (!membership) notFound();
  return { ...prompt, role: membership.role };
}

export async function requireProjectRole(
  userId: string,
  projectSlug: string,
  minRole: TeamRole,
) {
  const project = await getProjectForUser(userId, projectSlug);
  if (ROLE_RANK[project.role] < ROLE_RANK[minRole]) {
    throw new PermissionError(
      `This action requires the ${ROLE_LABEL[minRole]} role or higher.`,
    );
  }
  return project;
}

export async function requirePromptRole(
  userId: string,
  projectSlug: string,
  promptSlug: string,
  minRole: TeamRole,
) {
  const prompt = await getPromptForUser(userId, projectSlug, promptSlug);
  if (ROLE_RANK[prompt.role] < ROLE_RANK[minRole]) {
    throw new PermissionError(
      `This action requires the ${ROLE_LABEL[minRole]} role or higher.`,
    );
  }
  return prompt;
}
