# Contributing to Lexem

Thanks for your interest in contributing! Lexem is a version-control and testing platform for AI prompts, and we welcome contributions of every size — bug fixes, new eval templates, additional provider integrations, SDK work, docs, and DX polish.

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Ways to contribute

- **Report bugs** — open an [issue](https://github.com/rudra016/lexem/issues/new) with a clear title, reproduction steps, and (if relevant) screenshots or logs.
- **Suggest features** — open an issue describing the problem first; we'll discuss the shape of the solution before code is written.
- **Send a pull request** — fix a bug, add a feature, polish docs. See the workflow below.
- **Improve evals** — drop in a new template under `apps/web/src/lib/eval-templates.ts` for a common task (extraction, classification, RAG quality, etc.).
- **Add a provider** — extend `apps/web/src/lib/providers.ts` to support another model vendor.

If you're unsure whether something is wanted, **open an issue first** — we'd rather chat early than reject a PR you've sunk hours into.

---

## Project setup

Before your first PR, get the project running locally. Full instructions are in the [README](README.md#quick-start). The short version:

```bash
git clone https://github.com/<your-username>/lexem
cd lexem
pnpm install
pnpm --filter @lexem/db migrate
pnpm dev
```

You'll need:

- Node.js 20.6+
- pnpm 9+
- A PostgreSQL database
- At least one provider API key (OpenAI, Anthropic, or Google) if you're working on eval features

---

## Development workflow

### 1. Fork and branch

Fork the repo to your own account, then create a feature branch off `master`:

```bash
git checkout -b <short-descriptive-name>
```

Branch-name suggestions:

- `fix/<short-summary>` for bug fixes
- `feat/<short-summary>` for features
- `docs/<short-summary>` for docs-only changes
- `chore/<short-summary>` for tooling/infra

### 2. Make your changes

Keep commits focused. Each commit should represent one logical change so reviewers can read the history without scrolling through the diff.

The repository follows a loose [Conventional Commits](https://www.conventionalcommits.org/) style — start your commit subjects with one of:

- `feat:` — new user-visible capability
- `fix:` — bug fix
- `refactor:` — internal change with no behaviour difference
- `docs:` — docs-only
- `chore:` — tooling, deps, infra

Example:

```text
feat(evals): add JSON schema scorer
fix(diff): handle trailing-newline edge case
```

### 3. Verify locally before pushing

Run these from the repo root before you push:

```bash
# Type-check the web app
pnpm --filter web exec tsc --noEmit

# Lint
pnpm --filter web exec eslint .

# Build (catches things tsc doesn't)
pnpm --filter web build
```

For schema changes, also run:

```bash
pnpm --filter @lexem/db generate
pnpm --filter @lexem/db migrate
```

For UI changes, please test the feature in a browser — type-checks confirm the code compiles, not that the feature works.

### 4. Open a pull request

Push your branch to your fork and open a PR against `rudra016/lexem:master`. In the PR description, include:

- **What** changed and **why**
- Screenshots or short clips for UI changes
- Any new env vars or migration steps
- Linked issue, if applicable (`Closes #123`)

We aim to give first-pass feedback within a few days. Smaller, focused PRs land faster than large ones — if your change is big, consider splitting it.

---

## Coding guidelines

- **TypeScript strict mode.** No `any` unless there's a good reason.
- **Server actions** live under `apps/web/src/app/(app)/*-actions.ts`. They must call `requireUser()` (and `requireRole`/`requireProjectRole`/`requirePromptRole` where mutating) before touching the DB.
- **Authz first, business logic second.** Permission errors must come from the authz layer (`@/lib/authz`), not ad-hoc throws.
- **Match the existing aesthetic.** The UI is neo-brutalist: white cards with `border border-black/10 shadow-[6px_6px_0px_#000]`, mono fonts for slugs/identifiers, `text-3xl font-black tracking-tight` for page titles. Don't introduce a competing visual language without discussion.
- **No silent failures.** Surface errors back through the action and let the client component show them. Don't `console.error` and pretend it worked.
- **Don't commit secrets.** Provider API keys, DB credentials, `.env` files — none of these belong in git. The `.gitignore` already covers the common cases.

### Migrations

Schema changes go through Prisma:

```bash
pnpm --filter @lexem/db migrate
```

When you make a schema change, include the generated migration in your PR. Don't hand-edit migration SQL after it's been committed.

---

## Reporting security issues

Please do **not** open public issues for security vulnerabilities. Email rudra619kumar@gmail.com directly with a description and reproduction steps, and we'll respond as quickly as we can.

---

## Questions

Open an issue with the `question` label, or start a discussion. Maintainers are happy to help you find the right starting point.

Thanks for making Lexem better. ☕
