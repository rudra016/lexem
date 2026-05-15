<p align="center">
  <img src="apps/web/public/logo-bg.png" alt="Lexem" width="320" />
</p>

<h1 align="center">Lexem</h1>

<p align="center">
  <strong>Version control and testing platform for AI prompts.</strong><br/>
  Git for your prompts — with evals, rollback, and deployment guardrails built in.
</p>

---

## What it is

Teams shipping AI in production change system prompts ad-hoc. Someone edits a string in a `.env` file, things silently break, nobody knows what changed or why. There's no rollback, no testing, no history.

Lexem brings software engineering discipline to the one artifact that controls your model's behaviour.

## Features

**Version control**

- Commit prompts with messages, view full history per branch
- Side-by-side and inline diffs between any two versions
- One-click rollback to any past version
- Branch, merge with conflict resolution, tag versions (`v1.0`, `stable`, …)
- LLM-generated change summaries

**Evals**

- Build test suites with typed input variables and three scorer types: exact match, regex, LLM-as-judge
- Run a suite against any prompt version, see per-case pass/fail with latency and token counts
- Score history chart per suite with automatic regression alerts (drop ≥ 5 points)
- Pre-built templates: customer support, summarisation, JSON extraction, tone consistency, refusals

**Multi-model, bring-your-own-key**

- OpenAI, Anthropic, and Google supported out of the box
- API keys encrypted at rest (AES-256-GCM) and managed per team in Settings
- Each eval suite can pin a provider key and model

**Built for teams**

- Email/password and Google OAuth sign-in
- Personal team created automatically on first sign-up
- Project / prompt / version model maps cleanly to how product teams already think

## Tech stack

| Layer | Choice |
|---|---|
| Web | Next.js 16 (App Router, Turbopack) |
| API | Hono on Node.js |
| Database | PostgreSQL via Prisma 6 |
| Auth | Auth.js v5 with Prisma adapter |
| Styling | Tailwind v4, custom brutalist tokens |
| Charts | Recharts |
| Encryption | AES-256-GCM via Node crypto |
| Package manager | pnpm workspaces |

## Quick start

### Prerequisites

- Node.js 20.6+
- pnpm 9+
- A PostgreSQL database (local, Supabase, Neon, Aiven, Railway, etc.)

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/lexem
cd lexem
pnpm install
```

### 2. Configure environment

Create `apps/web/.env`:

```env
DATABASE_URL="postgres://user:pass@host:port/db?sslmode=require"
AUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# Optional: production-grade encryption for provider keys.
# Falls back to AUTH_SECRET if unset.
ENCRYPTION_KEY=""

# Optional: Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

The same `DATABASE_URL` is read from `apps/api/.env` and `packages/db/.env` for the API and migrations. For dev you can symlink or duplicate.

### 3. Migrate the database

```bash
pnpm --filter @lexem/db migrate
```

### 4. Run both apps

```bash
pnpm dev
```

- Web: <http://localhost:3000>
- API: <http://localhost:4000>

Or one at a time:

```bash
pnpm dev:web
pnpm dev:api
```

### 5. Add a provider key

Sign up, then go to **Settings** and add at least one provider key (OpenAI, Anthropic, or Google). Without it, evals and AI change summaries are disabled.

## Project structure

```
lexem/
├── apps/
│   ├── web/        # Next.js app (UI + server actions)
│   └── api/        # Hono REST API for the SDK and external consumers
├── packages/
│   ├── db/         # Prisma schema, migrations, client export
│   ├── sdk/        # TypeScript SDK (P3, in progress)
│   └── types/      # Shared types
└── pnpm-workspace.yaml
```

The web app drives the dashboard, editor, evals, and settings. The API is a thin REST surface intended for the SDK and CI integrations.

## Provider keys

Keys are stored encrypted with AES-256-GCM. The encryption key is derived from `ENCRYPTION_KEY` if set, otherwise from `AUTH_SECRET`. Plaintext keys never leave the server.

Adding a key:

1. Settings → Provider keys → **Add key**
2. Pick provider, give it a label, paste the API key
3. Optionally set a default model

Per-suite overrides are supported — open a suite's settings to choose a different key or model for that suite specifically.

## Status

Roughly tracking the [CLAUDE.md](./CLAUDE.md) roadmap.

- **Phase 0 — Foundation** — done
- **Phase 1 — Version Control** — done (commit, diff, branch, merge, tag, rollback, AI change summary)
- **Phase 2 — Evals Engine** — done except async queue
- **Phase 3 — Deploy & Integrations** — in progress (environments, SDK, GitHub Actions, webhooks)
- **Phase 4 — Intelligence Layer** — planned

## Deploying

The web app builds cleanly on Vercel. The build command runs `prisma generate` before `next build`:

```bash
pnpm --filter @lexem/db generate && next build
```

Required env vars in production:

- `DATABASE_URL`
- `AUTH_SECRET` (or `ENCRYPTION_KEY` for keys + `AUTH_SECRET` for sessions, both recommended)
- `NEXTAUTH_URL` set to your deployed origin
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` if using Google OAuth

For Google OAuth, add `https://your-domain/api/auth/callback/google` as an authorized redirect URI.

## Contributing

Lexem is open source. PRs welcome, especially:

- Additional eval templates
- Provider integrations beyond OpenAI / Anthropic / Google
- SDK packages (Python is high on the list)
- Bug fixes and DX polish

Before opening a PR, please run:

```bash
pnpm --filter web exec tsc --noEmit
pnpm --filter web build
```

## License

TBD. Treat the repo as source-available until a license file is added.
