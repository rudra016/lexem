import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@lexem/db";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function getUserTeams(userId: string) {
  return prisma.team.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "asc" },
  });
}
