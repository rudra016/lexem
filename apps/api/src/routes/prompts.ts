import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db.js";

export const prompts = new Hono();

const CreatePrompt = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

const UpdatePrompt = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().nullable().optional(),
});

prompts.get("/", async (c) => {
  const projectId = c.req.query("projectId");
  const rows = await prisma.prompt.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { currentVersion: true },
  });
  return c.json(rows);
});

prompts.post("/", async (c) => {
  const body = CreatePrompt.parse(await c.req.json());
  const row = await prisma.prompt.create({ data: body });
  return c.json(row, 201);
});

prompts.get("/:id", async (c) => {
  const row = await prisma.prompt.findUnique({
    where: { id: c.req.param("id") },
    include: { currentVersion: true },
  });
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json(row);
});

prompts.patch("/:id", async (c) => {
  const body = UpdatePrompt.parse(await c.req.json());
  const row = await prisma.prompt.update({ where: { id: c.req.param("id") }, data: body });
  return c.json(row);
});

prompts.delete("/:id", async (c) => {
  await prisma.prompt.delete({ where: { id: c.req.param("id") } });
  return c.body(null, 204);
});
