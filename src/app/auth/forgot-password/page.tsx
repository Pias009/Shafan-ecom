"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const r = await fetch("/api/auth/password/request-reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!r.ok) {
      const msg = (await r.json().catch(() => null)) as { error?: string } | null;
      setError(msg?.error ?? "An unknown error occurred.");
      return;
    }

    setMessage("If an account with that email exists, a password reset link has been sent.");
  }

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-120px)] max-w-6xl place-items-center px-4 py-10">
      <div className="glass glass-3d ring-icy w-full max-w-md rounded-3xl p-6">
        <div className="text-xs font-medium uppercase tracking-[0.25em] text-white/60">
          Forgot Password
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Reset your password
        </div>
        <div className="mt-2 text-sm text-white/70">
          Enter your email address and we will send you a link to reset your password.
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="h-11 w-full rounded-2xl bg-white/5 px-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 outline-none focus:ring-white/25"
            required
          />

          {error ? <div className="text-sm text-rose-200">{error}</div> : null}
          {message ? <div className="text-sm text-green-200">{message}</div> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black shadow-lg shadow-black/20 transition hover:translate-y-[-1px] disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-5 text-sm text-white/70">
          Remembered your password?{" "}
          <Link className="font-semibold text-white" href="/auth/sign-in">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
