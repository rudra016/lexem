import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db.js";

export const projects = new Hono();

const CreateProject = z.object({
  teamId: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
});

const UpdateProject = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
});

projects.get("/", async (c) => {
  const teamId = c.req.query("teamId");
  const rows = await prisma.project.findMany({
    where: teamId ? { teamId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return c.json(rows);
});

projects.post("/", async (c) => {
  const body = CreateProject.parse(await c.req.json());
  const row = await prisma.project.create({ data: body });
  return c.json(row, 201);
});

projects.get("/:id", async (c) => {
  const row = await prisma.project.findUnique({ where: { id: c.req.param("id") } });
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json(row);
});

projects.patch("/:id", async (c) => {
  const body = UpdateProject.parse(await c.req.json());
  const row = await prisma.project.update({ where: { id: c.req.param("id") }, data: body });
  return c.json(row);
});

projects.delete("/:id", async (c) => {
  await prisma.project.delete({ where: { id: c.req.param("id") } });
  return c.body(null, 204);
});
