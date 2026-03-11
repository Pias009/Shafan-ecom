"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!r.ok) {
      const msg = (await r.json().catch(() => null)) as { error?: string } | null;
      setError(msg?.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      window.location.href = "/auth/sign-in";
      return;
    }

    window.location.href = "/";
  }

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-120px)] max-w-6xl place-items-center px-4 py-10">
      <div className="glass glass-3d ring-icy w-full max-w-md rounded-3xl p-6">
        <div className="text-xs font-medium uppercase tracking-[0.25em] text-white/60">
          Sign up
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Create your account
        </div>
        <div className="mt-2 text-sm text-white/70">
          After signup we’ll sign you in automatically.
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Name"
            className="h-11 w-full rounded-2xl bg-white/5 px-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 outline-none focus:ring-white/25"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="h-11 w-full rounded-2xl bg-white/5 px-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 outline-none focus:ring-white/25"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password (min 6)"
            className="h-11 w-full rounded-2xl bg-white/5 px-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 outline-none focus:ring-white/25"
            required
            minLength={6}
          />

          {error ? <div className="text-sm text-rose-200">{error}</div> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black shadow-lg shadow-black/20 transition hover:translate-y-[-1px] disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="mt-5 text-sm text-white/70">
          Have an account?{" "}
          <Link className="font-semibold text-white" href="/auth/sign-in">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

