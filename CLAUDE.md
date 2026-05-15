# Lexem — Product Plan & Task Breakdown

> **Lexem** is a version control and testing platform for AI prompts.
> Git for your prompts — with evals, rollback, and deployment guardrails built in.

---

## What problem it solves

Teams using AI in production change system prompts ad-hoc: someone edits a string in a `.env` file, things silently break, nobody knows what changed or why. There's no rollback, no testing, no history. Promptforge brings software engineering discipline to the one artifact that controls AI behaviour.

---

## Core concepts

| Concept | What it means |
|---|---|
| **Prompt** | A versioned prompt object — system prompt, user template, or chain |
| **Version** | A snapshot of a prompt at a point in time, with a commit message |
| **Eval** | A set of test cases run against a prompt version to measure quality |
| **Score** | A numeric result (0–100) from running evals against a version |
| **Deploy** | Promoting a version to an environment (dev / staging / prod) |
| **Diff** | A side-by-side comparison of two prompt versions |
| **Project** | A collection of prompts belonging to one product or team |

---

## Product phases

### Phase 0 — Foundation (Weeks 1–3)
Core data model, auth, and basic CRUD. Nothing fancy. Get the bones right.

### Phase 1 — Version Control (Weeks 4–7)
The Git-like layer. Commit, diff, branch, rollback. This is the core value prop.

### Phase 2 — Evals Engine (Weeks 8–12)
Run test suites against prompt versions. Score outputs. Block bad deploys.

### Phase 3 — Deploy & Integrations (Weeks 13–17)
Environments, SDK, CI/CD hooks, team features.

### Phase 4 — Intelligence Layer (Weeks 18–22)
Regression detection, auto-suggestions, performance trends.

---

## Task breakdown

---

### Phase 0 — Foundation

- [ ] **P0-01** — Define data schema: `projects`, `prompts`, `versions`, `evals`, `runs`, `users`, `teams`
- [ ] **P0-02** — Set up monorepo structure: `apps/web`, `apps/api`, `packages/sdk`, `packages/types`
- [ ] **P0-03** — Choose and set up database (PostgreSQL + Prisma recommended)
- [ ] **P0-04** — Auth system: email/password + Google OAuth, team invites, API key issuance
- [ ] **P0-05** — REST API skeleton: projects CRUD, prompt CRUD, version CRUD
- [ ] **P0-06** — Basic web app shell: sidebar nav, project dashboard, empty states
- [ ] **P0-07** — Prompt editor: syntax-highlighted textarea with variable highlighting (`{{variable}}` syntax)
- [ ] **P0-08** — Deploy to staging: set up Railway/Render infra, CI pipeline, environment config

---

### Phase 1 — Version Control

- [ ] **P1-01** — Version commit flow: user edits prompt → writes commit message → creates immutable version snapshot
- [ ] **P1-02** — Version history view: timeline of all versions for a prompt with author, timestamp, commit message
- [ ] **P1-03** — Diff viewer: side-by-side or inline diff between any two versions (character-level highlighting)
- [ ] **P1-04** — Rollback: one-click promote any past version back to "current" with a new commit entry
- [ ] **P1-05** — Branching: fork a prompt into a named branch for experimental changes
- [ ] **P1-06** — Merge: merge a branch back into main with conflict resolution UI
- [ ] **P1-07** — Prompt variables system: define typed variables (`{{user_name: string}}`) with defaults
- [ ] **P1-08** — Version tagging: tag versions (e.g. `v1.2`, `stable`, `pre-launch`) for easy reference
- [ ] **P1-09** — Changelog: auto-generate human-readable summary of what changed between versions using an LLM

---

### Phase 2 — Evals Engine

- [ ] **P2-01** — Eval test case format: define schema for a test case (input variables + expected output criteria)
- [ ] **P2-02** — Eval suite builder UI: create / edit / delete test cases, group into suites
- [ ] **P2-03** — Eval runner: execute a prompt version against all test cases in a suite, call the target LLM
- [ ] **P2-04** — Scoring methods: implement three scorer types — exact match, LLM-as-judge, regex assertion
- [ ] **P2-05** — Results dashboard: per-test-case pass/fail, overall score, time taken, token usage
- [ ] **P2-06** — Score history chart: track how a prompt's eval score changes across versions over time
- [ ] **P2-07** — Regression alerts: flag when a new version scores worse than the previous version by >5%
- [ ] **P2-08** — Multi-model eval: run the same prompt version against GPT-4o, Claude, Gemini — compare outputs
- [ ] **P2-09** — Eval templates library: pre-built eval suites for common use cases (customer support, summarisation, extraction)
- [ ] **P2-10** — Async eval runs: queue large eval jobs, notify via email/webhook when complete

---

### Phase 3 — Deploy & Integrations

- [ ] **P3-01** — Environments: dev / staging / production environments per project, each with an active prompt version
- [ ] **P3-02** — Promotion flow: promote a version from dev → staging → prod with optional approval gate
- [ ] **P3-03** — Deploy guard: block promotion if eval score is below a configurable threshold
- [ ] **P3-04** — JavaScript/TypeScript SDK: `lexem.get('prompt-slug', { env: 'production' })` returns live prompt
- [ ] **P3-05** — Python SDK: same as above for Python users
- [ ] **P3-06** — REST API for prompt fetching: unauthenticated fetch endpoint using project API key
- [ ] **P3-07** — GitHub Actions integration: run evals on PR, post score as a PR check, block merge if failing
- [ ] **P3-08** — Webhook system: POST to a URL on version deploy, eval completion, regression detected
- [ ] **P3-09** — Slack integration: post deploy and regression alerts to a Slack channel
- [ ] **P3-10** — Team roles: Owner, Admin, Editor, Viewer — permission gates on deploy and eval operations

---

### Phase 4 — Intelligence Layer

- [ ] **P4-01** — Auto diff summary: when viewing a diff, show an LLM-generated plain-English summary of what changed and potential impact
- [ ] **P4-02** — Prompt improvement suggestions: analyse a prompt + its eval failures and suggest targeted edits
- [ ] **P4-03** — Regression root cause: when a version regresses, highlight which specific change in the diff likely caused it
- [ ] **P4-04** — Token usage analytics: track average input/output token counts per prompt version across real usage
- [ ] **P4-05** — Cost estimator: project monthly LLM cost based on current prompt length × estimated call volume
- [ ] **P4-06** — Prompt compression: suggest shorter versions of a prompt that maintain eval score (reduce token cost)
- [ ] **P4-07** — Cross-version search: search across all prompt versions for a specific phrase or pattern
- [ ] **P4-08** — Anomaly detection: flag when live production outputs start drifting from historical baseline (requires logging integration)

---

## Tech stack recommendation

| Layer | Choice | Reason |
|---|---|---|
| Web app | Next.js 15 (App Router) | SSR, great DX, easy to deploy |
| API | tRPC or REST on Node.js | Type-safe end-to-end if using tRPC |
| Database | PostgreSQL via Prisma | Relational, versioning maps cleanly to tables |
| Auth | Clerk or Auth.js | Team + OAuth support out of the box |
| Hosting | Railway or Vercel + Supabase | Fast to ship, easy to scale |
| Eval runner | Background jobs via BullMQ | Queue eval runs, don't block the UI |
| SDK | TypeScript-first, ESM + CJS exports | Max compatibility |
| Diff rendering | `diff` npm package + custom UI | Simple, no heavy deps |

---

## Key screens

1. **Project dashboard** — all prompts, their current version, last deploy, eval score badge
2. **Prompt editor** — write prompt, preview with variables filled, commit with message
3. **Version history** — timeline view, click any version to see full text + diff from previous
4. **Diff viewer** — two-panel or inline, character-level highlighting, change summary sidebar
5. **Eval suite** — list of test cases, run button, live progress, results table
6. **Score chart** — line graph of eval score across version history
7. **Environments** — which version is live in each env, promote button, deploy guard status
8. **Settings** — API keys, team members, webhook config, integrations

---

## Success metrics (first 6 months)

- 500 teams signed up
- 50,000 prompt versions committed
- 10,000 eval runs executed
- SDK installed in 200+ production apps
- NPS > 50 from active teams

---

## What makes Lexem different from alternatives

| Feature | Lexem | LangSmith | PromptLayer | Manual .env |
|---|---|---|---|---|
| Version control with diff | Yes | Partial | No | No |
| Eval-gated deploys | Yes | No | No | No |
| Branch + merge | Yes | No | No | No |
| Multi-model eval | Yes | Yes | No | No |
| SDK-based live fetch | Yes | No | Partial | No |
| Regression auto-detection | Yes | No | No | No |
| Prompt compression suggestions | Yes | No | No | No |

---

*Last updated: May 2026 — Lexem v0 planning*