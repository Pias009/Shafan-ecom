"use client";

import { useState, useEffect } from "react";
import {
  Store, Save, Loader2, Minus, Plus, RefreshCw, CalendarClock, Gift, MapPin, Trash2, Phone, Clock, Link2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import type { CountryPickupSettings, PickupLocation, PickupSettings } from "@/lib/pickup";

const CURRENCIES: Record<string, string> = {
  AE: "AED",
  KW: "KWD",
  BH: "BHD",
  SA: "SAR",
  OM: "OMR",
  QA: "QAR",
  BD: "AED",
};

const COUNTRY_PRIORITY = ["AE", "SA", "KW", "BH", "OM", "QA", "BD"];

const countryNames: Record<string, string> = {
  AE: "United Arab Emirates",
  KW: "Kuwait",
  BH: "Bahrain",
  SA: "Saudi Arabia",
  OM: "Oman",
  QA: "Qatar",
  BD: "Bangladesh (Test)",
};

function newLocation(code: string): PickupLocation {
  return {
    id: `${code.toLowerCase()}-${Date.now().toString(36)}`,
    name: "",
    address: "",
    city: "",
    phone: "",
    hours: "",
    mapUrl: "",
    active: true,
  };
}

export default function PickupSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PickupSettings>({ countries: {} });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pickup", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.countries) {
          setSettings(data.settings);
        }
      } else {
        toast.error("Failed to load pickup settings");
      }
    } catch {
      toast.error("Failed to load pickup settings");
    } finally {
      setLoading(false);
    }
  }

  function updateCountry(code: string, patch: Partial<CountryPickupSettings>) {
    setSettings((prev) => ({
      countries: {
        ...prev.countries,
        [code]: { ...prev.countries[code], ...patch },
      },
    }));
  }

  function updateLocation(code: string, index: number, patch: Partial<PickupLocation>) {
    const locations = [...(settings.countries[code]?.locations || [])];
    locations[index] = { ...locations[index], ...patch };
    updateCountry(code, { locations });
  }

  function addLocation(code: string) {
    updateCountry(code, { locations: [...(settings.countries[code]?.locations || []), newLocation(code)] });
  }

  function removeLocation(code: string, index: number) {
    const locations = (settings.countries[code]?.locations || []).filter((_, i) => i !== index);
    updateCountry(code, { locations });
  }

  async function saveSettings() {
    const incomplete = Object.entries(settings.countries).flatMap(([code, c]) =>
      c.locations
        .filter((l) => !l.name.trim() || !l.address.trim())
        .map(() => countryNames[code] || code)
    );
    if (incomplete.length > 0) {
      toast.error(`Every store location needs a name and address (${[...new Set(incomplete)].join(", ")})`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.settings?.countries) setSettings(data.settings);
        toast.success("Pickup settings saved");
      } else {
        toast.error(data?.error || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const countryCodes = Object.keys(settings.countries).sort((a, b) => {
    const ia = COUNTRY_PRIORITY.indexOf(a);
    const ib = COUNTRY_PRIORITY.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div className="space-y-8 max-w-5xl">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black">Store Pickup</h1>
          <p className="text-sm text-black/70">
            Let customers collect orders from your stores. Pickup is free by default in every country — set a pickup
            charge, how many days until orders are ready, and the store locations shown at checkout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-black/5 rounded-xl font-bold text-sm hover:bg-black/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            Reset
          </button>
          <button
            onClick={saveSettings}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-black/10 p-10 flex items-center justify-center">
          <Loader2 className="animate-spin text-black/40" size={28} />
        </div>
      ) : (
        <div className="space-y-4">
          {countryCodes.map((code) => {
            const country = settings.countries[code];
            const currency = CURRENCIES[code] || "";
            const activeLocations = country.locations.filter((l) => l.active).length;
            const liveAtCheckout = country.enabled && activeLocations > 0;
            return (
              <div key={code} className="bg-white rounded-2xl border border-black/10 p-5 md:p-6">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center font-black text-sm">
                      {code}
                    </div>
                    <div>
                      <div className="font-black text-sm">{countryNames[code] || code}</div>
                      <div className={`text-xs font-bold ${liveAtCheckout ? "text-green-600" : "text-black/40"}`}>
                        {liveAtCheckout
                          ? `Pickup live at checkout • ${activeLocations} location${activeLocations === 1 ? "" : "s"}`
                          : country.enabled
                            ? "Hidden at checkout — add an active location"
                            : "Pickup disabled"}
                      </div>
                    </div>
                  </div>
                  <Toggle
                    checked={country.enabled}
                    onChange={(v) => updateCountry(code, { enabled: v })}
                    label="Pickup enabled"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Free pickup */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/60 flex items-center gap-1 mb-1.5">
                      <Gift size={12} /> Delivery Charge
                    </label>
                    <div className="h-[44px] flex items-center rounded-xl border-2 border-black/10 px-3">
                      <Toggle
                        checked={country.freeDelivery}
                        onChange={(v) => updateCountry(code, { freeDelivery: v })}
                        label={country.freeDelivery ? "Free for pickup" : "Charge for pickup"}
                      />
                    </div>
                  </div>

                  {/* Pickup fee */}
                  <div className={country.freeDelivery ? "opacity-40 pointer-events-none" : ""}>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/60 flex items-center gap-1 mb-1.5">
                      <Store size={12} /> Pickup Charge ({currency})
                    </label>
                    <StepperInput
                      value={country.pickupFee}
                      step={1}
                      min={0}
                      onChange={(v) => updateCountry(code, { pickupFee: v })}
                      prefix={currency ? `${currency} ` : ""}
                    />
                  </div>

                  {/* Ready in days */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/60 flex items-center gap-1 mb-1.5">
                      <CalendarClock size={12} /> Ready for Pickup In
                    </label>
                    <StepperInput
                      value={country.readyInDays}
                      step={1}
                      min={0}
                      onChange={(v) => updateCountry(code, { readyInDays: Math.round(v) })}
                      suffix={country.readyInDays === 1 ? "day" : "days"}
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black/60 mb-1.5 block">
                    Pickup Instructions
                  </label>
                  <input
                    type="text"
                    value={country.instructions ?? ""}
                    placeholder="e.g. Bring your order number and a valid ID"
                    onChange={(e) => updateCountry(code, { instructions: e.target.value })}
                    className="w-full rounded-xl border-2 border-black/10 focus:border-black px-3.5 py-2.5 text-xs font-bold text-black outline-none bg-white transition hover:border-black/20"
                  />
                  <span className="text-[10px] text-black/40 mt-1 block">Shown at checkout, on the order page and in the confirmation email</span>
                </div>

                {/* Locations */}
                <div className="mt-5 pt-5 border-t border-black/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-black/60 flex items-center gap-1">
                      <MapPin size={12} /> Store Locations
                    </div>
                    <button
                      type="button"
                      onClick={() => addLocation(code)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold"
                    >
                      <Plus size={14} /> Add Location
                    </button>
                  </div>

                  {country.locations.length === 0 && (
                    <p className="text-xs text-black/40 rounded-xl border-2 border-dashed border-black/10 p-4 text-center">
                      No store locations yet. Pickup stays hidden at checkout until you add one.
                    </p>
                  )}

                  {country.locations.map((loc, index) => (
                    <div key={loc.id} className={`rounded-xl border-2 p-4 space-y-3 ${loc.active ? "border-black/10" : "border-black/5 bg-black/[0.02]"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <Toggle
                          checked={loc.active}
                          onChange={(v) => updateLocation(code, index, { active: v })}
                          label={loc.active ? "Active" : "Inactive"}
                        />
                        <button
                          type="button"
                          onClick={() => removeLocation(code, index)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                          aria-label="Remove location"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <TextField
                          label="Store Name *"
                          value={loc.name}
                          placeholder="e.g. Shanfa Store — Satwa"
                          onChange={(v) => updateLocation(code, index, { name: v })}
                        />
                        <TextField
                          label="City"
                          value={loc.city ?? ""}
                          placeholder="e.g. Dubai"
                          onChange={(v) => updateLocation(code, index, { city: v })}
                        />
                        <div className="md:col-span-2">
                          <TextField
                            label="Address *"
                            value={loc.address}
                            placeholder="Building, floor, street, landmark"
                            onChange={(v) => updateLocation(code, index, { address: v })}
                          />
                        </div>
                        <TextField
                          label="Phone"
                          icon={<Phone size={11} />}
                          value={loc.phone ?? ""}
                          placeholder="+971 ..."
                          onChange={(v) => updateLocation(code, index, { phone: v })}
                        />
                        <TextField
                          label="Opening Hours"
                          icon={<Clock size={11} />}
                          value={loc.hours ?? ""}
                          placeholder="e.g. Sat–Thu, 10am–9pm"
                          onChange={(v) => updateLocation(code, index, { hours: v })}
                        />
                        <div className="md:col-span-2">
                          <TextField
                            label="Google Maps Link"
                            icon={<Link2 size={11} />}
                            value={loc.mapUrl ?? ""}
                            placeholder="https://maps.google.com/..."
                            onChange={(v) => updateLocation(code, index, { mapUrl: v })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help text */}
      <div className="rounded-2xl p-6 border border-blue-100 bg-blue-50">
        <div className="font-bold text-blue-700">How it works</div>
        <ul className="text-sm text-blue-600 mt-2 space-y-1">
          <li>• The Pickup option appears at checkout only for countries that are enabled and have at least one active location.</li>
          <li>• Pickup orders skip the delivery charge unless you switch &quot;Charge for pickup&quot; on and set an amount.</li>
          <li>• The ready-by date is the order date plus &quot;Ready for Pickup In&quot; days.</li>
          <li>• The chosen store, ready-by date and instructions are saved on the order and shown on the success page, the order details and the confirmation email.</li>
          <li>• Pickup orders are never booked with a courier (Aramex / Naqel).</li>
        </ul>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition ${checked ? "bg-green-500" : "bg-black/20"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
      <span className="text-xs font-bold text-black/70">{label}</span>
    </label>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-black/50 flex items-center gap-1 mb-1">
        {icon}
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 border-black/10 focus:border-black px-3.5 py-2.5 text-xs font-bold text-black outline-none bg-white transition hover:border-black/20"
      />
    </div>
  );
}

function StepperInput({
  value,
  step,
  min,
  onChange,
  prefix,
  suffix,
}: {
  value: number;
  step: number;
  min: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.round(n * 100) / 100);
  return (
    <div className="flex items-stretch">
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        className="w-10 rounded-l-xl border-y-2 border-l-2 border-black/10 bg-black/5 hover:bg-black/10 font-black text-black/60 hover:text-black flex items-center justify-center cursor-pointer active:bg-black/15"
      >
        <Minus size={16} />
      </button>
      <div className="flex-1 flex items-center border-y-2 border-black/10 bg-white px-3 min-w-0">
        <span className="text-xs font-bold text-black/40 mr-1 whitespace-nowrap">{prefix}</span>
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="w-full bg-transparent outline-none text-sm font-black text-black text-center"
        />
        <span className="text-xs font-bold text-black/40 ml-1 whitespace-nowrap">{suffix}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        className="w-10 rounded-r-xl border-y-2 border-r-2 border-black/10 bg-black/5 hover:bg-black/10 font-black text-black/60 hover:text-black flex items-center justify-center cursor-pointer active:bg-black/15"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
