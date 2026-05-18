"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Spinner } from "@/components/spinner";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not reset password");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
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
            Set a new password
          </h2>
          <p className="text-sm text-neutral-600 mb-6">
            Pick something at least 8 characters long.
          </p>

          {!token ? (
            <div className="space-y-3">
              <p className="text-sm text-red-600 font-medium">
                Missing reset token. Open the link from the forgot-password page.
              </p>
              <Link
                href="/forgot-password"
                className="
                  block w-full text-center h-11 rounded-xl
                  border border-neutral-300
                  bg-white hover:bg-neutral-100
                  text-sm font-medium text-neutral-700
                  inline-flex items-center justify-center
                "
              >
                Request a reset link
              </Link>
            </div>
          ) : done ? (
            <p className="text-sm text-emerald-700 font-medium">
              Password updated. Redirecting to sign in…
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password (8+ chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="
                    w-full px-4 py-3 pr-12 rounded-xl
                    border border-neutral-300
                    bg-white text-sm
                    outline-none
                    focus:border-black
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    text-neutral-500 hover:text-black
                    transition-colors
                  "
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
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
                {loading ? "Updating" : "Update password"}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-neutral-600 text-center">
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
