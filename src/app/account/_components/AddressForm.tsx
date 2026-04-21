"use client";

import { useEffect, useState, useRef } from "react";
import { Save, Loader2, ChevronDown, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { useSession } from "next-auth/react";

// Country list for MENA region (countries with pricing configured)
const COUNTRIES = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Kuwait",
  "Bahrain",
  "Qatar",
  "Oman"
];

const COUNTRY_CODES: Record<string, string> = {
  "United Arab Emirates": "+971",
  "Saudi Arabia": "+966",
  "Kuwait": "+965",
  "Bahrain": "+973",
  "Qatar": "+974",
  "Oman": "+968"
};

// Saudi Arabia regions
const SAUDI_REGIONS = [
  "Riyadh", "Dammam", "Jeddah", "Mecca", "Medina", "Khobar", "Dhahran",
  "Al Khobar", "Qatif", "Hail", "Tabuk", "Bisha", "Najran", "Abha",
  "Khamis Mushait", "Yanbu", "Al Hofuf", "Sakaka", "Arar", "Hafar Al-Batin",
  "Al Ahsa", "Al Bahah", "Al Qunfudhah", "Sabya", "Abu Arish", "Samtah",
  "Jazan", "Makkah", "Taif", "Al Baha", "Rafha", "Dawadmi", "Al Kharj",
  "Az Zulfi", "Al Majma'ah", "Al Aflaj", "Al Quwayiyah", "Riyadh Province"
];

// UAE cities
const UAE_CITIES = [
  "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain", "Fujairah", 
  "Ras Al Khaimah", "Umm Al Quwain", "Khor Fakkan", "Kalba"
];

// Kuwait cities
const KUWAIT_CITIES = [
  "Kuwait City", "Al Ahmadi", "Al Farwaniyah", "Al Asema", "Al Jahra", 
  "Hawally", "Mubarak Al Kabeer", "Salmiya", "Salwa", "Rawda"
];

// Bahrain cities
const BAHRAIN_CITIES = [
  "Manama", "Muharraq", "Riffa", "Hamad Town", "Isa Town", 
  "Sitra", "Budaiya", "Jidhafs", "Al Malikiyah", "Zinj"
];

// Qatar cities
const QATAR_CITIES = [
  "Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Al Shahaniya",
  "Umm Salal", "Al Daayen", "Al Shamal", "Dukhan", " Lusail"
];

// Oman cities
const OMAN_CITIES = [
  "Muscat", "Seeb", "Salalah", "Bawshar", "Sohar", "Ibri",
  "Nizwa", "Suri", "Barka", "Rustaq", "Mahdah", "Khasab"
];

// City suggestions
const CITY_SUGGESTIONS: Record<string, string[]> = {
  "riyadh": ["Riyadh", "Al Kharj", "Al Aflaj", "Al Quwayiyah", "Al Majma'ah", "Az Zulfi", "Dawadmi", "Al Hofuf", "Dhahran"],
  "dammam": ["Dammam", "Dhahran", "Khobar", "Al Khobar", "Qatif", "Hafar Al-Batin"],
  "jeddah": ["Jeddah", "Makkah", "Taif", "Al Bahah", "Al Qunfudhah"],
  "mecca": ["Mecca", "Jeddah", "Taif", "Al Qunfudhah"],
  "khobar": ["Khobar", "Al Khobar", "Dammam", "Dhahran", "Qatif"],
  "abha": ["Abha", "Khamis Mushait", "Najran", "Bisha"],
  "hail": ["Hail", "Al Jawf", "Sakaka", "Rafha"],
};

export default function AddressForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setHasAddress = useCartStore(state => state.setHasAddress);
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    country: "Saudi Arabia",
    city: "",
    address1: "",
    address2: "",
    postalCode: "",
  });

  // Get cities based on selected country
  const getCitiesForCountry = (country: string): string[] => {
    if (country.includes("UAE") || country.includes("United Arab Emirates")) return UAE_CITIES;
    if (country.includes("Kuwait")) return KUWAIT_CITIES;
    if (country.includes("Bahrain")) return BAHRAIN_CITIES;
    if (country.includes("Qatar")) return QATAR_CITIES;
    if (country.includes("Oman")) return OMAN_CITIES;
    return SAUDI_REGIONS;
  };

  // Filter countries based on search
  const filteredCountries = showRegionDropdown 
    ? COUNTRIES // Show all countries when dropdown is open
    : COUNTRIES.filter(c => 
        c.toLowerCase().includes(formData.country.toLowerCase()) ||
        formData.country === ""
      );

  // Filter regions based on search
  const filteredRegions = getCitiesForCountry(formData.country).filter(r => 
    r.toLowerCase().includes(formData.city.toLowerCase()) ||
    formData.city === ""
  );

  // Auto-suggest cities based on city input
  useEffect(() => {
    if (formData.city.length >= 2) {
      const search = formData.city.toLowerCase();
      const matches = Object.values(CITY_SUGGESTIONS).flat().filter(city =>
        city.toLowerCase().includes(search)
      );
      // Also include partial matches from all regions
      const regionMatches = SAUDI_REGIONS.filter(r => 
        r.toLowerCase().includes(search)
      );
      setCitySuggestions([...new Set([...matches, ...regionMatches])].slice(0, 8));
    } else {
      setCitySuggestions([]);
    }
  }, [formData.city]);

  // Auto-suggest addresses
  useEffect(() => {
    if (formData.address1.length >= 3) {
      // Mock address suggestions based on common patterns
      const suggestions = [
        `${formData.city || 'Riyadh'}, Main Street`,
        `${formData.city || 'Riyadh'}, King Fahd Road`,
        `${formData.city || 'Riyadh'}, Prince Muhammad Road`,
        `${formData.city || 'Riyadh'}, Al Olaya District`,
        `${formData.city || 'Riyadh'}, Al Malaz District`,
        `${formData.city || 'Riyadh'}, Al Nakheel District`,
      ].filter(s => s.toLowerCase().includes(formData.address1.toLowerCase()));
      setAddressSuggestions(suggestions);
    } else {
      setAddressSuggestions([]);
    }
  }, [formData.address1, formData.city]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRegionDropdown(false);
        setShowCityDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    async function fetchAddress() {
      try {
        if (session) {
          const res = await fetch("/api/account/address");
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
        } else {
          const guestStr = localStorage.getItem('guest_address');
          if (guestStr) {
            const data = JSON.parse(guestStr);
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
    
    // Validation
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    
    const countryCode = COUNTRY_CODES[formData.country] || "+966";
    let rawPhone = formData.phone;
    if (rawPhone.startsWith(countryCode)) {
      rawPhone = rawPhone.slice(countryCode.length).trim();
    } else if (rawPhone.startsWith(countryCode.replace("+", ""))) {
      rawPhone = rawPhone.slice(countryCode.length - 1).trim();
    }
    
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 8 || digitsOnly.length > 10) {
      toast.error(`Please enter a valid ${formData.country} mobile number`);
      return;
    }

    // Ensure phone number starts with country code before saving
    const finalizedPhone = `${countryCode}${digitsOnly}`;
    const dataToSave = { ...formData, phone: finalizedPhone };

    if (!dataToSave.city.trim()) {
      toast.error("Please select your city");
      return;
    }
    if (!formData.address1.trim()) {
      toast.error("Please enter your street address");
      return;
    }

    setSaving(true);
    try {
      if (session) {
        const res = await fetch("/api/account/address", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSave),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Update failed");
        }
      } else {
        localStorage.setItem('guest_address', JSON.stringify(dataToSave));
        if (dataToSave.email) {
          localStorage.setItem('guest_email', dataToSave.email);
        }
      }
      toast.success("Address saved successfully!");
      setHasAddress(true);
      
      const redirectPath = searchParams?.get("redirect");
      if (redirectPath) {
        // Support both old 'order' keyword and generic paths
        if (redirectPath === "order") {
          router.push("/");
        } else {
          router.push(redirectPath);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function selectRegion(region: string) {
    // If country changes, clear phone to ensure they enter new one matching new country
    setFormData({...formData, country: region, city: "", phone: ""});
    setShowRegionDropdown(false);
  }

  function selectCity(city: string) {
    setFormData({...formData, city: city});
    setShowCityDropdown(false);
    setCitySuggestions([]);
  }

  function selectAddress(address: string) {
    setFormData({...formData, address1: address});
    setAddressSuggestions([]);
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-black/20" />
    </div>
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 relative" style={{ isolation: 'isolate' }}>
      <div className="rounded-3xl p-8 border border-black/5 shadow-xl bg-white relative" style={{ zIndex: 1 }}>
        <div className="flex items-start md:items-center justify-between gap-4 mb-8 relative" style={{ zIndex: 10 }}>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-black">Shipping Address</h2>
            <p className="text-xs md:text-sm text-black/50 mt-1 font-medium">Required for completing orders.</p>
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
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Full Name *</label>
            <div className="relative">
              <input 
                required
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                placeholder="Enter your full name"
                className="w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Phone Number *</label>
            <div className="flex gap-2">
              <div className="w-24 shrink-0 flex items-center justify-center rounded-2xl bg-black/5 border-2 border-transparent text-black font-bold">
                {COUNTRY_CODES[formData.country] || "+966"}
              </div>
              <input 
                required
                type="tel"
                value={(() => {
                  const code = COUNTRY_CODES[formData.country] || "+966";
                  let p = formData.phone;
                  if (p.startsWith(code)) p = p.slice(code.length);
                  else if (p.startsWith(code.replace("+", ""))) p = p.slice(code.length - 1);
                  return p.trim();
                })()}
                onChange={e => {
                  const val = e.target.value.replace(/[^\d]/g, '');
                  const code = COUNTRY_CODES[formData.country] || "+966";
                  setFormData({...formData, phone: `${code} ${val}`});
                }}
                placeholder="5XX XXX XXXX"
                maxLength={10}
                className="w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white"
              />
            </div>
          </div>

          {/* Country - Dropdown */}
          <div className="space-y-2 relative">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Country *</label>
            <button
              type="button"
              onClick={() => setShowRegionDropdown(!showRegionDropdown)}
              className="w-full rounded-2xl px-5 py-3.5 text-left text-black font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white flex items-center justify-between relative z-[60]"
            >
              <span className={formData.country ? "" : "text-black/30"}>
                {formData.country || "Select Country"}
              </span>
              <ChevronDown className={`w-5 h-5 transition ${showRegionDropdown ? "rotate-180" : ""}`} />
            </button>
            {showRegionDropdown && (
              <div className="absolute z-[100] w-full mt-12 bg-white border-2 border-black/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {filteredCountries.map(country => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => {
                      setFormData({...formData, country, city: ""});
                      setShowRegionDropdown(false);
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

          {/* City - Autocomplete */}
          <div className="space-y-2 relative">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">City *</label>
            <div className="relative">
              <input 
                required
                value={formData.city}
                onChange={e => {
                  setFormData({...formData, city: e.target.value});
                  if (e.target.value.length >= 2) setShowCityDropdown(true);
                }}
                onFocus={() => formData.city.length >= 2 && setShowCityDropdown(true)}
                placeholder={formData.country ? "Type to search cities" : "Select country first"}
                className="w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white pr-10"
              />
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
            </div>
            {showCityDropdown && filteredRegions.length > 0 && (
              <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-black/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                {filteredRegions.map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => selectCity(city)}
                    className="w-full px-5 py-3 text-left font-semibold hover:bg-black/5 transition text-black"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Street Address - Autocomplete */}
          <div className="md:col-span-2 space-y-2 relative">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Street Address *</label>
            <div className="relative">
              <input 
                required
                value={formData.address1}
                onChange={e => setFormData({...formData, address1: e.target.value})}
                onFocus={() => formData.address1.length >= 3 && setAddressSuggestions(prev => [...prev])}
                placeholder="Start typing for suggestions"
                className="w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white"
              />
              {addressSuggestions.length > 0 && (
                <div className="absolute z-[100] w-full mt-1 bg-white border-2 border-black/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                  {addressSuggestions.map((addr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectAddress(addr)}
                      className="w-full px-5 py-3 text-left font-semibold hover:bg-black/5 transition text-black"
                    >
                      {addr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Address 2 */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Additional Address (Optional)</label>
            <input 
              value={formData.address2}
              onChange={e => setFormData({...formData, address2: e.target.value})}
              placeholder="Building, floor, apartment number"
              className="w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white"
            />
          </div>

          {/* Postal Code */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Postal Code</label>
            <input 
              value={formData.postalCode}
              onChange={e => setFormData({...formData, postalCode: e.target.value})}
              placeholder="12345"
              className="w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 ml-1">Email</label>
            <input 
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="your@email.com"
              className="w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
