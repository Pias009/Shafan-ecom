"use client";

import { signIn } from "next-auth/react";
import React, { useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleMasterAdminLogin() {
    setLoading(true);
    setError("");
    
    const masterEmail = "pvs178380@gmail.com";
    const masterPassword = "pias900";
    
    try {
      const res = await signIn("credentials", {
        email: masterEmail,
        password: masterPassword,
        redirect: false,
      }, { 
        authErrorRedirect: "/ueadmin/login?error=AuthError",
      });
      
      if (res?.ok) {
        window.location.href = "/ueadmin/dashboard";
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      }, {
        authErrorRedirect: "/ueadmin/login?error=AuthError",
      });

      if (res?.ok) {
        window.location.href = "/ueadmin";
      } else {
        setError("Invalid email or password");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">SHAFAN</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Panel</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-medium text-red-400">
              {error}
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                type="email" 
                placeholder="Email"
                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-gray-500 text-sm font-medium outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div>
              <input 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                type="password" 
                placeholder="Password"
                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-gray-500 text-sm font-medium outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 rounded-xl bg-white text-black font-bold text-sm tracking-wider hover:bg-gray-100 disabled:opacity-50 transition-all"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white/5 px-4 text-xs text-gray-500 uppercase tracking-wider">or</span>
            </div>
          </div>
          
          <button
            onClick={handleMasterAdminLogin}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm tracking-wider hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">👑</span>
            {loading ? "Accessing..." : "Master Admin Access"}
          </button>
        </div>
        
        <p className="text-center text-gray-600 text-xs mt-6">
          Restricted access only
        </p>
      </div>
    </div>
  );
}
