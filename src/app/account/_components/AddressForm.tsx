"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { useSession } from "next-auth/react";

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

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  house_building: string;
  address1: string;
  area_name: string;
  city: string;
  block_no: string;
  zone: string;
  region: string;
  postalCode: string;
}

const defaultForm: FormData = {
  fullName: "", phone: "", email: "", country: "United Arab Emirates",
  house_building: "", address1: "", area_name: "", city: "",
  block_no: "", zone: "", region: "", postalCode: "",
};

export default function AddressForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setHasAddress = useCartStore(state => state.setHasAddress);
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>(defaultForm);

  const isoCode = COUNTRY_ISO[formData.country] || "AE";
  const fieldCfg = FIELD_CONFIG[isoCode] || FIELD_CONFIG["AE"];

  useEffect(() => {
    if (status === "loading") return;
    async function fetchAddress() {
      try {
        if (session) {
          const res = await fetch("/api/account/address");
          if (res.ok) {
            const data = await res.json();
            if (data) {
              const countryName = COUNTRIES.find(c => COUNTRY_ISO[c] === data.country) || data.country || "United Arab Emirates";
              setFormData({
                fullName: data.fullName || "",
                phone: data.phone || "",
                email: data.email || "",
                country: countryName,
                house_building: data.house_building || data.address2 || "",
                address1: data.street_road || data.address1 || "",
                area_name: data.area_name || "",
                city: data.city_name || data.city || "",
                block_no: data.block_no || "",
                zone: data.zone || "",
                region: data.region || "",
                postalCode: data.postalCode || "",
              });
              setHasAddress(true);
            }
          }
        } else {
          const guestStr = localStorage.getItem("guest_address");
          if (guestStr) {
            const data = JSON.parse(guestStr);
            const countryName = COUNTRIES.find(c => COUNTRY_ISO[c] === data.country) || data.country || "United Arab Emirates";
            setFormData({
              fullName: data.fullName || "",
              phone: data.phone || "",
              email: data.email || "",
              country: countryName,
              house_building: data.house_building || data.address2 || "",
              address1: data.street_road || data.address1 || "",
              area_name: data.area_name || "",
              city: data.city_name || data.city || "",
              block_no: data.block_no || "",
              zone: data.zone || "",
              region: data.region || "",
              postalCode: data.postalCode || "",
            });
            setHasAddress(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAddress();
  }, [session, status, setHasAddress]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) errors.fullName = "Please enter your full name";
    if (!formData.house_building.trim()) errors.house_building = "Please enter your house / building name";
    if (!formData.address1.trim()) errors.address1 = "Please enter your street / road";
    if (fieldCfg.blockNo === true && !formData.block_no.trim()) errors.block_no = "Please enter your block number";
    if (!formData.area_name.trim()) errors.area_name = `Please enter your ${fieldCfg.areaLabel.toLowerCase()}`;
    if (fieldCfg.cityName && !formData.city.trim()) errors.city = "Please enter your city name";
    if (fieldCfg.region === "dropdown" && !formData.region.trim()) errors.region = "Please select your emirate";
    if (fieldCfg.region === true && !formData.region.trim()) errors.region = "Please enter your region";
    if (!formData.email.trim()) errors.email = "Please enter your email address";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Please enter a valid email address";

    const code = COUNTRY_CODES[formData.country] || "+971";
    let rawPhone = formData.phone;
    if (rawPhone.startsWith(code)) rawPhone = rawPhone.slice(code.length).trim();
    else if (rawPhone.startsWith(code.replace("+", ""))) rawPhone = rawPhone.slice(code.length - 1).trim();
    const digits = rawPhone.replace(/\D/g, "");
    if (!digits || digits.length < 7 || digits.length > 12) errors.phone = "Please enter a valid phone number";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) { Object.values(errors).forEach(msg => toast.error(msg)); return; }

    const finalPhone = `${code}${digits}`;
    const isoForSave = COUNTRY_ISO[formData.country] || "AE";
    const dataToSave = {
      ...formData,
      phone: finalPhone,
      country: isoForSave,
      street_road: formData.address1,
      city_name: formData.city,
      city: formData.city,
      address2: formData.house_building,
    };

    setSaving(true);
    try {
      if (session) {
        const res = await fetch("/api/account/address", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSave),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Update failed"); }
      } else {
        localStorage.setItem("guest_address", JSON.stringify(dataToSave));
        if (dataToSave.email) localStorage.setItem("guest_email", dataToSave.email);
      }
      toast.success("Address saved successfully!");
      setHasAddress(true);
      const redirectPath = searchParams?.get("redirect");
      if (redirectPath && redirectPath !== "order") router.push(redirectPath);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-black/20" />
    </div>
  );

  const inputCls = (field: string) =>
    `w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 ${fieldErrors[field] ? "border-red-500" : "border-black/10"} focus:border-black transition outline-none bg-white`;
  const labelCls = "text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl p-8 border border-black/5 shadow-xl bg-white">
        <div className="flex items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-black">Shipping Address</h2>
            <p className="text-xs md:text-sm text-black/50 mt-1 font-medium">Required for completing orders.</p>
          </div>
          <button type="submit" disabled={saving}
            className="bg-black text-white rounded-full px-4 py-2 md:px-8 md:py-2.5 text-[10px] md:text-sm font-bold shadow-lg shadow-black/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 md:gap-2 shrink-0">
            {saving ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3 h-3 md:w-4 md:h-4" />}
            Save Address
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-2">
            <label className={labelCls}>Full Name *</label>
            <input value={formData.fullName} onChange={e => { setFormData({...formData, fullName: e.target.value}); setFieldErrors(p => ({...p, fullName: ""})); }}
              placeholder="Enter your full name" className={inputCls("fullName")} />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className={labelCls}>Phone Number *</label>
            <div className="flex gap-2">
              <div className="w-24 shrink-0 flex items-center justify-center rounded-2xl bg-black/5 border-2 border-transparent text-black font-bold text-sm">
                {COUNTRY_CODES[formData.country] || "+971"}
              </div>
              <input type="tel"
                value={(() => { const c = COUNTRY_CODES[formData.country] || "+971"; let p = formData.phone; if (p.startsWith(c)) p = p.slice(c.length); return p.trim(); })()}
                onChange={e => { const val = e.target.value.replace(/[^\d]/g, ""); setFormData({...formData, phone: `${COUNTRY_CODES[formData.country] || "+971"} ${val}`}); setFieldErrors(p => ({...p, phone: ""})); }}
                placeholder="5XX XXX XXXX" maxLength={10}
                className={`w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 ${fieldErrors.phone ? "border-red-500" : "border-black/10"} focus:border-black transition outline-none bg-white`} />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className={labelCls}>Email *</label>
            <input type="email" value={formData.email} onChange={e => { setFormData({...formData, email: e.target.value}); setFieldErrors(p => ({...p, email: ""})); }}
              placeholder="your@email.com" className={inputCls("email")} />
          </div>

          {/* Country dropdown */}
          <div className="space-y-2 relative">
            <label className={labelCls}>Country *</label>
            <button type="button" onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="w-full rounded-2xl px-5 py-3.5 text-left text-black font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white flex items-center justify-between">
              <span>{formData.country || "Select Country"}</span>
              <ChevronDown className={`w-5 h-5 transition ${showCountryDropdown ? "rotate-180" : ""}`} />
            </button>
            {showCountryDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {COUNTRIES.map(c => (
                  <button key={c} type="button" onClick={() => { setFormData({...formData, country: c, city: "", area_name: "", block_no: "", zone: "", region: ""}); setShowCountryDropdown(false); }}
                    className={`w-full px-5 py-3 text-left font-semibold hover:bg-black/5 transition ${formData.country === c ? "bg-black text-white" : "text-black"}`}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* House / Building */}
          <div className="md:col-span-2 space-y-2">
            <label className={labelCls}>House No. / Building Name *</label>
            <input value={formData.house_building} onChange={e => { setFormData({...formData, house_building: e.target.value}); setFieldErrors(p => ({...p, house_building: ""})); }}
              placeholder="House number or building name" className={inputCls("house_building")} />
          </div>

          {/* Street / Road */}
          <div className="md:col-span-2 space-y-2">
            <label className={labelCls}>Street / Road *</label>
            <input value={formData.address1} onChange={e => { setFormData({...formData, address1: e.target.value}); setFieldErrors(p => ({...p, address1: ""})); }}
              placeholder="Street name or road" className={inputCls("address1")} />
          </div>

          {/* Block No — Kuwait mandatory, Bahrain optional */}
          {fieldCfg.blockNo !== false && (
            <div className="space-y-2">
              <label className={labelCls}>Block No.{fieldCfg.blockNo === "optional" ? " (Optional)" : " *"}</label>
              <input value={formData.block_no} onChange={e => { setFormData({...formData, block_no: e.target.value}); setFieldErrors(p => ({...p, block_no: ""})); }}
                placeholder="Block number" className={inputCls("block_no")} />
            </div>
          )}

          {/* Zone — Qatar optional */}
          {fieldCfg.zone !== false && (
            <div className="space-y-2">
              <label className={labelCls}>Zone (Optional)</label>
              <input value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})}
                placeholder="Zone" className={inputCls("zone")} />
            </div>
          )}

          {/* Area Name */}
          <div className={`space-y-2 ${!fieldCfg.cityName ? "md:col-span-2" : ""}`}>
            <label className={labelCls}>{fieldCfg.areaLabel} *</label>
            <input value={formData.area_name} onChange={e => { setFormData({...formData, area_name: e.target.value}); setFieldErrors(p => ({...p, area_name: ""})); }}
              placeholder={fieldCfg.areaLabel} className={inputCls("area_name")} />
          </div>

          {/* City Name — all except Kuwait */}
          {fieldCfg.cityName && (
            <div className="space-y-2">
              <label className={labelCls}>City Name *</label>
              <input value={formData.city} onChange={e => { setFormData({...formData, city: e.target.value}); setFieldErrors(p => ({...p, city: ""})); }}
                placeholder="City" className={inputCls("city")} />
            </div>
          )}

          {/* UAE Emirate dropdown */}
          {fieldCfg.region === "dropdown" && (
            <div className="space-y-2 relative">
              <label className={labelCls}>Emirate / Region *</label>
              <button type="button" onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                className={`w-full rounded-2xl px-5 py-3.5 text-left font-semibold border-2 ${fieldErrors.region ? "border-red-500" : "border-black/10"} focus:border-black transition outline-none bg-white flex items-center justify-between`}>
                <span className={formData.region ? "text-black font-semibold" : "text-black/30"}>{formData.region || "Select Emirate"}</span>
                <ChevronDown className={`w-5 h-5 transition ${showRegionDropdown ? "rotate-180" : ""}`} />
              </button>
              {showRegionDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                  {UAE_REGIONS.map(r => (
                    <button key={r} type="button" onClick={() => { setFormData({...formData, region: r}); setShowRegionDropdown(false); setFieldErrors(p => ({...p, region: ""})); }}
                      className={`w-full px-5 py-3 text-left font-semibold hover:bg-black/5 transition ${formData.region === r ? "bg-black text-white" : "text-black"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SA Region text */}
          {fieldCfg.region === true && (
            <div className="space-y-2">
              <label className={labelCls}>Region *</label>
              <input value={formData.region} onChange={e => { setFormData({...formData, region: e.target.value}); setFieldErrors(p => ({...p, region: ""})); }}
                placeholder="e.g. Riyadh, Jeddah, Dammam" className={inputCls("region")} />
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
