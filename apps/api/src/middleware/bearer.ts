import crypto from "node:crypto";
import type { Context, MiddlewareHandler } from "hono";
import { prisma } from "../db.js";

export type BearerContext = {
  Variables: {
    projectId: string;
    apiKeyId: string;
  };
};

function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function extractToken(c: Context): string | null {
  const header = c.req.header("Authorization");
  if (header && header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  // Allow ?api_key= for convenience (e.g. cURL-friendly debugging). Not
  // recommended for production callers, who should use the Authorization header.
  const queryKey = c.req.query("api_key");
  return queryKey ?? null;
}

export const bearerAuth: MiddlewareHandler<BearerContext> = async (c, next) => {
  const raw = extractToken(c);
  if (!raw) {
    return c.json({ error: "Missing API key" }, 401);
  }

  const hashed = hashApiKey(raw);
  const apiKey = await prisma.apiKey.findUnique({
    where: { hashedKey: hashed },
    select: { id: true, projectId: true, revokedAt: true },
  });

  if (!apiKey || apiKey.revokedAt) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  c.set("projectId", apiKey.projectId);
  c.set("apiKeyId", apiKey.id);

  // Bump lastUsedAt asynchronously — don't block the response on this write.
  void prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {
      /* swallow — observability concern, not request-critical */
    });

  await next();
};
