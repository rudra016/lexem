import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import { v1 } from "./routes/v1.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: ["https://www.lexem.site", "https://lexem.site"],
}));

app.get("/", (c) => c.json({ name: "lexem-api", status: "ok" }));
app.get("/health", (c) => c.json({ ok: true }));

app.route("/v1", v1);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message }, 500);
});

const port = Number(process.env.PORT ?? 4000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`lexem-api listening on http://localhost:${info.port}`);
});
