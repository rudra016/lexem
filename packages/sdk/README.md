# lexem-sdk

Fetch live prompts from [Lexem](https://www.lexem.site) — Git for AI prompts. Bring versioned, environment-promoted, variable-aware prompts into your TypeScript/JavaScript app with one call.

## Install

```bash
npm install lexem-sdk
# or
pnpm add lexem-sdk
```

Requires Node 18+ (uses global `fetch`).

## Quick start

```ts
import { createClient } from "lexem-sdk";

const lexem = createClient({
  apiKey: process.env.LEXEM_API_KEY!,
});

// Fetch the version currently active in production
const p = await lexem.get("summarizer", { env: "production" });

console.log(p.content);   // "You are a helpful summarizer that..."
console.log(p.versionId); // "clxa..."
console.log(p.variables); // [{ name: "article", type: "string", default: null }]
```

Get an API key from **Project → API keys** in the Lexem dashboard.

## Rendering variables

If your prompt uses `{{variable}}` placeholders, use `render()` to fetch and substitute in one call:

```ts
const filled = await lexem.render(
  "summarizer",
  { article: "The quarterly results showed..." },
  { env: "production" },
);
// filled is the prompt string with {{article}} replaced
```

By default, missing variables throw. Pass `missing: "leave"` to keep placeholders, or `missing: "empty"` to substitute "".

```ts
await lexem.render("greeting", { name: "Alice" }, { missing: "leave" });
```

## Options

```ts
createClient({
  apiKey: process.env.LEXEM_API_KEY!,
  baseUrl: "https://api.lexem.site", // override for self-hosted
  cacheTtlMs: 30_000,                 // default 30s; 0 to disable
  fetch: customFetch,                 // optional fetch impl
});
```

### Caching

By default, `get()` results are cached in memory for 30 seconds per `(slug, env)` pair. This dramatically reduces network calls in high-QPS code paths.

- **Set `cacheTtlMs: 0`** in `createClient` to disable globally.
- **Pass `fresh: true`** to bypass for a single call:

  ```ts
  const p = await lexem.get("summarizer", { env: "production", fresh: true });
  ```
- **Call `lexem.clearCache()`** to drop all entries (useful in tests).

## Environments

Lexem projects have three default environments: `dev`, `staging`, `production`. Promotions flow `dev → staging → production`, optionally gated by approvals. Pass the environment name as `env`:

```ts
await lexem.get("summarizer", { env: "dev" });
await lexem.get("summarizer", { env: "staging" });
await lexem.get("summarizer", { env: "production" });
```

Omit `env` to fetch the prompt's current main-branch head (handy in early development, before you start promoting):

```ts
await lexem.get("summarizer");
```

## Response shape

```ts
type PromptVariable = {
  name: string;
  type: string | null;      // declared type, e.g. "string" — null if untyped
  default: string | null;   // declared default value, if any
};

type PromptResult = {
  content: string;          // the prompt text, with {{var}} placeholders
  versionId: string;        // ID of the version this response came from
  variables: PromptVariable[] | null;
  env: string;              // env requested, or "current"
  fetchedAt: string;        // ISO-8601 timestamp
};
```

Log `versionId` alongside your LLM calls to make debugging dead simple — *"which version of this prompt produced this output?"* becomes a one-line answer.

## Errors

All errors are instances of `LexemError`:

```ts
import { LexemError } from "lexem-sdk";

try {
  await lexem.get("does-not-exist");
} catch (e) {
  if (e instanceof LexemError) {
    console.error(e.status, e.message); // 404, "Prompt ... not found in this project."
  }
}
```

Common statuses:

- `401` — missing or invalid API key
- `404` — prompt not found, or no active version in the requested env

## Self-host

If you've self-hosted the Lexem API, point the SDK at it:

```ts
createClient({
  apiKey: process.env.LEXEM_API_KEY!,
  baseUrl: "https://lexem.your-domain.com",
});
```

## License

MIT
