"use client";

import { signIn } from "next-auth/react";
import React, { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@shafan.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/ueadmin",
    });
    setLoading(false);
  }

  return (
    <div className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-4 py-10">
      <div className="glass glass-3d w-full max-w-md rounded-3xl p-6">
        <h2 className="text-xl font-bold mb-4">Admin Sign In</h2>
        <p className="text-sm text-black/70 mb-4">Use the quick demo admin credentials</p>
        <form onSubmit={onSubmit} className="grid gap-3">
          <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="Admin Email" className="h-11 w-full rounded-2xl bg-black/5 px-4" required/>
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="Password" className="h-11 w-full rounded-2xl bg-black/5 px-4" required/>
          <button type="submit" className="h-11 rounded-full bg-black text-white font-semibold" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in as Admin'}
          </button>
        </form>
        <div className="mt-4 text-sm text-black/60">Demo credentials: admin@shafan.com / password123</div>
      </div>
    </div>
  );
}
