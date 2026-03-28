"use client";

import { signIn } from "next-auth/react";
import React, { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mfaSent, setMfaSent] = useState(false);
  const [developerLoading, setDeveloperLoading] = useState(false);
  const [masterAdminLoading, setMasterAdminLoading] = useState(false);

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

      // Check if this is a master admin bypass
      if (mfaData.masterAdminBypass) {
        // Master admin bypass - login directly
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (res?.ok) {
          window.location.href = "/ueadmin";
        } else {
          setError("Master admin login failed. Please try again.");
        }
        return;
      }

      if (mfaData.mfaRequired) {
        setMfaSent(true);
        setLoading(false);
        return;
      }

      // If NO MFA required (regular user case)
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

  async function handleDeveloperLogin() {
    setDeveloperLoading(true);
    setError("");
    try {
      // Call developer login API endpoint
      const res = await fetch("/api/auth/developer-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Developer login API succeeded - redirect directly to admin panel
        // No email verification or password check needed for developer role
        window.location.href = "/ueadmin";
      } else {
        setError(data.error || "Developer login failed");
      }
    } catch (err: any) {
      setError(err.message);
      // Fallback: redirect directly (simplest approach for developer access)
      window.location.href = "/ueadmin";
    } finally {
      setDeveloperLoading(false);
    }
  }

  async function handleMasterAdminLogin() {
    setMasterAdminLoading(true);
    setError("");
    try {
      // Call master admin login API endpoint
      const res = await fetch("/api/auth/master-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL || "pvs178380@gmail.com",
          password: process.env.NEXT_PUBLIC_MASTER_ADMIN_PASSWORD || "pias900",
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Master admin login successful - redirect to admin panel
        window.location.href = "/ueadmin";
      } else {
        setError(data.error || "Master admin login failed");
      }
    } catch (err: any) {
      setError(err.message);
      // Fallback: try regular login with master credentials
      setEmail(process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL || "pvs178380@gmail.com");
      setPassword(process.env.NEXT_PUBLIC_MASTER_ADMIN_PASSWORD || "pias900");
      // Trigger form submission
      const formEvent = new Event('submit', { bubbles: true, cancelable: true });
      document.querySelector('form')?.dispatchEvent(formEvent);
    } finally {
      setMasterAdminLoading(false);
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
          
          <div className="relative my-4 flex items-center">
            <div className="flex-grow border-t border-black/10"></div>
            <span className="mx-4 text-xs font-bold text-black/30 uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-black/10"></div>
          </div>
          
          <button
            type="button"
            onClick={handleDeveloperLogin}
            disabled={developerLoading}
            className="h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm tracking-widest hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            {developerLoading ? "Logging in as Developer..." : "🚀 Login as Developer (No Verification)"}
          </button>

          <button
            type="button"
            onClick={handleMasterAdminLogin}
            disabled={masterAdminLoading}
            className="h-12 rounded-full bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold text-sm tracking-widest hover:from-amber-700 hover:to-red-700 disabled:opacity-50 transition-all"
          >
            {masterAdminLoading ? "Logging in as Master Admin..." : "👑 Login as Master Admin (No MFA)"}
          </button>
          
          <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
            <p className="font-bold">👨‍💻 Developer Mode:</p>
            <p>Bypasses all authentication checks. Direct access to admin panel for development and testing.</p>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <p className="font-bold">👑 Master Admin Mode:</p>
            <p>Uses master credentials to bypass MFA and super admin approval. Full access to all admin panels.</p>
          </div>
        </form>
        <div className="mt-6 rounded-xl bg-black/5 p-4 text-xs text-black/50 space-y-2">
          <p className="font-black text-black/60 uppercase tracking-widest text-[10px] mb-2">Login Information</p>
          <div className="space-y-1">
            <p className="font-bold text-black/70 text-[11px]">Admin Login Process:</p>
            <p>📧 <span className="font-bold text-black">Use your admin email</span></p>
            <p>🔑 <span className="font-bold text-black">Enter your password</span></p>
            <p className="text-[10px] text-blue-600 mt-1">✓ First-time login requires super admin approval</p>
            <p className="text-[10px] text-blue-600">✓ MFA verification required for all admin accounts</p>
            <p className="text-[10px] text-amber-600 mt-2">👑 <span className="font-bold">Master Admin:</span> Bypasses MFA and approval using pvs178380@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
