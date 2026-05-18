"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Copy, Check } from "lucide-react";
import { Spinner } from "@/components/spinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong");
      return;
    }

    const body = await res.json();
    setResetUrl(body.resetUrl ?? null);
    setSubmitted(true);
  }

  async function copyLink() {
    if (!resetUrl) return;
    await navigator.clipboard.writeText(resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/logo-no-bg.png"
            alt="Lexem"
            width={130}
            height={90}
            className="object-contain"
            draggable={false}
            priority
          />
          <h1 className="mt-3 text-3xl font-black tracking-tight">Lexem</h1>
        </div>

        <div className="bg-white rounded-2xl border border-black/10 p-8 shadow-[6px_6px_0px_#000]">
          <h2 className="text-xl font-bold tracking-tight mb-1">
            Forgot your password?
          </h2>
          <p className="text-sm text-neutral-600 mb-6">
            Enter your email and we&apos;ll generate a one-hour reset link.
          </p>

          {!submitted ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="
                  w-full px-4 py-3 rounded-xl
                  border border-neutral-300
                  bg-white text-sm
                  outline-none
                  focus:border-black
                "
              />

              {error && (
                <p className="text-sm text-red-600 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full h-11 rounded-xl
                  bg-black text-white
                  text-sm font-medium
                  disabled:opacity-50
                  inline-flex items-center justify-center gap-2
                  transition-all
                  hover:translate-x-[2px]
                  hover:translate-y-[2px]
                "
              >
                {loading && <Spinner size={14} />}
                {loading ? "Generating" : "Generate reset link"}
              </button>
            </form>
          ) : resetUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-700">
                Use this link within the next hour to reset your password:
              </p>
              <div className="flex items-stretch gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 bg-neutral-50 text-xs font-mono break-all">
                  {resetUrl}
                </code>
                <button
                  onClick={copyLink}
                  aria-label="Copy reset link"
                  className="
                    shrink-0 px-3 rounded-lg
                    border border-neutral-300
                    bg-white hover:bg-neutral-100
                    text-neutral-700
                    inline-flex items-center justify-center
                  "
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <Link
                href={resetUrl.replace(/^https?:\/\/[^/]+/, "")}
                className="
                  block w-full text-center h-11 rounded-xl
                  bg-black text-white text-sm font-medium
                  inline-flex items-center justify-center
                  transition-all hover:translate-x-[2px] hover:translate-y-[2px]
                "
              >
                Open reset page
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-neutral-700">
                No account is registered with that email, or it was created via
                Google sign-in. Double-check the address and try again.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
                className="
                  w-full h-11 rounded-xl
                  border border-neutral-300
                  bg-white hover:bg-neutral-100
                  text-sm font-medium text-neutral-700
                "
              >
                Try a different email
              </button>
            </div>
          )}

          <p className="mt-6 text-sm text-neutral-600 text-center">
            Remembered it?{" "}
            <Link
              href="/login"
              className="text-black underline underline-offset-2"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
