"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token.");
      setLoading(false);
      return;
    }

    const r = await fetch("/api/auth/password/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!r.ok) {
      const msg = (await r.json().catch(() => null)) as { error?: string } | null;
      setError(msg?.error ?? "An unknown error occurred.");
      return;
    }

    setMessage("Your password has been reset successfully. You can now sign in with your new password.");
  }

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-120px)] max-w-6xl place-items-center px-4 py-10">
      <div className="glass glass-3d ring-icy w-full max-w-md rounded-3xl p-6">
        <div className="text-xs font-medium uppercase tracking-[0.25em] text-black/60">
          Reset Password
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-black">
          Choose a new password
        </div>

        {message ? (
          <div className="mt-6">
            <div className="text-sm text-green-600">{message}</div>
            <Link href="/auth/sign-in" className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:translate-y-[-1px]">
              Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 grid gap-3">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="New Password"
              className="h-11 w-full rounded-2xl bg-black/5 px-3 text-sm text-black placeholder:text-black/40 ring-1 ring-black/10 outline-none focus:ring-black/25"
              required
              minLength={6}
            />
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Confirm New Password"
              className="h-11 w-full rounded-2xl bg-black/5 px-3 text-sm text-black placeholder:text-black/40 ring-1 ring-black/10 outline-none focus:ring-black/25"
              required
              minLength={6}
            />

            {error ? <div className="text-sm text-rose-500">{error}</div> : null}

            <button
              type="submit"
              disabled={loading || !token}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:translate-y-[-1px] disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            {!token && <div className="text-sm text-rose-500">No reset token found in URL.</div>}
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto grid min-h-[calc(100dvh-120px)] max-w-6xl place-items-center px-4 py-10">
        <div className="text-white/60">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
