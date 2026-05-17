import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: true,
  // Inline workspace packages so we never ship raw `.ts` to production.
  // Anything in `dependencies` (hono, @prisma/client, etc.) stays external
  // and is resolved from node_modules at runtime — that's important for
  // @prisma/client, which loads its native engine via dynamic paths.
  noExternal: [/^@lexem\//],
});
