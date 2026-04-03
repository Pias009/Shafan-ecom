"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Mail, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams?.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setSuccess(true);
        toast.success("Account initialized!");
        setTimeout(() => router.push("/ueadmin/login"), 2000);
      } else {
        const err = await res.json();
        toast.error(err.error || "Initialization failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4 text-center">
        <div className="max-w-md w-full glass-panel-heavy p-12 rounded-[3.5rem] bg-white border border-black/5 shadow-2xl space-y-6">
           <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
             <CheckCircle2 size={40} />
           </div>
           <h1 className="text-3xl font-black text-black">Initialization Complete</h1>
           <p className="text-sm font-medium text-black/40 leading-relaxed">Your account is now ready. Redirecting to login terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4">
      <div className="max-w-md w-full glass-panel-heavy p-10 rounded-[3.5rem] bg-white border border-black/5 shadow-2xl space-y-10">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
             <div className="p-4 bg-black rounded-3xl text-white shadow-xl shadow-black/20">
                <ShieldCheck size={32} />
             </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-black">Admin Initialization</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20">Identity Verification Required</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-6">
           <div className="space-y-4">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-4">Initialization Email</label>
                 <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter invited email"
                      className="w-full h-14 pl-14 pr-6 rounded-3xl bg-black/5 border-none font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    />
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-4">Set Security Password</label>
                 <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Min 8 characters"
                      className="w-full h-14 pl-14 pr-6 rounded-3xl bg-black/5 border-none font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    />
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-4">Confirm Identity Password</label>
                 <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat password"
                      className="w-full h-14 pl-14 pr-6 rounded-3xl bg-black/5 border-none font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                    />
                 </div>
              </div>
           </div>

           <button 
             type="submit" 
             disabled={loading}
             className="w-full h-16 rounded-full bg-black text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
           >
             {loading ? <Loader2 className="animate-spin" size={20} /> : "Finalize Authorization"}
           </button>
        </form>

        <div className="p-6 bg-black/[0.02] rounded-3xl border border-black/5">
           <p className="text-[9px] font-medium text-black/40 uppercase tracking-widest leading-loose text-center">
             Notice: This terminal is for authorized administrative staff only. Your IP and login attempts are strictly monitored for system security.
           </p>
        </div>
      </div>
    </div>
  );
}
