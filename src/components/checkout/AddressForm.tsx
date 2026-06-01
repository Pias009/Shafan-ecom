"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { addressValidationSchema, addressFieldLabels, addressFieldRequired } from "@/schemas/addressValidation";
import { z } from "zod";

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

const UAE_CITIES = [
  "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain", "Fujairah",
  "Ras Al Khaimah", "Umm Al Quwain", "Khor Fakkan", "Kalba",
];

const SAUDI_REGIONS = [
  "Riyadh", "Dammam", "Jeddah", "Mecca", "Medina", "Khobar", "Dhahran",
  "Al Khobar", "Qatif", "Hail", "Tabuk", "Bisha", "Najran", "Abha",
  "Khamis Mushait", "Yanbu", "Al Hofuf", "Sakaka", "Arar", "Hafar Al-Batin",
  "Al Ahsa", "Al Bahah", "Al Qunfudhah", "Sabya", "Abu Arish", "Samtah",
  "Jazan", "Makkah", "Taif", "Al Baha", "Rafha", "Dawadmi", "Al Kharj",
  "Az Zulfi", "Al Majma'ah", "Al Aflaj", "Al Quwayiyah", "Riyadh Province",
];

const KUWAIT_CITIES = [
  "Kuwait City", "Al Ahmadi", "Al Farwaniyah", "Al Asema", "Al Jahra",
  "Hawally", "Mubarak Al Kabeer", "Salmiya", "Salwa", "Rawda",
];

const BAHRAIN_CITIES = [
  "Manama", "Muharraq", "Riffa", "Hamad Town", "Isa Town",
  "Sitra", "Budaiya", "Jidhafs", "Al Malikiyah", "Zinj",
];

const QATAR_CITIES = [
  "Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Al Shahaniya",
  "Umm Salal", "Al Daayen", "Al Shamal", "Dukhan", "Lusail",
];

const OMAN_CITIES = [
  "Muscat", "Seeb", "Salalah", "Bawshar", "Sohar", "Ibri",
  "Nizwa", "Suri", "Barka", "Rustaq", "Mahdah", "Khasab",
];

const AREA_SUGGESTIONS: Record<string, string[]> = {
  "Dubai": ["Al Barsha", "Dubai Marina", "Downtown Dubai", "JLT", "Deira", "Bur Dubai", "Mirdif", "Jumeirah", "Al Nahda", "Business Bay"],
  "Abu Dhabi": ["Al Reem Island", "Yas Island", "Saadiyat Island", "Khalifa City", "Al Raha Beach", "Al Maryah Island", "Al Bateen", "Mohamed Bin Zayed City"],
  "Riyadh": ["Al Olaya", "Al Malaz", "Al Nakheel", "Al Rawabi", "Al Murabba", "Al Sulimania", "Al Worood", "Al Narjis", "Al Yasmin", "Al Hamra"],
  "Jeddah": ["Al Shati", "Al Hamra", "Al Rawdah", "Al Salama", "Al Mohammadiyah"],
  "Kuwait City": ["Salmiya", "Hawally", "Sharq", "Jabriya", "Bneid Al Qar"],
  "Manama": ["Juffair", "Seef", "Adliya", "Hoora", "Al Muharraq"],
  "Doha": ["West Bay", "The Pearl", "Al Sadd", "Al Waab", "Al Hilal"],
  "Muscat": ["Al Khuwair", "Shatti Al Qurum", "Madinat Al Sultan Qaboos", "Al Ghubra"],
};

function getCitiesForCountry(country: string): string[] {
  if (country.includes("UAE") || country.includes("United Arab Emirates")) return UAE_CITIES;
  if (country.includes("Kuwait")) return KUWAIT_CITIES;
  if (country.includes("Bahrain")) return BAHRAIN_CITIES;
  if (country.includes("Qatar")) return QATAR_CITIES;
  if (country.includes("Oman")) return OMAN_CITIES;
  return SAUDI_REGIONS;
}

function getAreaForCity(city: string): string[] {
  return AREA_SUGGESTIONS[city] || [];
}

export default function CheckoutAddressForm({
  onSuccess,
  initialData,
}: {
  onSuccess?: (data: z.infer<typeof addressValidationSchema>) => void;
  initialData?: Partial<z.infer<typeof addressValidationSchema>>;
}) {
  const [saving, setSaving] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    country: initialData?.country || "Saudi Arabia",
    city_name: initialData?.city_name || "",
    area_name: initialData?.area_name || "",
    street_road: initialData?.street_road || "",
    house_building: initialData?.house_building || "",
    postalCode: initialData?.postalCode || "",
  });

  const cities = getCitiesForCountry(formData.country);
  const filteredCities = cities.filter(c =>
    c.toLowerCase().includes(formData.city_name.toLowerCase()) || formData.city_name === ""
  );
  const areas = getAreaForCity(formData.city_name);
  const filteredAreas = areas.filter(a =>
    a.toLowerCase().includes(formData.area_name.toLowerCase()) || formData.area_name === ""
  );

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) errors.fullName = "Please enter your full name";

    const countryCode = COUNTRY_CODES[formData.country] || "+966";
    let rawPhone = formData.phone;
    if (rawPhone.startsWith(countryCode)) rawPhone = rawPhone.slice(countryCode.length);
    else if (rawPhone.startsWith(countryCode.replace("+", ""))) rawPhone = rawPhone.slice(countryCode.length - 1);
    const digitsOnly = rawPhone.replace(/\D/g, "");
    if (!digitsOnly || digitsOnly.length < 8 || digitsOnly.length > 10) {
      errors.phone = `Please enter a valid ${formData.country} mobile number (8-10 digits)`;
    }

    if (!formData.city_name.trim()) errors.city_name = "City name is required";
    if (!formData.area_name.trim()) errors.area_name = "Area name is required";
    if (!formData.street_road.trim()) errors.street_road = "Street or Road name is required for accurate courier delivery";
    if (!formData.country) errors.country = "Country is required";

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(msg => toast.error(msg));
      return;
    }

    const countryCode = COUNTRY_CODES[formData.country] || "+966";
    let rawPhone = formData.phone;
    if (rawPhone.startsWith(countryCode)) rawPhone = rawPhone.slice(countryCode.length);
    else if (rawPhone.startsWith(countryCode.replace("+", ""))) rawPhone = rawPhone.slice(countryCode.length - 1);
    const digitsOnly = rawPhone.replace(/\D/g, "");
    const finalizedPhone = `${countryCode}${digitsOnly}`;

    const payload = { ...formData, phone: finalizedPhone };

    setSaving(true);
    try {
      const res = await fetch("/api/account/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      toast.success("Address saved successfully!");
      onSuccess?.(payload);
    } catch (err: any) {
      toast.error(err.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  function renderField(
    name: keyof typeof formData,
    extra?: { type?: string; placeholder?: string; className?: string; rightElement?: React.ReactNode }
  ) {
    const label = addressFieldLabels[name] || name;
    const isRequired = addressFieldRequired[name];
    const isOptional = !isRequired;
    const hasError = !!fieldErrors[name];

    return (
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1 flex items-center gap-2">
          {label}
          {isRequired && <span className="text-red-500 text-sm">*</span>}
          {isOptional && <span className="text-[9px] font-bold text-black/30 uppercase tracking-wider">(Optional)</span>}
        </label>
        <div className="relative">
          <input
            type={extra?.type || "text"}
            value={formData[name] as string}
            onChange={e => {
              setFormData({ ...formData, [name]: e.target.value });
              setFieldErrors(prev => ({ ...prev, [name]: "" }));
            }}
            placeholder={extra?.placeholder || ""}
            className={`w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 outline-none bg-white transition ${
              hasError ? "border-red-500" : "border-black/10 focus:border-black"
            } ${extra?.className || ""}`}
          />
          {extra?.rightElement}
        </div>
        {hasError && (
          <p className="text-red-500 text-[10px] font-bold ml-1">{fieldErrors[name]}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative" style={{ isolation: "isolate" }}>
      <div className="rounded-3xl p-8 border border-black/5 shadow-xl bg-white relative" style={{ zIndex: 1 }}>
        <div className="flex items-start md:items-center justify-between gap-4 mb-8 relative" style={{ zIndex: 10 }}>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-black">Shipping Address</h2>
            <p className="text-xs md:text-sm text-black/50 mt-1 font-medium">
              Required for completing orders.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white rounded-full px-4 py-2 md:px-8 md:py-2.5 text-[10px] md:text-sm font-bold shadow-lg shadow-black/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 md:gap-2 shrink-0"
          >
            {saving ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3 h-3 md:w-4 md:h-4" />}
            Save Address
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {renderField("fullName", { placeholder: "Enter your full name" })}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1 flex items-center gap-2">
              Phone Number <span className="text-red-500 text-sm">*</span>
            </label>
            <div className="flex gap-2">
              <div className="w-24 shrink-0 flex items-center justify-center rounded-2xl bg-black/5 border-2 border-transparent text-black font-bold">
                {COUNTRY_CODES[formData.country] || "+966"}
              </div>
              <input
                type="tel"
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
                  setFieldErrors(prev => ({ ...prev, phone: "" }));
                }}
                placeholder="5XX XXX XXXX"
                maxLength={10}
                className={`w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 outline-none bg-white transition ${
                  fieldErrors.phone ? "border-red-500" : "border-black/10 focus:border-black"
                }`}
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-red-500 text-[10px] font-bold ml-1">{fieldErrors.phone}</p>
            )}
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1 flex items-center gap-2">
              Country <span className="text-red-500 text-sm">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="w-full rounded-2xl px-5 py-3.5 text-left text-black font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white flex items-center justify-between relative z-[60]"
            >
              <span className={formData.country ? "" : "text-black/30"}>
                {formData.country || "Select Country"}
              </span>
              <ChevronDown className={`w-5 h-5 transition ${showCountryDropdown ? "rotate-180" : ""}`} />
            </button>
            {showCountryDropdown && (
              <div className="absolute z-[100] w-full mt-12 bg-white border-2 border-black/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {COUNTRIES.map(country => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, country, city_name: "", area_name: "" });
                      setShowCountryDropdown(false);
                    }}
                    className={`w-full px-5 py-3 text-left font-semibold hover:bg-black/5 transition ${
                      formData.country === country ? "bg-black text-white" : "text-black"
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1 flex items-center gap-2">
              City <span className="text-red-500 text-sm">*</span>
            </label>
            <div className="relative">
              <input
                value={formData.city_name}
                onChange={e => {
                  setFormData({ ...formData, city_name: e.target.value, area_name: "" });
                  setFieldErrors(prev => ({ ...prev, city_name: "" }));
                  if (e.target.value.length >= 1) setShowCityDropdown(true);
                }}
                onFocus={() => formData.city_name.length >= 1 && setShowCityDropdown(true)}
                placeholder="Enter your city"
                className={`w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 outline-none bg-white transition pr-10 ${
                  fieldErrors.city_name ? "border-red-500" : "border-black/10 focus:border-black"
                }`}
              />
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
            </div>
            {fieldErrors.city_name && (
              <p className="text-red-500 text-[10px] font-bold ml-1">{fieldErrors.city_name}</p>
            )}
            {showCityDropdown && filteredCities.length > 0 && (
              <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-black/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                {filteredCities.map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, city_name: city, area_name: "" });
                      setShowCityDropdown(false);
                      setShowAreaDropdown(true);
                    }}
                    className="w-full px-5 py-3 text-left font-semibold hover:bg-black/5 transition text-black"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1 flex items-center gap-2">
              Area / District Name <span className="text-red-500 text-sm">*</span>
            </label>
            <div className="relative">
              <input
                value={formData.area_name}
                onChange={e => {
                  setFormData({ ...formData, area_name: e.target.value });
                  setFieldErrors(prev => ({ ...prev, area_name: "" }));
                  if (getAreaForCity(formData.city_name).length > 0 && e.target.value.length >= 1) {
                    setShowAreaDropdown(true);
                  }
                }}
                onFocus={() => {
                  if (getAreaForCity(formData.city_name).length > 0 && formData.area_name.length >= 1) {
                    setShowAreaDropdown(true);
                  }
                }}
                placeholder={formData.city_name ? "Enter area or district" : "Select a city first"}
                className={`w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 outline-none bg-white transition pr-10 ${
                  fieldErrors.area_name ? "border-red-500" : "border-black/10 focus:border-black"
                }`}
              />
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
            </div>
            {fieldErrors.area_name && (
              <p className="text-red-500 text-[10px] font-bold ml-1">{fieldErrors.area_name}</p>
            )}
            {showAreaDropdown && filteredAreas.length > 0 && (
              <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-black/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                {filteredAreas.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, area_name: area });
                      setShowAreaDropdown(false);
                    }}
                    className="w-full px-5 py-3 text-left font-semibold hover:bg-black/5 transition text-black"
                  >
                    {area}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-2">
            {renderField("street_road", {
              placeholder: "Street name, road number, landmark",
              className: "md:col-span-2",
            })}
          </div>

          <div className="md:col-span-2 space-y-2">
            {renderField("house_building", {
              placeholder: "Apartment 4B, Building 12 (Optional)",
            })}
          </div>

          <div className="space-y-2">
            {renderField("postalCode", { placeholder: "12345" })}
          </div>

          <div className="space-y-2">
            {renderField("email", { type: "email", placeholder: "your@email.com" })}
          </div>
        </div>
      </div>
    </form>
  );
}
