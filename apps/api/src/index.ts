import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import { projects } from "./routes/projects.js";
import { prompts } from "./routes/prompts.js";
import { versions } from "./routes/versions.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/", (c) => c.json({ name: "lexem-api", status: "ok" }));
app.get("/health", (c) => c.json({ ok: true }));

app.route("/projects", projects);
app.route("/prompts", prompts);
app.route("/versions", versions);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message }, 500);
});

const port = Number(process.env.PORT ?? 4000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`lexem-api listening on http://localhost:${info.port}`);
});
