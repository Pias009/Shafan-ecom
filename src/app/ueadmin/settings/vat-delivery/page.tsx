"use client";

import { useState, useEffect } from "react";
import { Percent, Truck, Save, Loader2, Minus, Plus, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface CountryChargeSettings {
  vatPercent: number;
  deliveryFee: number;
  freeDelivery: number;
}

interface VATDeliverySettings {
  countries: Record<string, CountryChargeSettings>;
}

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

export default function VATDeliverySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<VATDeliverySettings>({ countries: {} });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vat-delivery", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.countries) {
          setSettings(data.settings);
        }
      } else {
        toast.error("Failed to load VAT & delivery settings");
      }
    } catch {
      toast.error("Failed to load VAT & delivery settings");
    } finally {
      setLoading(false);
    }
  }

  function updateCountry(code: string, patch: Partial<CountryChargeSettings>) {
    setSettings((prev) => ({
      countries: {
        ...prev.countries,
        [code]: {
          ...(prev.countries[code] || { vatPercent: 0, deliveryFee: 0, freeDelivery: 0 }),
          ...patch,
        },
      },
    }));
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/vat-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.settings?.countries) setSettings(data.settings);
        toast.success("VAT & delivery settings saved");
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
          <h1 className="text-2xl font-black">VAT & Delivery Settings</h1>
          <p className="text-sm text-black/70">
            These amounts are applied by default to every product&apos;s order total. Customers pay them on top of the
            subtotal at checkout. Edit a country to increase or decrease its VAT rate and delivery charges.
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
            return (
              <div key={code} className="bg-white rounded-2xl border border-black/10 p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center font-black text-sm">
                      {code}
                    </div>
                    <div>
                      <div className="font-black text-sm">{countryNames[code] || code}</div>
                      <div className="text-xs text-black/50">{currency ? `${currency} prices` : ""}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* VAT % */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/60 flex items-center gap-1 mb-1.5">
                      <Percent size={12} /> VAT Rate (%)
                    </label>
                    <StepperInput
                      value={country.vatPercent}
                      step={1}
                      min={0}
                      onChange={(v) => updateCountry(code, { vatPercent: v })}
                      suffix="%"
                    />
                  </div>

                  {/* Delivery Fee */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/60 flex items-center gap-1 mb-1.5">
                      <Truck size={12} /> Delivery Charge ({currency})
                    </label>
                    <StepperInput
                      value={country.deliveryFee}
                      step={1}
                      min={0}
                      onChange={(v) => updateCountry(code, { deliveryFee: v })}
                      prefix={currency ? `${currency} ` : ""}
                    />
                  </div>

                  {/* Free Delivery Threshold */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/60 flex items-center gap-1 mb-1.5">
                      <Truck size={12} /> Free Delivery Above ({currency})
                    </label>
                    <StepperInput
                      value={country.freeDelivery}
                      step={1}
                      min={0}
                      onChange={(v) => updateCountry(code, { freeDelivery: v })}
                      prefix={currency ? `${currency} ` : ""}
                    />
                  </div>
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
          <li>• VAT is added on top of the product subtotal (and delivery charge) at checkout.</li>
          <li>• Delivery is free when the order subtotal reaches the &quot;Free Delivery Above&quot; amount.</li>
          <li>• Products marked &quot;VAT Exempt&quot; or &quot;Free Delivery&quot; in the product form skip these charges.</li>
        </ul>
      </div>
    </div>
  );
}

const countryNames: Record<string, string> = {
  AE: "United Arab Emirates",
  KW: "Kuwait",
  BH: "Bahrain",
  SA: "Saudi Arabia",
  OM: "Oman",
  QA: "Qatar",
  BD: "Bangladesh (Test)",
};

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