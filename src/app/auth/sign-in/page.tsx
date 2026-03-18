"use client";
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

import { Suspense } from "react";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-120px)] max-w-6xl place-items-center px-4 py-10">
      <div className="glass glass-3d ring-icy w-full max-w-md rounded-3xl p-6">
        <div className="text-xs font-medium uppercase tracking-[0.25em] text-black/60">
          Sign in
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-black">
          Welcome back
        </div>
        <div className="mt-2 text-sm text-black/70">
          Use your email + password to access your account.
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm text-black placeholder:text-black/40 ring-1 ring-black/10 outline-none focus:ring-black/25"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm text-black placeholder:text-black/40 ring-1 ring-black/10 outline-none focus:ring-black/25"
            required
            minLength={6}
          />

          <div className="mt-1 text-right text-sm">
            <Link className="text-black/70 font-medium hover:text-black underline-offset-4 hover:underline" href="/auth/forgot-password">
              Forgot password?
            </Link>
          </div>

          {error ? <div className="text-sm text-rose-200">{error}</div> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          
          <div className="relative mt-8 mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/5" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-cream px-2 text-black/40 font-bold tracking-widest">Quick Access</span></div>
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("user@shafan.com");
                setPassword("password123");
              }}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-black text-white text-sm font-bold shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              Demo Login
            </button>
          </div>
        </form>

        <div className="mt-6 text-sm text-black/70 font-display italic text-center">
          No account?{" "}
          <Link className="font-bold text-black underline underline-offset-4" href="/auth/sign-up">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Auto-redirect SUPERADMIN to the Super Admin Console after login
  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.role === 'SUPERADMIN') {
      router.replace('/ueadmin/super');
    }
  }, [session, status, router]);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
