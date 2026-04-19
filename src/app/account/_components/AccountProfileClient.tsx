"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { User, Mail, ShieldAlert, Check, Loader2, Phone, MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AccountProfileClient() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [phone, setPhone] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/account/profile");
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      
      await update({ name, email });
      setEditing(false);
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-black/20" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="glass-panel-heavy rounded-3xl p-6 border border-black/5 shadow-xl md:flex md:items-stretch md:gap-6">
          <div className="md:w-1/3 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-black/10 flex items-center justify-center text-3xl text-black">{/* avatar placeholder */}
              U
            </div>
          </div>
          <div className="md:w-2/3 flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold tracking-tight text-black">Profile Details</h2>
              <button 
                onClick={() => {
                  if (editing) handleSave();
                  else setEditing(true);
                }}
                disabled={loading}
                className="glass-panel-heavy rounded-full px-6 py-2 text-sm font-bold text-black border border-black/10 transition hover:bg-black/5 active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? <Check className="w-4 h-4" /> : null}
                {editing ? "Save Changes" : "Edit Profile"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={"glass-panel rounded-2xl p-5 flex items-start gap-4 transition " + (editing ? 'ring-2 ring-black/10 bg-black/[0.01]' : 'hover:bg-black/[0.02]')}>
                <div className="p-3 bg-black/5 rounded-xl ring-1 ring-black/10">
                  <User className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50">Full Name</label>
                  {editing ? (
                    <input 
                      autoFocus
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="mt-1 w-full bg-transparent text-lg font-bold text-black outline-none border-b border-black/10 focus:border-black"
                    />
                  ) : (
                    <div className="mt-1 text-lg font-bold text-black">{session?.user?.name || "Not provided"}</div>
                  )}
                </div>
              </div>

              <div className={"glass-panel rounded-2xl p-5 flex items-start gap-4 transition " + (editing ? 'ring-2 ring-black/10 bg-black/[0.01]' : 'hover:bg-black/[0.02]')}>
                <div className="p-3 bg-black/5 rounded-xl ring-1 ring-black/10">
                  <Mail className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50">Email Address</label>
                  {editing ? (
                    <input 
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="mt-1 w-full bg-transparent text-lg font-bold text-black outline-none border-b border-black/10 focus:border-black"
                    />
                  ) : (
                    <div className="mt-1 text-lg font-bold text-black">{email || "Not provided"}</div>
                  )}
                </div>
              </div>

              <div className={"glass-panel rounded-2xl p-5 flex items-start gap-4 transition " + (editing ? 'ring-2 ring-black/10 bg-black/[0.01]' : 'hover:bg-black/[0.02]')}>
                <div className="p-3 bg-black/5 rounded-xl ring-1 ring-black/10">
                  <Phone className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50">Phone Number</label>
                  {editing ? (
                    <input 
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+971 5X XXX XXXX"
                      className="mt-1 w-full bg-transparent text-lg font-bold text-black outline-none border-b border-black/10 focus:border-black"
                    />
                  ) : (
                    <div className="mt-1 text-lg font-bold text-black">{phone || "Not provided"}</div>
                  )}
                </div>
              </div>

              <Link href="/account/address" className="glass-panel rounded-2xl p-5 flex items-center justify-between gap-4 hover:bg-black/[0.02] group transition">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-black/5 rounded-xl ring-1 ring-black/10">
                    <MapPin className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50">Shipping Address</label>
                    <div className="mt-1 text-lg font-bold text-black">Manage Addresses</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-black/20 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Role - Read Only */}
              <div className="glass-panel rounded-2xl p-5 flex items-start gap-4 opacity-70">
                <div className="p-3 bg-black/5 rounded-xl ring-1 ring-black/10">
                  <ShieldAlert className="w-5 h-5 text-black" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50">Account Type</label>
                  <div className="mt-1 text-lg font-bold text-black capitalize">{session?.user?.role || "Customer"}</div>
                </div>
              </div>
            </div>

            {editing && (
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setEditing(false);
                    setName(session?.user?.name || "");
                  }}
                  className="px-4 py-2 text-sm font-bold text-black/40 hover:text-black transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
