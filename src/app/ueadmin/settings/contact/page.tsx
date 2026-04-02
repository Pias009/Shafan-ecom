"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface ContactSettings {
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  workingHours: string;
}

const defaultSettings: ContactSettings = {
  phone: "",
  email: "",
  address: "",
  whatsapp: "",
  workingHours: ""
};

export default function ContactSettingsPage() {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/contact")
      .then(res => res.json())
      .then(data => {
        if (data.phone || data.email || data.address) {
          setSettings(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      toast.success("Contact settings saved!");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black/20" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/ueadmin" className="text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black mb-2 block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-black text-black">Contact Settings</h1>
          <p className="text-black/40 text-sm mt-1">Update contact information displayed on website</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        {/* Phone */}
        <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="text-black/40" size={20} />
            <span className="text-xs font-black uppercase tracking-widest text-black/40">Phone Number</span>
          </div>
          <input
            type="tel"
            value={settings.phone}
            onChange={(e) => setSettings({...settings, phone: e.target.value})}
            placeholder="+971 4 123 4567"
            className="w-full h-12 px-4 bg-black/5 border border-black/10 rounded-xl font-medium focus:border-black focus:outline-none"
          />
        </div>

        {/* Email */}
        <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="text-black/40" size={20} />
            <span className="text-xs font-black uppercase tracking-widest text-black/40">Email Address</span>
          </div>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => setSettings({...settings, email: e.target.value})}
            placeholder="info@shafa.com"
            className="w-full h-12 px-4 bg-black/5 border border-black/10 rounded-xl font-medium focus:border-black focus:outline-none"
          />
        </div>

        {/* Address */}
        <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="text-black/40" size={20} />
            <span className="text-xs font-black uppercase tracking-widest text-black/40">Address</span>
          </div>
          <input
            type="text"
            value={settings.address}
            onChange={(e) => setSettings({...settings, address: e.target.value})}
            placeholder="Dubai, United Arab Emirates"
            className="w-full h-12 px-4 bg-black/5 border border-black/10 rounded-xl font-medium focus:border-black focus:outline-none"
          />
        </div>

        {/* WhatsApp */}
        <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="text-green-600" size={20} />
            <span className="text-xs font-black uppercase tracking-widest text-black/40">WhatsApp</span>
          </div>
          <input
            type="tel"
            value={settings.whatsapp}
            onChange={(e) => setSettings({...settings, whatsapp: e.target.value})}
            placeholder="+971501234567"
            className="w-full h-12 px-4 bg-black/5 border border-black/10 rounded-xl font-medium focus:border-black focus:outline-none"
          />
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-black/40" size={20} />
            <span className="text-xs font-black uppercase tracking-widest text-black/40">Working Hours</span>
          </div>
          <input
            type="text"
            value={settings.workingHours}
            onChange={(e) => setSettings({...settings, workingHours: e.target.value})}
            placeholder="Sun-Thu: 9AM - 6PM"
            className="w-full h-12 px-4 bg-black/5 border border-black/10 rounded-xl font-medium focus:border-black focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}