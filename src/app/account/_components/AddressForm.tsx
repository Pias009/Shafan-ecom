"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { MapPin, Phone, Mail, Globe, Home, Send, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";

export default function AddressForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setHasAddress = useCartStore(state => state.setHasAddress);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    country: "",
    city: "",
    address1: "",
    address2: "",
    postalCode: "",
  });

  useEffect(() => {
    async function fetchAddress() {
      try {
        const res = await fetch("/api/account/address");
        if (res.ok) {
          const data = await res.json();
          if (data) setFormData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAddress();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      toast.success("Address saved successfully!");
      
      // Update cart store to reflect that user now has an address
      setHasAddress(true);
      
      const red = searchParams?.get("redirect");
      if (red === "order") {
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-black/20" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="glass-panel-heavy rounded-3xl p-8 border border-black/5 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-black">Shipping Address</h2>
            <p className="text-sm text-black/50 mt-1 font-medium">Required for completing orders.</p>
          </div>
          <button 
            type="submit"
            disabled={saving}
            className="glass-panel-heavy bg-black text-white rounded-full px-8 py-2.5 text-sm font-bold shadow-lg shadow-black/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Address
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Full Name</label>
            <div className="relative">
              <input 
                required
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                placeholder="John Doe"
                className="w-full glass-panel rounded-2xl px-5 py-3.5 text-black font-bold outline-none ring-1 ring-black/5 focus:ring-black/20 transition placeholder:text-black/20"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Contact Email</label>
            <input 
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="john@example.com"
              className="w-full glass-panel rounded-2xl px-5 py-3.5 text-black font-bold outline-none ring-1 ring-black/5 focus:ring-black/20 transition placeholder:text-black/20"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Phone Number</label>
            <input 
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="+1 234 567 890"
              className="w-full glass-panel rounded-2xl px-5 py-3.5 text-black font-bold outline-none ring-1 ring-black/5 focus:ring-black/20 transition placeholder:text-black/20"
            />
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Country</label>
            <input 
              required
              value={formData.country}
              onChange={e => setFormData({...formData, country: e.target.value})}
              placeholder="United States"
              className="w-full glass-panel rounded-2xl px-5 py-3.5 text-black font-bold outline-none ring-1 ring-black/5 focus:ring-black/20 transition placeholder:text-black/20"
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">City</label>
            <input 
              required
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
              placeholder="New York"
              className="w-full glass-panel rounded-2xl px-5 py-3.5 text-black font-bold outline-none ring-1 ring-black/5 focus:ring-black/20 transition placeholder:text-black/20"
            />
          </div>

          {/* Postal Code */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Postal Code</label>
            <input 
              required
              value={formData.postalCode}
              onChange={e => setFormData({...formData, postalCode: e.target.value})}
              placeholder="10001"
              className="w-full glass-panel rounded-2xl px-5 py-3.5 text-black font-bold outline-none ring-1 ring-black/5 focus:ring-black/20 transition placeholder:text-black/20"
            />
          </div>

          {/* Address 1 */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Street Address</label>
            <input 
              required
              value={formData.address1}
              onChange={e => setFormData({...formData, address1: e.target.value})}
              placeholder="123 Luxury Ave"
              className="w-full glass-panel rounded-2xl px-5 py-3.5 text-black font-bold outline-none ring-1 ring-black/5 focus:ring-black/20 transition placeholder:text-black/20"
            />
          </div>

          {/* Address 2 */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Apartment, suite, etc. (Optional)</label>
            <input 
              value={formData.address2}
              onChange={e => setFormData({...formData, address2: e.target.value})}
              placeholder="Suite 404"
              className="w-full glass-panel rounded-2xl px-5 py-3.5 text-black font-bold outline-none ring-1 ring-black/5 focus:ring-black/20 transition placeholder:text-black/20"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
