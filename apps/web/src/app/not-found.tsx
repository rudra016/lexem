import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Home, GitBranch } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "The page you were looking for doesn't exist. Head back to Lexem — the version control and testing platform for AI prompts.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600">
          <GitBranch className="h-3.5 w-3.5" />
          <span>404 — branch not found</span>
        </div>

        <h1 className="mt-6 text-6xl md:text-7xl font-[family-name:var(--font-instrument-serif)] tracking-tight">
          404
        </h1>

        <p className="mt-4 text-lg text-neutral-700">
          This page isn't in any version of Lexem.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          The URL might be mistyped, the page may have been moved, or the version you're looking for was never committed.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2.5 text-sm text-white hover:bg-neutral-800 transition"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 hover:bg-neutral-100 transition"
          >
            Go to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 text-xs text-neutral-500">
          Looking for something specific? Try the{" "}
          <Link href="/" className="underline hover:text-neutral-900">
            landing page
          </Link>
          {" "}or{" "}
          <Link href="/login" className="underline hover:text-neutral-900">
            sign in
          </Link>
          .
        </div>
      </div>
    </main>
  );
}
