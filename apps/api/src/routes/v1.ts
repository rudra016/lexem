import { Hono } from "hono";
import { prisma } from "../db.js";
import { bearerAuth, type BearerContext } from "../middleware/bearer.js";

export const v1 = new Hono<BearerContext>();

v1.use("*", bearerAuth);

/**
 * GET /v1/prompts/:slug
 *
 * Query:
 *  - env (optional): environment name (e.g. "production"). If omitted,
 *    returns the prompt's current main-branch head (the editor's notion
 *    of "current").
 *
 * Returns:
 *  - content, versionId, variables, env, fetchedAt
 */
v1.get("/prompts/:slug", async (c) => {
  const projectId = c.get("projectId");
  const slug = c.req.param("slug");
  const env = c.req.query("env") ?? null;

  const prompt = await prisma.prompt.findFirst({
    where: { projectId, slug },
    select: {
      id: true,
      currentVersion: {
        select: {
          id: true,
          content: true,
          variables: true,
        },
      },
    },
  });

  if (!prompt) {
    return c.json({ error: `Prompt "${slug}" not found in this project.` }, 404);
  }

  let versionRow: {
    id: string;
    content: string;
    variables: unknown;
  } | null;

  if (env) {
    const pe = await prisma.promptEnvironment.findFirst({
      where: {
        promptId: prompt.id,
        environment: { name: env, projectId },
      },
      select: {
        activeVersion: {
          select: { id: true, content: true, variables: true },
        },
      },
    });
    if (!pe?.activeVersion) {
      return c.json(
        {
          error: `Prompt "${slug}" has no active version in environment "${env}".`,
        },
        404,
      );
    }
    versionRow = pe.activeVersion;
  } else {
    if (!prompt.currentVersion) {
      return c.json(
        { error: `Prompt "${slug}" has no committed versions yet.` },
        404,
      );
    }
    versionRow = prompt.currentVersion;
  }

  return c.json({
    content: versionRow.content,
    versionId: versionRow.id,
    variables: versionRow.variables ?? null,
    env: env ?? "current",
    fetchedAt: new Date().toISOString(),
  });
});
