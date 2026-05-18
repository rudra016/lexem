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

/**
 * POST /v1/usage
 *
 * Report token usage for a prompt version that was actually run in the
 * caller's app. Powers the analytics dashboard.
 *
 * Body:
 *  - versionId  (required)  Version that was served (from the GET response).
 *  - tokensIn   (required)  Non-negative integer.
 *  - tokensOut  (required)  Non-negative integer.
 *  - env        (optional)  Environment name the version was fetched for.
 */
v1.post("/usage", async (c) => {
  const projectId = c.get("projectId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Body must be JSON." }, 400);
  }

  if (!body || typeof body !== "object") {
    return c.json({ error: "Body must be a JSON object." }, 400);
  }
  const b = body as Record<string, unknown>;
  const versionId = typeof b.versionId === "string" ? b.versionId : null;
  const tokensIn = typeof b.tokensIn === "number" ? b.tokensIn : null;
  const tokensOut = typeof b.tokensOut === "number" ? b.tokensOut : null;
  const env = typeof b.env === "string" && b.env.length > 0 ? b.env : null;

  if (!versionId || tokensIn == null || tokensOut == null) {
    return c.json(
      { error: "versionId, tokensIn, and tokensOut are required." },
      400,
    );
  }
  if (
    !Number.isInteger(tokensIn) ||
    !Number.isInteger(tokensOut) ||
    tokensIn < 0 ||
    tokensOut < 0
  ) {
    return c.json(
      { error: "tokensIn and tokensOut must be non-negative integers." },
      400,
    );
  }

  const version = await prisma.version.findFirst({
    where: {
      id: versionId,
      prompt: { projectId },
    },
    select: { id: true, promptId: true },
  });
  if (!version) {
    return c.json(
      { error: "Version not found in this project." },
      404,
    );
  }

  await prisma.usageEvent.create({
    data: {
      projectId,
      promptId: version.promptId,
      versionId: version.id,
      envName: env,
      tokensIn,
      tokensOut,
      source: "sdk",
    },
  });

  return c.json({ ok: true });
});
