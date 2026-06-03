"use client";

import { useEffect, useState } from "react";
import { MapPin, Save, Loader2, Edit2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface AddressData {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  address1: string;
  address2: string;
  postalCode: string;
}

const COUNTRIES = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Kuwait",
  "Bahrain",
  "Qatar",
  "Oman",
];

const COUNTRY_CODES: Record<string, string> = {
  "United Arab Emirates": "+971",
  "Saudi Arabia": "+966",
  "Kuwait": "+965",
  "Bahrain": "+973",
  "Qatar": "+974",
  "Oman": "+968",
};

const defaultForm: AddressData = {
  fullName: "",
  phone: "",
  email: "",
  country: "Saudi Arabia",
  city: "",
  address1: "",
  address2: "",
  postalCode: "",
};

export default function UserAddressManager({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<AddressData>(defaultForm);
  const [hasAddress, setHasAddress] = useState(false);

  useEffect(() => {
    async function fetchAddress() {
      try {
        const res = await fetch(`/api/admin/users/${userId}/address`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setFormData({
              fullName: data.fullName || "",
              phone: data.phone || "",
              email: data.email || "",
              country: data.country || "Saudi Arabia",
              city: data.city || "",
              address1: data.address1 || "",
              address2: data.address2 || "",
              postalCode: data.postalCode || "",
            });
            setHasAddress(true);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchAddress();
  }, [userId]);

  async function handleSave() {
    const errors: string[] = [];
    if (!formData.fullName.trim()) errors.push("Full name is required");
    if (!formData.city.trim()) errors.push("City is required");
    if (!formData.address1.trim()) errors.push("Address is required");
    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    if (errors.length > 0) {
      errors.forEach(msg => toast.error(msg));
      return;
    }

    const countryCode = COUNTRY_CODES[formData.country] || "+966";
    let rawPhone = formData.phone;
    if (rawPhone.startsWith(countryCode)) {
      rawPhone = rawPhone.slice(countryCode.length).trim();
    } else if (rawPhone.startsWith(countryCode.replace("+", ""))) {
      rawPhone = rawPhone.slice(countryCode.length - 1).trim();
    }
    const digitsOnly = rawPhone.replace(/\D/g, "");
    const finalizedPhone = digitsOnly ? `${countryCode}${digitsOnly}` : formData.phone;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, phone: finalizedPhone }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save address");
      }
      toast.success("Address saved successfully");
      setHasAddress(true);
      setEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditing(false);
    if (!hasAddress) {
      setFormData(defaultForm);
    } else {
      fetchAddress();
    }
  }

  async function fetchAddress() {
    try {
      const res = await fetch(`/api/admin/users/${userId}/address`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setFormData({
            fullName: data.fullName || "",
            phone: data.phone || "",
            email: data.email || "",
            country: data.country || "Saudi Arabia",
            city: data.city || "",
            address1: data.address1 || "",
            address2: data.address2 || "",
            postalCode: data.postalCode || "",
          });
        }
      }
    } catch {}
  }

  if (loading) {
    return (
      <section className="glass-panel p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-xl shadow-black/5">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-black/5">
          <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/20">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="font-bold text-black leading-tight">Address</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-black/20">Shipping Address</p>
          </div>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-black/20" />
        </div>
      </section>
    );
  }

  return (
    <section className="glass-panel p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-xl shadow-black/5">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/20">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="font-bold text-black leading-tight">Address</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-black/20">Shipping Address</p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition px-4 py-2 rounded-full hover:bg-black/5"
          >
            {hasAddress ? <><Edit2 size={14} /> Edit</> : <>+ Add Address</>}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">Full Name *</label>
              <input
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Full name"
                className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">Phone *</label>
              <div className="flex gap-2">
                <div className="h-11 shrink-0 flex items-center justify-center rounded-2xl bg-black/5 px-3 text-xs font-bold text-black/50">
                  {COUNTRY_CODES[formData.country] || "+966"}
                </div>
                <input
                  value={(() => {
                    const code = COUNTRY_CODES[formData.country] || "+966";
                    let p = formData.phone;
                    if (p.startsWith(code)) p = p.slice(code.length);
                    else if (p.startsWith(code.replace("+", ""))) p = p.slice(code.length - 1);
                    return p.trim();
                  })()}
                  onChange={e => {
                    const val = e.target.value.replace(/[^\d]/g, "");
                    const code = COUNTRY_CODES[formData.country] || "+966";
                    setFormData({ ...formData, phone: `${code} ${val}` });
                  }}
                  placeholder="5XX XXX XXXX"
                  maxLength={10}
                  className="h-11 flex-1 rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">Country *</label>
              <select
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value, city: "" })}
                className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all appearance-none"
              >
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">City *</label>
              <input
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">Address Line 1 *</label>
              <input
                value={formData.address1}
                onChange={e => setFormData({ ...formData, address1: e.target.value })}
                placeholder="Street, building, etc."
                className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">Address Line 2 (Optional)</label>
              <input
                value={formData.address2}
                onChange={e => setFormData({ ...formData, address2: e.target.value })}
                placeholder="Apartment, suite, etc."
                className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">Postal Code</label>
              <input
                value={formData.postalCode}
                onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="12345"
                className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-1">Email *</label>
              <input
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
            <button
              onClick={cancelEdit}
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition rounded-full"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-black text-white text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save size={14} />}
              Save Address
            </button>
          </div>
        </div>
      ) : hasAddress ? (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-bold text-black">{formData.fullName}</span>
          </div>
          <div className="text-black/60 font-semibold space-y-1">
            <p>{formData.address1}{formData.address2 ? `, ${formData.address2}` : ""}</p>
            <p>{formData.city}, {formData.country}{formData.postalCode ? ` - ${formData.postalCode}` : ""}</p>
            <p className="text-black/40">{formData.phone}</p>
            {formData.email && <p className="text-black/40">{formData.email}</p>}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 opacity-40">
          <MapPin size={40} strokeWidth={1} />
          <p className="mt-3 text-xs font-black uppercase tracking-widest text-black/40">No address on file</p>
          <p className="text-[10px] text-black/30 mt-1 font-medium">Click "Add Address" above to set one</p>
        </div>
      )}
    </section>
  );
}
