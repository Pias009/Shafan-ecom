"use client";

import { signIn } from "next-auth/react";
import React, { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mfaSent, setMfaSent] = useState(false);
  const [showMasterAdminBypass, setShowMasterAdminBypass] = useState(false);
  const [developerLoading, setDeveloperLoading] = useState(false);

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

      // Check if this is master admin bypass
      if (mfaData.masterAdminBypass) {
        // Show master admin bypass UI instead of automatically signing in
        setShowMasterAdminBypass(true);
        setLoading(false);
        return;
      }

      // If NO MFA required and NOT master admin (regular user case)
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

  if (showMasterAdminBypass) {
    return (
      <div className="mx-auto grid min-h-screen max-w-2xl place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-2xl shadow-black/5 text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-black text-white text-3xl font-black">👑</div>
            <h2 className="text-2xl font-black text-black">Master Admin Detected</h2>
            <p className="mt-2 text-sm text-black/50 leading-relaxed px-4">
              You are logging in as <span className="font-bold text-black">{email}</span> (Master Admin).
              Click the button below to bypass MFA and access the admin panel directly.
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                  });
                  
                  if (res?.ok) {
                    window.location.href = "/ueadmin";
                  } else {
                    setError("Authentication failed. Please try again.");
                    setShowMasterAdminBypass(false);
                  }
                } catch (err: any) {
                  setError(err.message);
                  setShowMasterAdminBypass(false);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full h-12 rounded-full bg-black text-white font-bold text-sm tracking-widest hover:bg-black/80 disabled:opacity-50 transition-all"
            >
              {loading ? "Signing in..." : "Bypass MFA & Enter Admin Panel"}
            </button>
            
            <button
              onClick={() => setShowMasterAdminBypass(false)}
              className="text-xs font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors"
            >
              Back to Login
            </button>
          </div>
          
          <div className="mt-8 rounded-2xl bg-yellow-50 border border-yellow-200 p-4 text-xs text-yellow-800">
            <p className="font-bold">⚠️ Security Notice:</p>
            <p>Master admin bypass is only available for verified super administrators. This action will log you in without MFA verification.</p>
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
          
          <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
            <p className="font-bold">👨‍💻 Developer Mode:</p>
            <p>Bypasses all authentication checks. Direct access to admin panel for development and testing.</p>
          </div>
        </form>
        <div className="mt-6 rounded-xl bg-black/5 p-4 text-xs text-black/50 space-y-2">
          <p className="font-black text-black/60 uppercase tracking-widest text-[10px] mb-2">Login Credentials</p>
          <div className="space-y-1">
            <p className="font-bold text-black/70 text-[11px]">Regular Admin (MFA Required):</p>
            <p>📧 <span className="font-bold text-black">admin@shafan.com</span></p>
            <p>🔑 <span className="font-bold text-black">Admin@Shafan2024</span></p>
          </div>
          <div className="pt-2 border-t border-black/10 space-y-1">
            <p className="font-bold text-black/70 text-[11px]">Master Admin (MFA Bypass):</p>
            <p>👑 <span className="font-bold text-black">pvs178380@gmail.com</span></p>
            <p>🔑 <span className="font-bold text-black">pias900</span></p>
            <p className="text-[10px] text-green-600 mt-1">✓ Direct access to admin panel without MFA verification</p>
          </div>
        </div>
      </div>
    </div>
  );
}
