"use client";

import { useEffect, useState, useRef } from "react";
import { Save, Loader2, ChevronDown, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";

// Country list for MENA region
const COUNTRIES = [
  "United Arab Emirates (UAE)",
  "Saudi Arabia",
  "Kuwait",
  "Bahrain",
  "Qatar",
  "Oman"
];

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
  const filteredCountries = COUNTRIES.filter(c => 
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
    async function fetchAddress() {
      try {
        const res = await fetch("/api/account/address");
        if (res.ok) {
          const data = await res.json();
          if (data) setFormData({
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
    
    // Validation
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 8) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("Please select your city");
      return;
    }
    if (!formData.address1.trim()) {
      toast.error("Please enter your street address");
      return;
    }

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
      setHasAddress(true);
      
      const red = searchParams?.get("redirect");
      if (red === "order") {
        router.push("/");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function selectRegion(region: string) {
    setFormData({...formData, country: region});
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
        <div className="flex items-center justify-between mb-8 relative" style={{ zIndex: 10 }}>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-black">Shipping Address</h2>
            <p className="text-sm text-black/50 mt-1 font-medium">Required for completing orders.</p>
          </div>
          <button 
            type="submit"
            disabled={saving}
            className="bg-black text-white rounded-full px-8 py-2.5 text-sm font-bold shadow-lg shadow-black/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
            <input 
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="+966 5XX XXX XXXX"
              className="w-full rounded-2xl px-5 py-3.5 text-black font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white"
            />
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
