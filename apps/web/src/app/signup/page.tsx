"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Spinner } from "@/components/spinner";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      setError(
        body.error?.formErrors?.[0] ??
          body.error ??
          "Signup failed"
      );

      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/logo-bg.png"
            alt="Lexem"
            width={90}
            height={90}
            className="object-contain"
            priority
          />

          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Lexem
          </h1>
        </div>

        {/* Card */}
        <div
          className="
            bg-white rounded-2xl border border-black/10 p-8
            shadow-[6px_6px_0px_#000]
          "
        >
          {/* Google */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="
            w-full mb-5 h-11 rounded-xl
            border border-black
            bg-white text-black
            text-sm font-medium
            transition-all
            hover:bg-black hover:text-white
            inline-flex items-center justify-center gap-3
          "
            >
          <Image
            src="/google-icon.svg"
            alt="Google"
            width={18}
            height={18}
            className="object-contain"
          />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>

            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-neutral-500 uppercase tracking-widest">
                or
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="
                w-full px-4 py-3 rounded-xl
                border border-neutral-300
                bg-white text-sm
                outline-none
                focus:border-black
              "
            />

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

           <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password (8+ chars)"
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
    className="
      absolute right-3 top-1/2 -translate-y-1/2
      text-neutral-500 hover:text-black
      transition-colors
    "
  >
    {showPassword ? (
      <EyeOff size={18} />
    ) : (
      <Eye size={18} />
    )}
  </button>
</div>
            {error && (
              <p className="text-sm text-red-600 font-medium">
                {error}
              </p>
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
              {loading ? "Creating" : "Create account"}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-sm text-neutral-600 text-center">
            Been here before?{" "}
            <Link
              href="/login"
              className="text-black underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}