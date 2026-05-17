import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Lexem documentation — quick start, concepts, the TypeScript SDK, REST API, and self-hosting.",
  alternates: { canonical: "/docs" },
};

const SECTIONS = [
  { id: "quickstart", label: "Quick start" },
  { id: "concepts", label: "Concepts" },
  { id: "sdk", label: "TypeScript SDK" },
  { id: "rest", label: "REST API" },
  { id: "self-host", label: "Self-hosting" },
  { id: "faq", label: "FAQ" },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <DocsNav />

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-12">
        <DocsToc />

        <main className="min-w-0">
          <header className="mb-12">
            <span className="text-xs uppercase tracking-widest text-neutral-500">
              Docs
            </span>
            <h1 className="mt-2 font-serif text-5xl font-black tracking-tight leading-[1.05]">
              Build with <span className="italic">Lexem</span>.
            </h1>
            <p className="mt-4 text-lg text-neutral-700 leading-relaxed max-w-2xl">
              Lexem is version control + evals + safe deploys for the prompts
              that drive your AI. This page covers everything from signup to
              shipping a prompt change in production.
            </p>
          </header>

          <QuickStart />
          <Concepts />
          <Sdk />
          <Rest />
          <SelfHost />
          <Faq />

          <footer className="mt-24 border-t border-black/10 pt-8 pb-16 text-sm text-neutral-500 flex items-center justify-between flex-wrap gap-4">
            <span>
              Missing something? Open an issue on{" "}
              <a
                href="https://github.com/rudra016/lexem/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-black"
              >
                GitHub
              </a>
              .
            </span>
            <Link href="/" className="hover:text-black inline-flex items-center gap-1">
              ← Back to landing
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}

// ---------- Nav ----------

function DocsNav() {
  return (
    <header className="border-b border-black/10 bg-white sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-8">
        <Link href="/" className="flex items-center gap-1 shrink-0">
          <Image
            src="/logo-no-bg.png"
            alt="Lexem"
            width={1400}
            height={629}
            style={{ height: 36, width: "auto" }}
            priority
          />
          <span className="font-serif font-semibold text-xl leading-none tracking-wide">
            Lexem
          </span>
          <span className="ml-3 text-xs font-mono uppercase tracking-widest text-neutral-500">
            Docs
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[14px]">
          <Link href="/#features" className="text-neutral-700 hover:text-black transition-colors">
            Features
          </Link>
          <Link href="/#how" className="text-neutral-700 hover:text-black transition-colors">
            How it works
          </Link>
          <a
            href="https://github.com/rudra016/lexem"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-700 hover:text-black transition-colors"
          >
            GitHub
          </a>
          <Link
            href="/login"
            className="h-9 px-4 bg-black text-white text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
          >
            Sign in <ArrowRight size={14} />
          </Link>
        </nav>
      </div>
    </header>
  );
}

function DocsToc() {
  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-24">
        <div className="text-xs uppercase tracking-widest text-neutral-500 mb-3">
          On this page
        </div>
        <ul className="space-y-2 text-sm">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-neutral-700 hover:text-black transition-colors"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

// ---------- Section primitives ----------

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-20 scroll-mt-24">
      {eyebrow && (
        <span className="text-xs uppercase tracking-widest text-neutral-500">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-1 font-serif text-3xl md:text-4xl font-black tracking-tight">
        {title}
      </h2>
      <div className="mt-6 space-y-5 text-[15px] text-neutral-700 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="mt-10 mb-3 font-serif text-2xl font-bold tracking-tight text-neutral-900 scroll-mt-24"
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[0.9em] bg-neutral-100 border border-black/10 px-1.5 py-0.5">
      {children}
    </code>
  );
}

function Pre({ language, code }: { language?: string; code: string }) {
  return (
    <div className="bg-neutral-900 border border-black/10 shadow-[6px_6px_0px_#000] overflow-x-auto">
      {language && (
        <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-neutral-500 font-mono border-b border-white/10">
          {language}
        </div>
      )}
      <pre className="px-4 py-3 text-[13px] text-neutral-100 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Callout({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "neutral" | "warn" | "tip";
  title?: string;
  children: React.ReactNode;
}) {
  const palette =
    tone === "warn"
      ? "bg-amber-50 border-amber-300 text-amber-900"
      : tone === "tip"
        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
        : "bg-white border-black/10";
  return (
    <div className={`border ${palette} px-4 py-3 text-sm`}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="text-[14px] leading-relaxed">{children}</div>
    </div>
  );
}

// ---------- Sections ----------

function QuickStart() {
  return (
    <Section id="quickstart" eyebrow="1" title="Quick start">
      <P>
        From zero to a prompt fetched in your code — about five minutes.
      </P>

      <ol className="space-y-6 list-none pl-0 mt-2">
        <Step n="1" title="Sign up and create a project">
          <P>
            Hit <Link href="/signup" className="underline hover:text-black">signup</Link> with
            email or Google. A &ldquo;Personal&rdquo; team is created automatically;
            rename it from <Code>Settings</Code> if you&apos;ll be inviting
            teammates. Then create a project from the dashboard.
          </P>
        </Step>

        <Step n="2" title="Add a prompt and commit a version">
          <P>
            Open the project, click <Code>New prompt</Code>, name it, and write
            the prompt body in the editor. Add typed variables with{" "}
            <Code>{`{{name: string}}`}</Code> syntax. When you&apos;re happy, hit
            <Code>Commit</Code> — that snapshot is now an immutable version with
            an author, timestamp, and commit message.
          </P>
        </Step>

        <Step n="3" title="(Optional) Promote to an environment">
          <P>
            Every project ships with <Code>dev</Code>, <Code>staging</Code>, and{" "}
            <Code>production</Code> environments. Click <Code>Environments</Code>
            {" "}on the project page, then <Code>Promote</Code> to deploy a
            specific version to dev. Promotion follows{" "}
            <Code>dev → staging → production</Code>; you can toggle approval-required
            on any environment column.
          </P>
        </Step>

        <Step n="4" title="Generate an API key">
          <P>
            From the project page, click <Code>API keys</Code> →{" "}
            <Code>New API key</Code>. Save the <Code>lxm_...</Code> token shown —
            this is the only time you&apos;ll see it. Admins and Owners only.
          </P>
        </Step>

        <Step n="5" title="Fetch it from your code">
          <Pre
            language="TypeScript"
            code={`import { createClient } from "@lexem/sdk";

const lexem = createClient({ apiKey: process.env.LEXEM_API_KEY! });

const p = await lexem.get("your-prompt-slug", { env: "production" });
console.log(p.content);   // the prompt text
console.log(p.versionId); // log this with your LLM call`}
          />
          <Callout tone="tip" title="Pro tip">
            Log <Code>versionId</Code> alongside every LLM call. When a
            regression appears in production, you&apos;ll know exactly which
            version of which prompt produced the output.
          </Callout>
        </Step>
      </ol>
    </Section>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 items-start">
      <span className="shrink-0 w-8 h-8 bg-black text-white text-sm font-mono flex items-center justify-center">
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <h3 className="font-serif text-xl font-bold tracking-tight text-neutral-900">
          {title}
        </h3>
        {children}
      </div>
    </li>
  );
}

function Concepts() {
  return (
    <Section id="concepts" eyebrow="2" title="Concepts">
      <P>
        A handful of nouns power the entire product. Once these click, the UI
        navigates itself.
      </P>

      <H3 id="projects">Project</H3>
      <P>
        A collection of prompts owned by a team. Permissions, environments, and
        API keys are scoped to a project.
      </P>

      <H3 id="prompts-versions">Prompt &amp; Version</H3>
      <P>
        A <strong>prompt</strong> is a named slot (e.g. <Code>summarizer</Code>).
        A <strong>version</strong> is an immutable snapshot of that prompt&apos;s
        content at a point in time, with a commit message and an author. You
        never overwrite a version — you commit a new one.
      </P>

      <H3 id="branches-tags">Branches &amp; tags</H3>
      <P>
        Branches let you commit experimental variants without touching{" "}
        <Code>main</Code>. Merge a branch back to <Code>main</Code> when its eval
        score beats the incumbent. Tags (<Code>v1.0</Code>, <Code>stable</Code>,
        <Code>pre-launch</Code>) attach human-readable labels to specific versions.
      </P>

      <H3 id="evals">Evals</H3>
      <P>
        An eval is a suite of test cases — each with input variables and an
        expected output — run against a prompt version. Three scorers are built
        in: <strong>exact match</strong>, <strong>regex</strong>, and{" "}
        <strong>LLM-as-judge</strong>. Lexem auto-flags regressions when a new
        version&apos;s score drops more than 5 points from the previous one.
      </P>

      <H3 id="environments">Environments</H3>
      <P>
        Every project has three environments — <Code>dev</Code>,{" "}
        <Code>staging</Code>, <Code>production</Code> — seeded automatically.
        Each environment holds an active version per prompt. Promotion is{" "}
        <strong>strictly chained</strong>: a version must be live in{" "}
        <Code>dev</Code> before it can be promoted to <Code>staging</Code>, and
        live in <Code>staging</Code> before it can reach <Code>production</Code>.
        The order is enforced server-side.
      </P>

      <H3 id="approvals">Approvals</H3>
      <P>
        Toggle <strong>approval required</strong> on any environment column. With
        approval on, a promote click creates a pending <strong>Deployment</strong>{" "}
        that doesn&apos;t flip the active version until a teammate approves it
        from the <strong>Pending approvals</strong> panel at the top of the
        environments page.
      </P>

      <H3 id="api-keys">API keys</H3>
      <P>
        Project-scoped bearer tokens (<Code>lxm_...</Code>) used by the SDK and
        REST API to fetch prompts. Generated by Admins, hashed at rest, shown
        once on creation, and revocable any time. <Code>lastUsedAt</Code> ticks
        with every successful auth so you can audit usage.
      </P>

      <H3 id="roles">Team roles</H3>
      <P>
        Four tiers. Permissions stack — every tier inherits everything below it:
      </P>
      <RoleMatrix />
    </Section>
  );
}

function RoleMatrix() {
  const rows: { capability: string; viewer: boolean; editor: boolean; admin: boolean; owner: boolean }[] = [
    { capability: "View prompts, versions, evals, environments", viewer: true, editor: true, admin: true, owner: true },
    { capability: "Commit, branch, merge, tag, rollback", viewer: false, editor: true, admin: true, owner: true },
    { capability: "Create / edit / run evals", viewer: false, editor: true, admin: true, owner: true },
    { capability: "Promote to envs · approve / reject", viewer: false, editor: false, admin: true, owner: true },
    { capability: "Manage provider keys + API keys", viewer: false, editor: false, admin: true, owner: true },
    { capability: "Manage members & invites", viewer: false, editor: false, admin: true, owner: true },
    { capability: "Promote Admins / rename team", viewer: false, editor: false, admin: false, owner: true },
  ];

  return (
    <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000] overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-black/10 bg-neutral-50">
          <tr>
            <th className="text-left font-semibold px-4 py-3">Capability</th>
            {["Viewer", "Editor", "Admin", "Owner"].map((r) => (
              <th key={r} className="text-center font-semibold px-3 py-3 font-mono text-xs uppercase tracking-widest">
                {r}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.capability} className={i > 0 ? "border-t border-black/10" : ""}>
              <td className="px-4 py-2 text-neutral-700">{row.capability}</td>
              {[row.viewer, row.editor, row.admin, row.owner].map((on, idx) => (
                <td key={idx} className="px-3 py-2 text-center">
                  {on ? (
                    <span className="text-emerald-700">✓</span>
                  ) : (
                    <span className="text-neutral-300">·</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Sdk() {
  return (
    <Section id="sdk" eyebrow="3" title="TypeScript SDK">
      <P>
        The official JavaScript / TypeScript SDK wraps the REST API with a
        small, typed surface, an in-memory cache, and a <Code>render()</Code>{" "}
        helper for variable interpolation. Requires Node 18+ (uses global
        <Code>fetch</Code>).
      </P>

      <Callout tone="warn" title="Beta">
        The SDK currently ships in the monorepo as <Code>@lexem/sdk</Code>.
        Publishing to npm is on the roadmap — for now, install from a tarball
        (<Code>pnpm pack</Code>) or vendor the <Code>dist/</Code> output.
      </Callout>

      <H3 id="sdk-install">Install</H3>
      <Pre
        language="bash"
        code={`# once published:
npm install @lexem/sdk

# today, from a local tarball:
pnpm --filter @lexem/sdk pack
npm install ./lexem-sdk-0.1.0.tgz`}
      />

      <H3 id="sdk-create">Create a client</H3>
      <Pre
        language="TypeScript"
        code={`import { createClient } from "@lexem/sdk";

const lexem = createClient({
  apiKey: process.env.LEXEM_API_KEY!,
  baseUrl: "https://api.lexem.site",  // optional; default shown
  cacheTtlMs: 30_000,                  // optional; default 30s, 0 to disable
});`}
      />

      <H3 id="sdk-get">Get a prompt</H3>
      <Pre
        language="TypeScript"
        code={`const p = await lexem.get("summarizer", { env: "production" });
// {
//   content: "You are a helpful summarizer...",
//   versionId: "clxa...",
//   variables: { article: "string" },
//   env: "production",
//   fetchedAt: "2026-05-17T08:00:00Z"
// }`}
      />
      <P>
        Omit <Code>env</Code> to fetch the prompt&apos;s current main-branch
        head — useful in early development before you start promoting.
      </P>

      <H3 id="sdk-render">Render variables</H3>
      <Pre
        language="TypeScript"
        code={`const filled = await lexem.render(
  "summarizer",
  { article: "Q4 results showed..." },
  { env: "production" },
);
// returns the prompt string with {{article}} substituted`}
      />
      <P>
        Missing variables throw by default. Pass <Code>{`{ missing: "leave" }`}</Code>{" "}
        to keep placeholders, or <Code>{`{ missing: "empty" }`}</Code> to
        substitute an empty string.
      </P>

      <H3 id="sdk-caching">Caching</H3>
      <P>
        Results are cached in memory for 30 seconds per <Code>(slug, env)</Code>{" "}
        pair by default. Disable globally with <Code>cacheTtlMs: 0</Code> in{" "}
        <Code>createClient</Code>, or bypass for a single call with{" "}
        <Code>fresh: true</Code>:
      </P>
      <Pre
        language="TypeScript"
        code={`await lexem.get("summarizer", { env: "production", fresh: true });

// Or drop all entries (useful in tests):
lexem.clearCache();`}
      />

      <H3 id="sdk-errors">Errors</H3>
      <Pre
        language="TypeScript"
        code={`import { LexemError } from "@lexem/sdk";

try {
  await lexem.get("does-not-exist");
} catch (e) {
  if (e instanceof LexemError) {
    console.error(e.status, e.message);
    // 404, 'Prompt "does-not-exist" not found in this project.'
  }
}`}
      />
    </Section>
  );
}

function Rest() {
  return (
    <Section id="rest" eyebrow="4" title="REST API">
      <P>
        If you&apos;re not on Node/TypeScript, hit the REST API directly. One
        public endpoint today — the same one the SDK calls.
      </P>

      <H3 id="rest-base">Base URL</H3>
      <Pre language="text" code={`https://api.lexem.site`} />

      <H3 id="rest-auth">Authentication</H3>
      <P>
        Bearer token in the <Code>Authorization</Code> header. The key is the
        full <Code>lxm_...</Code> string from <Code>API keys</Code>.
      </P>
      <Pre
        language="bash"
        code={`curl https://api.lexem.site/v1/prompts/summarizer?env=production \\
  -H "Authorization: Bearer lxm_your_key_here"`}
      />
      <P>
        For quick debugging only, <Code>?api_key=</Code> is also accepted as a
        query parameter. Don&apos;t use this in production — it ends up in
        access logs and browser history.
      </P>

      <H3 id="rest-endpoint">GET /v1/prompts/:slug</H3>
      <P>Fetches the active version of a prompt.</P>

      <Pre
        language="text"
        code={`Query params:
  env   (optional)  Environment name: "dev", "staging", "production",
                    or any custom env. Omit to fetch the current
                    main-branch head.

Returns 200:
  {
    "content":    "You are a helpful summarizer...",
    "versionId":  "clxa...",
    "variables":  { "article": "string" } | null,
    "env":        "production" | "current",
    "fetchedAt":  "2026-05-17T08:00:00Z"
  }

Errors:
  401  Missing or invalid API key (or key revoked).
  404  Prompt not found in this project, or no active version
       in the requested environment.`}
      />
    </Section>
  );
}

function SelfHost() {
  return (
    <Section id="self-host" eyebrow="5" title="Self-hosting">
      <P>
        Lexem is open-source under MIT. Full setup instructions live in the{" "}
        <a
          href="https://github.com/rudra016/lexem#quick-start"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-black"
        >
          repository README
        </a>
        . The short version:
      </P>

      <Pre
        language="bash"
        code={`git clone https://github.com/rudra016/lexem
cd lexem
pnpm install
pnpm --filter @lexem/db migrate
pnpm dev`}
      />

      <P>You&apos;ll need:</P>
      <ul className="list-disc pl-6 space-y-1">
        <li>Node 20.6+ and pnpm 9+</li>
        <li>A PostgreSQL database</li>
        <li>
          At least one provider API key (OpenAI / Anthropic / Google) to run
          evals or generate AI change summaries
        </li>
      </ul>

      <P>
        When self-hosting, point the SDK at your deployment with{" "}
        <Code>baseUrl: &quot;https://lexem.your-domain.com&quot;</Code>.
      </P>
    </Section>
  );
}

function Faq() {
  const qs: { q: string; a: React.ReactNode }[] = [
    {
      q: "How is this different from LangSmith or PromptLayer?",
      a: (
        <>
          Both observe LLM calls; neither treats prompts as versioned source
          code. Lexem focuses on the artifact: real diff/branch/merge/rollback,
          eval-gated promotions, and an SDK that returns the active version per
          environment.
        </>
      ),
    },
    {
      q: "Are my prompts and provider keys safe?",
      a: (
        <>
          Provider API keys are encrypted at rest with AES-256-GCM, scoped per
          team, and never returned to the client in plaintext. Lexem API keys
          are stored as SHA-256 hashes, prefixed in the UI for identification,
          and revocable.
        </>
      ),
    },
    {
      q: "Can I run evals against my own model deployment?",
      a: (
        <>
          Today the runner supports OpenAI, Anthropic, and Google. A custom
          base-URL / endpoint shim is on the roadmap.
        </>
      ),
    },
    {
      q: "Does the SDK work in the browser / Edge runtime?",
      a: (
        <>
          Anywhere global <Code>fetch</Code> is available — Node 18+, modern
          browsers, Cloudflare Workers, Vercel Edge. That said, putting an API
          key in browser JS exposes it; prefer fetching prompts server-side and
          shipping the rendered text to the client.
        </>
      ),
    },
    {
      q: "Where do I report bugs or request features?",
      a: (
        <>
          <a
            href="https://github.com/rudra016/lexem/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-black"
          >
            GitHub Issues
          </a>
          . Security disclosures: email{" "}
          <a className="underline hover:text-black" href="mailto:rudra619kumar@gmail.com">
            rudra619kumar@gmail.com
          </a>{" "}
          directly.
        </>
      ),
    },
  ];

  return (
    <Section id="faq" eyebrow="6" title="FAQ">
      <div className="space-y-6">
        {qs.map((item) => (
          <div key={item.q}>
            <h3 className="font-serif text-xl font-bold tracking-tight text-neutral-900">
              {item.q}
            </h3>
            <p className="mt-2 text-[15px] text-neutral-700 leading-relaxed">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
