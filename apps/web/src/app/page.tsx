import Link from "next/link";
import Image from "next/image";
import {
  GitBranch,
  FlaskConical,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Package,
  Sparkles,
  ShieldAlert,
  Shield,
  BarChart3,
} from "lucide-react";
import { GitHubStarsButton } from "@/components/animate-ui/components/buttons/github-stars";
import { WordRotate } from "@/components/ui/word-rotate";
import { CopySnippet } from "@/components/copy-snippet";
import { ChameleonTooltip } from "@/components/chameleon-tooltip";
import { HomeLogo } from "@/components/home-logo";
import { auth } from "@/auth";

const SIDE_PADDING = "pl-6 md:pl-20 lg:pl-32 xl:pl-52 pr-6 md:pr-20 lg:pr-32 xl:pr-52";

export default async function LandingPage() {
  const session = await auth();
  const isAuthed = !!session?.user;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <SiteNav isAuthed={isAuthed} />
      <Hero isAuthed={isAuthed} />
      <InstallSnippet />
      <Features />
      <HowItWorks />
      <OpenSourceCTA isAuthed={isAuthed} />
      <SiteFooter />
    </main>
  );
}

function SiteNav({ isAuthed }: { isAuthed: boolean }) {
  return (
    <header className="w-full">
      <div className="pl-6 md:pl-20 lg:pl-32 xl:pl-52 pr-6 md:pr-20 lg:pr-32 xl:pr-52 h-20 flex items-center justify-between gap-8">
        <HomeLogo />

        <nav className="hidden md:flex items-center gap-9 text-[15px]">
          <a href="#features" className="text-neutral-700 hover:text-black transition-colors">Features</a>
          <a href="#how" className="text-neutral-700 hover:text-black transition-colors">How it works</a>
          <a href="#open-source" className="text-neutral-700 hover:text-black transition-colors">Open source</a>
          <Link href="/docs" className="text-neutral-700 hover:text-black transition-colors">Docs</Link>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://github.com/rudra016/lexem"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Star Lexem on GitHub (opens in a new tab)"
            className="contents"
          >
            <GitHubStarsButton
              username="rudra016"
              repo="lexem"
              variant="outline"
              size="lg"
              tabIndex={-1}
            />
          </a>
          <Link
            href={isAuthed ? "/dashboard" : "/login"}
            className="h-10 px-5 bg-black text-white text-[15px] font-medium inline-flex items-center justify-center gap-2 transition-colors hover:bg-neutral-800"
          >
            {isAuthed ? (
              <>
                Dashboard <ArrowRight size={14} />
              </>
            ) : (
              "Sign in"
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero({ isAuthed }: { isAuthed: boolean }) {
  return (
    <section className="relative flex-1 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(0,735px)] items-center min-h-[calc(100vh-5rem)]">
        <div className="pl-6 md:pl-20 lg:pl-32 xl:pl-52 pr-6 md:pr-0 py-16 md:py-24 max-w-4xl">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-600 border border-black/15 bg-white px-2.5 py-1">
            Open source · Bring your own keys
          </span>
          <h1 className="mt-6 font-serif text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
            Git for your <span className="italic">prompts</span>.
          </h1>
          <p className="mt-6 text-lg text-neutral-700 leading-relaxed max-w-xl">
            Version, diff, and ship AI prompts with the same discipline you
            bring to code, so changes go live deliberately, not by accident.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href={isAuthed ? "/dashboard" : "/signup"}
              className="h-12 px-6 bg-black text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors hover:bg-neutral-800"
            >
              {isAuthed ? (
                <>
                  Go to dashboard <ArrowRight size={14} />
                </>
              ) : (
                "Get started — it's free"
              )}
            </Link>
            <Link
              href="https://github.com/rudra016/lexem"
              className="h-12 px-6 border border-black bg-white text-black text-sm font-medium inline-flex items-center justify-center transition-colors hover:bg-black hover:text-white"
            >
              View on GitHub
            </Link>
          </div>

          <dl className="mt-14 grid grid-cols-3 gap-6 max-w-md">
            <div>
              <dt className="text-xs uppercase tracking-widest text-neutral-500">
                Providers
              </dt>
              <dd className=" font-mono text-sm">
                <WordRotate
                  words={["OpenAI", "Anthropic", "Google"]}
                  duration={3800}
                  className="!font-mono !text-sm !font-normal !tracking-normal leading-none"
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-neutral-500">
                Envs
              </dt>
              <dd className="mt-1 font-mono text-sm">Dev to prod</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-neutral-500">
                Self-host
              </dt>
              <dd className="mt-1 font-mono text-sm">Always</dd>
            </div>
          </dl>
        </div>

        <div className="relative w-full h-full min-h-[540px] md:min-h-[820px]">
          <Image
            src="/hero.png"
            alt=""
            fill
            sizes="(min-width: 768px) 960px, 100vw"
            className="object-contain object-right pointer-events-none select-none translate-x-10"
            priority
          />
          <ChameleonTooltip />
        </div>
      </div>
    </section>
  );
}

function InstallSnippet() {
  const code = `import { createClient } from "lexem-sdk";

const lexem = createClient({
  apiKey: process.env.LEXEM_API_KEY!,
});

const prompt = await lexem.render(
  "summarizer",
  { article: text },
  { env: "production" },
);`;

  return (
    <section
      id="install"
      className={`${SIDE_PADDING} py-24 md:py-32 bg-white border-y border-black/10 scroll-mt-24`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,560px)] gap-12 lg:gap-20 items-center">
        <div>
          <span className="text-xs uppercase tracking-widest text-neutral-500">
            SDK · live on npm
          </span>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
            Five lines to <span className="italic">live prompts</span>.
          </h2>
          <p className="mt-4 text-lg text-neutral-700 max-w-xl">
            Ship a prompt change without redeploying your app. The SDK fetches
            the active version for the environment you ask for, caches it in
            memory, and renders <code className="font-mono bg-neutral-100 border border-black/10 px-1.5 py-0.5 text-[0.9em]">{`{{variables}}`}</code> in one call.
          </p>

          <CopySnippet text="npm install lexem-sdk" />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/docs#sdk"
              className="h-11 px-5 bg-black text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors hover:bg-neutral-800"
            >
              Read SDK docs <ArrowRight size={14} />
            </Link>
            <a
              href="https://www.npmjs.com/package/lexem-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-5 border border-black bg-white text-black text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors hover:bg-black hover:text-white"
            >
              <Package size={14} /> View on npm
            </a>
          </div>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 translate-x-[6px] translate-y-[6px] bg-white border border-black"
          />
          <div className="relative bg-neutral-900 border border-black">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">
                app.ts
              </span>
            </div>
            <pre className="px-5 py-5 text-[13px] leading-relaxed font-mono text-neutral-100 overflow-x-auto">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: GitBranch,
      title: "Real version control",
      body:
        "Commit prompts with messages. Diff any two versions, branch for experiments, merge with conflict resolution, rollback in one click.",
    },
    {
      icon: FlaskConical,
      title: "Evals that catch regressions",
      body:
        "Build test suites with typed inputs. Score with exact match, regex, or LLM-as-judge. Auto-flag scores that drop ≥5 points from the previous version.",
    },
    {
      icon: Sparkles,
      title: "AI writes your test cases",
      body:
        "Skip the blank page. Lexem reads your prompt and variables, then brainstorms a diverse set of judge-scored cases — happy paths, edge cases, refusals — in one click.",
    },
    {
      icon: ShieldAlert,
      title: "AI diff impact",
      body:
        "Every diff comes with a plain-English summary plus flagged behaviour risks: tone shifts, scope creep, weakened guardrails. Catch the thing your team would have shipped by accident.",
    },
    {
      icon: Shield,
      title: "Eval-gated deploys",
      body:
        "Three environments per project, strictly promoted dev → staging → prod. Block promotions below your eval-score threshold. Optional teammate approval on any env.",
    },
    {
      icon: BarChart3,
      title: "Token analytics built in",
      body:
        "Per-version average tokens, 30-day daily trend, per-prompt totals. Powered by eval runs and a one-line lexem.logUsage() call — no extra observability stack to plumb.",
    },
  ];

  return (
    <section id="features" className={`${SIDE_PADDING} pt-2 md:pt-4 pb-24 md:pb-32`}>
      <div className="max-w-3xl">
        <span className="text-xs uppercase tracking-widest text-neutral-500">
          What's inside
        </span>
        <h2 className="mt-3 font-serif text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
          The whole loop, <span className="italic">finally</span> sane.
        </h2>
        <p className="mt-4 text-lg text-neutral-700 max-w-2xl">
          No more silent prompt edits. No more "wait, what changed last week?".
          Every change is committed, tested, and reversible.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((f) => (
          <FeatureCard key={f.title} icon={f.icon} title={f.title} body={f.body} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof GitBranch;
  title: string;
  body: string;
}) {
  return (
    <div className="group bg-white border border-black/10 shadow-[6px_6px_0px_#000] p-7 md:p-8 transition-all duration-150 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_#000]">
      <div className="w-10 h-10 bg-black text-white flex items-center justify-center transition-transform duration-200 group-hover:rotate-[-4deg]">
        <Icon size={18} />
      </div>
      <h3 className="mt-5 font-serif text-2xl font-bold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-[15px] text-neutral-700 leading-relaxed">{body}</p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Commit your prompts",
      body:
        "Write a prompt, hit commit with a message. Every change is a versioned snapshot — typed variables, tags, branches and all.",
    },
    {
      n: "02",
      title: "Run evals against any version",
      body:
        "Write your own suite — or let Lexem auto-generate one from the prompt — then run against the model and key of your choice. See score, pass/fail, tokens, latency.",
    },
    {
      n: "03",
      title: "Diff, rollback, ship",
      body:
        "When something regresses, the AI-flagged diff impact shows what shifted. Roll back in one click, or merge an experimental branch when its eval score beats main.",
    },
  ];

  return (
    <section id="how" className={`${SIDE_PADDING} py-24 md:py-32 bg-white border-y border-black/10`}>
      <div className="max-w-3xl">
        <span className="text-xs uppercase tracking-widest text-neutral-500">
          How it works
        </span>
        <h2 className="mt-3 font-serif text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
          Three moves. <span className="italic">No magic.</span>
        </h2>
      </div>

      <ol className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <li
            key={s.n}
            className="group relative overflow-hidden border border-black/10 p-7 md:p-8 bg-neutral-50"
            style={{ "--delay": `${i * 60}ms` } as React.CSSProperties}
          >
            {/* Sweep fill */}
            <div
              className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"
              style={{ transitionDelay: `var(--delay)` }}
            />
            {/* Content */}
            <div className="relative z-10">
              <div className="font-mono text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors duration-300" style={{ transitionDelay: `var(--delay)` }}>
                {s.n}
              </div>
              <h3 className="mt-3 font-serif text-2xl font-bold tracking-tight group-hover:text-white transition-colors duration-300" style={{ transitionDelay: `var(--delay)` }}>
                {s.title}
              </h3>
              <p className="mt-2 text-[15px] text-neutral-700 leading-relaxed group-hover:text-neutral-200 transition-colors duration-300" style={{ transitionDelay: `var(--delay)` }}>
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function OpenSourceCTA({ isAuthed }: { isAuthed: boolean }) {
  return (
    <section id="open-source" className={`${SIDE_PADDING} py-24 md:py-32`}>
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 translate-x-2 translate-y-2 bg-white border border-black"
        />
      <div className="relative bg-black text-white border border-black p-10 md:p-16 grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-10">
        <div>
          <span className="text-xs uppercase tracking-widest text-neutral-400">
            100% open source
          </span>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
            Self-host it. <span className="italic">Own the loop.</span>
          </h2>
          <p className="mt-4 text-lg text-neutral-300 max-w-xl">
            Lexem runs on your Postgres, with your team's keys. No vendor lock-in,
            no usage caps, no telemetry. The whole stack is MIT-style permissive
            so you can fork it tomorrow.
          </p>
        </div>

        <div className="flex flex-col gap-3 shrink-0 md:items-end">
          <Link
            href="https://github.com/rudra016/lexem"
            className="h-12 px-6 bg-white text-black text-sm font-medium inline-flex items-center justify-center gap-2 transition-transform duration-100 active:scale-[0.97]"
          >
            <Github size={16} /> Star on GitHub
          </Link>
          <Link
            href={isAuthed ? "/dashboard" : "/signup"}
            className="h-12 px-6 border border-white/30 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors hover:bg-white hover:text-black"
          >
            {isAuthed ? "Open dashboard" : "Try the hosted demo"} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  const columns = [
    {
      heading: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "How it works", href: "#how" },
        { label: "Docs", href: "/docs" },
      ],
    },
    {
      heading: "Open source",
      links: [
        { label: "GitHub", href: "https://github.com/rudra016/lexem" },
        { label: "Self-host", href: "/docs#self-host" },
        { label: "License", href: "https://github.com/rudra016/lexem/blob/master/LICENSE" },
      ],
    },
    {
      heading: "Connect",
      links: [
        { label: "Twitter", href: "https://x.com/sudo_rudra" },
        { label: "LinkedIn", href: "https://www.linkedin.com/in/rudra-kumar-897264227/" },
        { label: "Contact", href: "mailto:rudra619kumar@gmail.com" },
      ],
    },
  ];

  return (
    <footer className={`${SIDE_PADDING} pt-16 md:pt-20 border-t border-black/10 overflow-hidden`}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 md:gap-20">
        <div>
          <Link href="/" className="group inline-flex items-center gap-1 ml-[-7px]">
            <Image
              src="/logo-no-bg.png"
              alt="Lexem"
              width={1400}
              height={629}
              style={{ height: 40, width: "auto" }}
              draggable={false}
              className="transition-transform duration-100 ease-out group-active:scale-[0.92] group-active:translate-y-[1px]"
            />
            <span className="font-serif font-semibold text-xl leading-none tracking-wide">
              Lexem
            </span>
          </Link>

          <p className="mt-5 text-sm text-neutral-500 leading-relaxed max-w-xs">
            © {new Date().getFullYear()} Lexem.<br />
            All rights reserved.
          </p>

          <div className="mt-5 flex items-center gap-2">
            <SocialLink href="https://x.com/sudo_rudra" label="X / Twitter">
              <Twitter size={15} />
            </SocialLink>
            <SocialLink
              href="https://github.com/rudra016/lexem"
              label="GitHub"
            >
              <Github size={15} />
            </SocialLink>
            <SocialLink
              href="https://www.linkedin.com/in/rudra-kumar-897264227/"
              label="LinkedIn"
            >
              <Linkedin size={15} />
            </SocialLink>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 md:gap-x-16 gap-y-8">
          {columns.map((col) => (
            <div key={col.heading}>
              <div className="text-xs uppercase tracking-widest text-neutral-500">
                {col.heading}
              </div>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-neutral-700 hover:text-black transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-16 md:mt-24 -mx-6 md:-mx-20 lg:-mx-32 xl:-mx-52">
        <h2
          aria-hidden
          className="font-serif font-black tracking-tighter leading-[0.85] text-neutral-200 select-none pointer-events-none text-center"
          style={{
            fontSize: "clamp(7rem, 21vw, 22rem)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 65%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 65%)",
          }}
        >
          LEXEM
        </h2>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="w-9 h-9 border border-black/15 bg-white text-neutral-700 inline-flex items-center justify-center transition-colors hover:bg-black hover:text-white hover:border-black"
    >
      {children}
    </Link>
  );
}
