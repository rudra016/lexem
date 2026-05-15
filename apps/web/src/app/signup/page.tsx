"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error?.formErrors?.[0] ?? body.error ?? "Signup failed");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, callbackUrl: "/" });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        <h1 className="text-2xl font-semibold mb-6">Create your account</h1>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full mb-4 py-2.5 px-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-sm font-medium"
        >
          Continue with Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-neutral-500">or</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
          />
          <input
            type="password"
            placeholder="Password (8+ chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-neutral-600 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-black underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
