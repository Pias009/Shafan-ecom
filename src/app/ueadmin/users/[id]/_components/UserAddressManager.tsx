"use client";

import { useEffect, useState } from "react";
import { MapPin, Save, Loader2, Edit2, ChevronDown } from "lucide-react";
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
  area_name: string;
  block_no: string;
  zone: string;
  region: string;
}

const COUNTRIES = ["United Arab Emirates", "Saudi Arabia", "Kuwait", "Bahrain", "Qatar", "Oman"];

const COUNTRY_CODES: Record<string, string> = {
  "United Arab Emirates": "+971",
  "Saudi Arabia": "+966",
  Kuwait: "+965",
  Bahrain: "+973",
  Qatar: "+974",
  Oman: "+968",
};

const COUNTRY_ISO: Record<string, string> = {
  "United Arab Emirates": "AE",
  "Saudi Arabia": "SA",
  Kuwait: "KW",
  Bahrain: "BH",
  Qatar: "QA",
  Oman: "OM",
};

const UAE_REGIONS = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al-Khaimah", "Fujairah", "Al-Ain"];

type FieldRequired = true | false | "optional";
interface CountryFields {
  blockNo: FieldRequired;
  zone: FieldRequired;
  areaLabel: string;
  cityName: boolean;
  region: FieldRequired | "dropdown";
}

const FIELD_CONFIG: Record<string, CountryFields> = {
  AE: { blockNo: false, zone: false, areaLabel: "Area Name", cityName: true, region: "dropdown" },
  KW: { blockNo: true, zone: false, areaLabel: "Area / City Name", cityName: false, region: false },
  BH: { blockNo: "optional", zone: false, areaLabel: "Area Name", cityName: true, region: false },
  QA: { blockNo: false, zone: "optional", areaLabel: "Area Name", cityName: true, region: false },
  OM: { blockNo: false, zone: false, areaLabel: "Area Name", cityName: true, region: false },
  SA: { blockNo: false, zone: false, areaLabel: "Area Name", cityName: true, region: true },
};

const defaultForm: AddressData = {
  fullName: "", phone: "", email: "", country: "United Arab Emirates",
  city: "", address1: "", address2: "", postalCode: "",
  area_name: "", block_no: "", zone: "", region: "",
};

function formatAddressDisplay(d: AddressData): string {
  const parts: string[] = [];
  if (d.address2) parts.push(d.address2);
  if (d.address1) parts.push(d.address1);
  if (d.block_no) parts.push(`Block ${d.block_no}`);
  if (d.zone) parts.push(`Zone ${d.zone}`);
  if (d.area_name) parts.push(d.area_name);
  if (d.city) parts.push(d.city);
  if (d.region) parts.push(d.region);
  if (d.country) parts.push(d.country);
  return parts.join(", ");
}

export default function UserAddressManager({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<AddressData>(defaultForm);
  const [hasAddress, setHasAddress] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);

  const isoCode = COUNTRY_ISO[formData.country] || "AE";
  const fieldCfg = FIELD_CONFIG[isoCode] || FIELD_CONFIG["AE"];

  async function loadAddress() {
    try {
      const res = await fetch(`/api/admin/users/${userId}/address`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const countryName = COUNTRIES.find(c => COUNTRY_ISO[c] === data.country) || data.country || "United Arab Emirates";
          setFormData({
            fullName: data.fullName || "",
            phone: data.phone || "",
            email: data.email || "",
            country: countryName,
            city: data.city || "",
            address1: data.address1 || "",
            address2: data.address2 || "",
            postalCode: data.postalCode || "",
            area_name: data.area_name || "",
            block_no: data.block_no || "",
            zone: data.zone || "",
            region: data.region || "",
          });
          setHasAddress(true);
        }
      }
    } catch {}
  }

  useEffect(() => {
    loadAddress().finally(() => setLoading(false));
  }, [userId]);

  async function handleSave() {
    const errors: string[] = [];
    if (!formData.fullName.trim()) errors.push("Full name is required");
    if (!formData.address1.trim()) errors.push("Street / Road is required");
    if (!formData.area_name.trim()) errors.push(`${fieldCfg.areaLabel} is required`);
    if (fieldCfg.cityName && !formData.city.trim()) errors.push("City name is required");
    if (fieldCfg.blockNo === true && !formData.block_no.trim()) errors.push("Block No. is required");
    if (fieldCfg.region === true && !formData.region.trim()) errors.push("Region is required");
    if (fieldCfg.region === "dropdown" && !formData.region.trim()) errors.push("Please select an emirate");
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) errors.push("Valid email is required");

    if (errors.length > 0) { errors.forEach(msg => toast.error(msg)); return; }

    const code = COUNTRY_CODES[formData.country] || "+971";
    let rawPhone = formData.phone;
    if (rawPhone.startsWith(code)) rawPhone = rawPhone.slice(code.length).trim();
    else if (rawPhone.startsWith(code.replace("+", ""))) rawPhone = rawPhone.slice(code.length - 1).trim();
    const digits = rawPhone.replace(/\D/g, "");
    const finalPhone = digits ? `${code}${digits}` : formData.phone;

    const isoForSave = COUNTRY_ISO[formData.country] || "AE";

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          country: isoForSave,
          phone: finalPhone,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to save"); }
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

  const inputCls = "h-11 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all";
  const labelCls = "text-[9px] font-black uppercase tracking-widest text-black/40 ml-1";

  if (loading) {
    return (
      <section className="glass-panel p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-xl shadow-black/5">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-black/5">
          <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/20"><MapPin size={20} /></div>
          <div>
            <h3 className="font-bold text-black leading-tight">Address</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-black/20">Shipping Address</p>
          </div>
        </div>
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-black/20" /></div>
      </section>
    );
  }

  return (
    <section className="glass-panel p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-xl shadow-black/5">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/20"><MapPin size={20} /></div>
          <div>
            <h3 className="font-bold text-black leading-tight">Address</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-black/20">Shipping Address</p>
          </div>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition px-4 py-2 rounded-full hover:bg-black/5">
            {hasAddress ? <><Edit2 size={14} /> Edit</> : <>+ Add Address</>}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className={labelCls}>Full Name *</label>
              <input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Full name" className={inputCls} />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className={labelCls}>Phone *</label>
              <div className="flex gap-2">
                <div className="h-11 shrink-0 flex items-center justify-center rounded-2xl bg-black/5 px-3 text-xs font-bold text-black/50">
                  {COUNTRY_CODES[formData.country] || "+971"}
                </div>
                <input
                  value={(() => { const c = COUNTRY_CODES[formData.country] || "+971"; let p = formData.phone; if (p.startsWith(c)) p = p.slice(c.length); return p.trim(); })()}
                  onChange={e => { const val = e.target.value.replace(/[^\d]/g, ""); setFormData({...formData, phone: `${COUNTRY_CODES[formData.country] || "+971"} ${val}`}); }}
                  placeholder="5XX XXX XXXX" maxLength={10}
                  className="h-11 flex-1 rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className={labelCls}>Email *</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" className={inputCls} />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className={labelCls}>Country *</label>
              <select value={formData.country} onChange={e => setFormData({...formData, country: e.target.value, city: "", area_name: "", block_no: "", zone: "", region: ""})}
                className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all appearance-none">
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* House / Building */}
            <div className="md:col-span-2 space-y-1.5">
              <label className={labelCls}>House No. / Building Name *</label>
              <input value={formData.address2} onChange={e => setFormData({...formData, address2: e.target.value})} placeholder="House number or building name" className={inputCls} />
            </div>

            {/* Street / Road */}
            <div className="md:col-span-2 space-y-1.5">
              <label className={labelCls}>Street / Road *</label>
              <input value={formData.address1} onChange={e => setFormData({...formData, address1: e.target.value})} placeholder="Street name or road" className={inputCls} />
            </div>

            {/* Block No — Kuwait mandatory, Bahrain optional */}
            {fieldCfg.blockNo !== false && (
              <div className="space-y-1.5">
                <label className={labelCls}>Block No.{fieldCfg.blockNo === "optional" ? " (Optional)" : " *"}</label>
                <input value={formData.block_no} onChange={e => setFormData({...formData, block_no: e.target.value})} placeholder="Block number" className={inputCls} />
              </div>
            )}

            {/* Zone — Qatar optional */}
            {fieldCfg.zone !== false && (
              <div className="space-y-1.5">
                <label className={labelCls}>Zone (Optional)</label>
                <input value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} placeholder="Zone" className={inputCls} />
              </div>
            )}

            {/* Area Name */}
            <div className={!fieldCfg.cityName ? "md:col-span-2 space-y-1.5" : "space-y-1.5"}>
              <label className={labelCls}>{fieldCfg.areaLabel} *</label>
              <input value={formData.area_name} onChange={e => setFormData({...formData, area_name: e.target.value})} placeholder={fieldCfg.areaLabel} className={inputCls} />
            </div>

            {/* City Name — all except Kuwait */}
            {fieldCfg.cityName && (
              <div className="space-y-1.5">
                <label className={labelCls}>City Name *</label>
                <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="City" className={inputCls} />
              </div>
            )}

            {/* UAE Emirate dropdown */}
            {fieldCfg.region === "dropdown" && (
              <div className="space-y-1.5 relative">
                <label className={labelCls}>Emirate / Region *</label>
                <button type="button" onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                  className="h-11 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none flex items-center justify-between transition-all">
                  <span className={formData.region ? "" : "text-black/30"}>{formData.region || "Select Emirate"}</span>
                  <ChevronDown className={`w-4 h-4 text-black/40 transition ${showRegionDropdown ? "rotate-180" : ""}`} />
                </button>
                {showRegionDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-black/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {UAE_REGIONS.map(r => (
                      <button key={r} type="button" onClick={() => { setFormData({...formData, region: r}); setShowRegionDropdown(false); }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-black/5 transition ${formData.region === r ? "bg-black text-white" : "text-black"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SA Region text */}
            {fieldCfg.region === true && (
              <div className="space-y-1.5">
                <label className={labelCls}>Region *</label>
                <input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} placeholder="e.g. Riyadh, Jeddah" className={inputCls} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
            <button onClick={() => { setEditing(false); loadAddress(); }}
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition rounded-full">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-black text-white text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10 disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save size={14} />}
              Save Address
            </button>
          </div>
        </div>
      ) : hasAddress ? (
        <div className="space-y-2 text-sm">
          <div className="font-bold text-black">{formData.fullName}</div>
          <div className="text-black/60 font-semibold space-y-0.5 text-xs">
            {formData.address2 && <p>{formData.address2}</p>}
            {formData.address1 && <p>{formData.address1}</p>}
            {formData.block_no && <p>Block {formData.block_no}</p>}
            {formData.zone && <p>Zone {formData.zone}</p>}
            {formData.area_name && <p>{formData.area_name}</p>}
            {formData.city && <p>{formData.city}</p>}
            {formData.region && <p>{formData.region}</p>}
            <p className="font-bold text-black/80">{formData.country}</p>
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
