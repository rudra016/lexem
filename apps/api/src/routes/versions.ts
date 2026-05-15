import { Hono } from "hono";
import { z } from "zod";
import type { Prisma } from "@lexem/db";
import { prisma } from "../db.js";

export const versions = new Hono();

const CreateVersion = z.object({
  promptId: z.string(),
  content: z.string(),
  commitMessage: z.string().min(1),
  branchName: z.string().default("main"),
  parentVersionId: z.string().optional(),
  authorId: z.string().optional(),
  variables: z.record(z.unknown()).optional(),
});

versions.get("/", async (c) => {
  const promptId = c.req.query("promptId");
  if (!promptId) return c.json({ error: "promptId required" }, 400);
  const rows = await prisma.version.findMany({
    where: { promptId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  return c.json(rows);
});

versions.post("/", async (c) => {
  const body = CreateVersion.parse(await c.req.json());

  const data: Prisma.VersionUncheckedCreateInput = {
    ...body,
    variables: body.variables as Prisma.InputJsonValue | undefined,
  };

  const created = await prisma.$transaction(async (tx) => {
    const v = await tx.version.create({ data });
    await tx.prompt.update({
      where: { id: data.promptId },
      data: { currentVersionId: v.id },
    });
    return v;
  });

  return c.json(created, 201);
});

versions.get("/:id", async (c) => {
  const row = await prisma.version.findUnique({
    where: { id: c.req.param("id") },
    include: { author: { select: { id: true, name: true, email: true } }, tags: true },
  });
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json(row);
});
