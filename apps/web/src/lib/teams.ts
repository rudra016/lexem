import { prisma, TeamRole } from "@lexem/db";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function ensurePersonalTeam(userId: string, hint: string) {
  const existing = await prisma.teamMember.findFirst({ where: { userId } });
  if (existing) return existing.teamId;

  const base = slugify(hint) || "personal";
  let slug = base;
  for (let i = 0; await prisma.team.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i + 1}`;
  }

  const team = await prisma.team.create({
    data: {
      name: "Personal",
      slug,
      members: { create: { userId, role: TeamRole.OWNER } },
    },
  });
  return team.id;
}
