"use client";

import { signIn } from "next-auth/react";
import React, { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@shafan.com");
  const [password, setPassword] = useState("Admin@Shafan2024");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mfaSent, setMfaSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const mfaRes = await fetch("/api/auth/mfa/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const mfaData = await mfaRes.json();

      if (!mfaRes.ok) {
        throw new Error(mfaData.error || "Login initiation failed");
      }

      if (mfaData.mfaRequired) {
        setMfaSent(true);
        setLoading(false);
        return;
      }

      // If NO MFA required (standard user reaching admin? should be blocked later by Guard)
      // Or if user is already logged in? Actually, we should only reach here for users.
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.ok) {
        window.location.href = "/ueadmin";
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (mfaSent) {
    return (
      <div className="mx-auto grid min-h-screen max-w-2xl place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-2xl shadow-black/5 text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-black text-white text-3xl font-black">✉️</div>
            <h2 className="text-2xl font-black text-black">Check Your Email</h2>
            <p className="mt-2 text-sm text-black/50 leading-relaxed px-4">
              A secure magic link has been sent to <span className="font-bold text-black">{email}</span>. Click it to verify your identity and login.
            </p>
          </div>
          
          <div className="mt-8 space-y-3">
             <button onClick={() => setMfaSent(false)} className="text-xs font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors">
                Back to Login
             </button>
          </div>
          
          <div className="mt-8 rounded-2xl bg-black/5 p-4 text-xs text-black/50">
             <p>This link will expire in 10 minutes. Please check your junk/spam folder if you don't see it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-2xl place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-2xl shadow-black/5">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white text-2xl font-black">S</div>
          <h2 className="text-2xl font-black text-black">Admin Panel</h2>
          <p className="mt-1 text-sm text-black/50">Shafan Global — Admin Access Only</p>
        </div>
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="grid gap-3">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-black/40 mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Admin Email"
              className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-black/20" required />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-black/40 mb-1">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password"
              className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-black/20" required />
          </div>
          <button type="submit" disabled={loading}
            className="mt-1 h-12 rounded-full bg-black text-white font-bold text-sm tracking-widest hover:bg-black/80 disabled:opacity-50 transition-all">
            {loading ? "Signing in…" : "Sign In to Admin"}
          </button>
        </form>
        <div className="mt-6 rounded-xl bg-black/5 p-4 text-xs text-black/50 space-y-1">
          <p className="font-black text-black/60 uppercase tracking-widest text-[10px] mb-2">Login Credentials</p>
          <p>📧 <span className="font-bold text-black">admin@shafan.com</span></p>
          <p>🔑 <span className="font-bold text-black">Admin@Shafan2024</span></p>
        </div>
      </div>
    </div>
  );
}
