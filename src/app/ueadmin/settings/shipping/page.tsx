"use client";

import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, Check, X, Truck, MapPin, Key, Globe, Package, Loader2, AlertCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface ShippoSettings {
  shipperName: string;
  shipperAddress: string;
  shipperCity: string;
  shipperState: string;
  shipperZip: string;
  shipperCountry: string;
  shipperPhone: string;
  shipperEmail: string;
  defaultWeight: number;
  defaultLength: number;
  defaultWidth: number;
  defaultHeight: number;
  enabledCarriers: string[];
  testMode: boolean;
}

const DEFAULT_SETTINGS: ShippoSettings = {
  shipperName: "Shafan Store",
  shipperAddress: "",
  shipperCity: "Dubai",
  shipperState: "Dubai",
  shipperZip: "00000",
  shipperCountry: "AE",
  shipperPhone: "",
  shipperEmail: "",
  defaultWeight: 1,
  defaultLength: 20,
  defaultWidth: 15,
  defaultHeight: 10,
  enabledCarriers: ["aramex", "dhl_express", "fedex"],
  testMode: true,
};

const AVAILABLE_CARRIERS = [
  { id: "aramex", name: "Aramex", logo: "🚚" },
  { id: "dhl_express", name: "DHL Express", logo: "📦" },
  { id: "fedex", name: "FedEx", logo: "✈️" },
  { id: "ups", name: "UPS", logo: "📬" },
  { id: "usps", name: "USPS", logo: "🐢" },
  { id: "naqel", name: "Naqel Express", logo: "🚛" },
];

export default function ShippoSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingRates, setTestingRates] = useState(false);
  const [settings, setSettings] = useState<ShippoSettings>(DEFAULT_SETTINGS);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [testRate, setTestRate] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  function loadSettings() {
    const saved = localStorage.getItem("shippoSettings");
    if (saved) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
    }
  }

  function saveSettings() {
    localStorage.setItem("shippoSettings", JSON.stringify(settings));
    
    // Also save to process.env for API use
    Object.entries(settings).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        localStorage.setItem(`SHIPPO_${key.toUpperCase()}`, String(value));
      } else if (Array.isArray(value)) {
        localStorage.setItem(`SHIPPO_${key.toUpperCase()}`, JSON.stringify(value));
      } else {
        localStorage.setItem(`SHIPPO_${key.toUpperCase()}`, String(value));
      }
    });
    
    toast.success("Settings saved!");
  }

  async function testConnection() {
    setTesting(true);
    setConnectionStatus("idle");
    
    try {
      const res = await fetch("/api/shipping", { method: "GET" });
      if (res.ok) {
        setConnectionStatus("success");
        toast.success("Connection successful!");
      } else {
        setConnectionStatus("error");
        toast.error("Connection failed");
      }
    } catch (e) {
      setConnectionStatus("error");
      toast.error("Connection failed");
    }
    
    setTesting(false);
  }

  async function testRates() {
    setTestingRates(true);
    setTestRate(null);
    
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rates",
          toAddress: {
            name: "Test Customer",
            street1: "123 Test Street",
            city: "Dubai",
            state: "Dubai",
            zip: "12345",
            country: "AE",
            phone: "+971501234567",
            email: "test@example.com",
          },
          parcel: {
            length: settings.defaultLength,
            width: settings.defaultWidth,
            height: settings.defaultHeight,
            distanceUnit: "cm",
            weight: settings.defaultWeight,
            massUnit: "kg",
          },
        }),
      });
      
      const data = await res.json();
      if (data.success && data.rates?.length > 0) {
        setTestRate(data.rates[0]);
        toast.success(`Got ${data.rates.length} rates!`);
      } else {
        toast.error(data.error || "No rates available");
      }
    } catch (e: any) {
      toast.error("Rate test failed: " + e.message);
    }
    
    setTestingRates(false);
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <Toaster />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-black rounded-2xl text-white">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black">Shippo Settings</h1>
            <p className="text-sm text-black/50">Configure your shipping integration</p>
          </div>
        </div>
        
        <button
          onClick={saveSettings}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold text-sm"
        >
          <Save size={18} /> Save Settings
        </button>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-2xl border border-black/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${connectionStatus === "success" ? "bg-green-500" : connectionStatus === "error" ? "bg-red-500" : "bg-gray-300"}`} />
            <div>
              <div className="font-bold">API Status</div>
              <div className="text-xs text-black/50">
                {connectionStatus === "success" ? "Connected" : connectionStatus === "error" ? "Failed" : "Not tested"}
              </div>
            </div>
          </div>
          
          <button
            onClick={testConnection}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 rounded-lg text-sm font-bold hover:bg-black/10"
          >
            {testing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Test Connection
          </button>
        </div>
      </div>

      {/* Test Mode Toggle */}
      <div className="bg-white rounded-2xl border border-black/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Globe size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="font-bold">Test Mode</div>
              <div className="text-xs text-black/50">Use Shippo test API (no real charges)</div>
            </div>
          </div>
          <button
            onClick={() => setSettings({ ...settings, testMode: !settings.testMode })}
            className={`w-12 h-6 rounded-full transition-all ${settings.testMode ? "bg-green-500" : "bg-gray-300"}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.testMode ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Shipper Address */}
      <div className="bg-white rounded-2xl border border-black/10 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-black/50" />
          <h3 className="font-bold">Warehouse Address (Ship From)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase text-black/50">Business Name</label>
            <input
              value={settings.shipperName}
              onChange={(e) => setSettings({ ...settings, shipperName: e.target.value })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-bold mt-1"
              placeholder="Shafan Store"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase text-black/50">Street Address</label>
            <input
              value={settings.shipperAddress}
              onChange={(e) => setSettings({ ...settings, shipperAddress: e.target.value })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-bold mt-1"
              placeholder="123 Warehouse Street"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase text-black/50">City</label>
            <input
              value={settings.shipperCity}
              onChange={(e) => setSettings({ ...settings, shipperCity: e.target.value })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-bold mt-1"
              placeholder="Dubai"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase text-black/50">State/Region</label>
            <input
              value={settings.shipperState}
              onChange={(e) => setSettings({ ...settings, shipperState: e.target.value })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-bold mt-1"
              placeholder="Dubai"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase text-black/50">Postal Code</label>
            <input
              value={settings.shipperZip}
              onChange={(e) => setSettings({ ...settings, shipperZip: e.target.value })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-bold mt-1"
              placeholder="00000"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase text-black/50">Country Code</label>
            <input
              value={settings.shipperCountry}
              onChange={(e) => setSettings({ ...settings, shipperCountry: e.target.value.toUpperCase() })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-bold mt-1"
              placeholder="AE"
              maxLength={2}
            />
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase text-black/50">Phone</label>
            <input
              value={settings.shipperPhone}
              onChange={(e) => setSettings({ ...settings, shipperPhone: e.target.value })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-bold mt-1"
              placeholder="+971501234567"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase text-black/50">Email</label>
            <input
              value={settings.shipperEmail}
              onChange={(e) => setSettings({ ...settings, shipperEmail: e.target.value })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-bold mt-1"
              placeholder="warehouse@shafan.com"
            />
          </div>
        </div>
      </div>

      {/* Default Parcel Settings */}
      <div className="bg-white rounded-2xl border border-black/10 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Package size={18} className="text-black/50" />
          <h3 className="font-bold">Default Parcel Size</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-black/50">Length (cm)</label>
            <input
              type="number"
              value={settings.defaultLength}
              onChange={(e) => setSettings({ ...settings, defaultLength: Number(e.target.value) })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-bold mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/50">Width (cm)</label>
            <input
              type="number"
              value={settings.defaultWidth}
              onChange={(e) => setSettings({ ...settings, defaultWidth: Number(e.target.value) })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-bold mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/50">Height (cm)</label>
            <input
              type="number"
              value={settings.defaultHeight}
              onChange={(e) => setSettings({ ...settings, defaultHeight: Number(e.target.value) })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-bold mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-black/50">Weight (kg)</label>
            <input
              type="number"
              value={settings.defaultWeight}
              onChange={(e) => setSettings({ ...settings, defaultWeight: Number(e.target.value) })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-bold mt-1"
            />
          </div>
        </div>
      </div>

      {/* Enabled Carriers */}
      <div className="bg-white rounded-2xl border border-black/10 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Truck size={18} className="text-black/50" />
          <h3 className="font-bold">Enabled Carriers</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AVAILABLE_CARRIERS.map((carrier) => (
            <label
              key={carrier.id}
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                settings.enabledCarriers.includes(carrier.id)
                  ? "border-black bg-black/5"
                  : "border-black/10 hover:border-black/30"
              }`}
            >
              <input
                type="checkbox"
                checked={settings.enabledCarriers.includes(carrier.id)}
                onChange={(e) => {
                  const newCarriers = e.target.checked
                    ? [...settings.enabledCarriers, carrier.id]
                    : settings.enabledCarriers.filter((c) => c !== carrier.id);
                  setSettings({ ...settings, enabledCarriers: newCarriers });
                }}
                className="w-4 h-4"
              />
              <span className="text-xl">{carrier.logo}</span>
              <span className="font-bold text-sm">{carrier.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Test Rate */}
      <div className="bg-white rounded-2xl border border-black/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold">Test Shipping Rate</h3>
            <p className="text-xs text-black/50">Send a test rate request to Shippo</p>
          </div>
          <button
            onClick={testRates}
            disabled={testingRates}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-bold"
          >
            {testingRates ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Test Rate
          </button>
        </div>
        
        {testRate && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
              <Check size={18} /> Rate Found!
            </div>
            <div className="text-sm">
              <span className="font-black text-2xl">{testRate.currency} {testRate.amount.toFixed(2)}</span>
              <span className="text-black/50"> via {testRate.provider} - {testRate.service}</span>
            </div>
            <div className="text-xs text-black/50 mt-1">{testRate.duration}</div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 mt-0.5" />
          <div>
            <div className="font-bold text-blue-700">Configuration Tips</div>
            <ul className="text-sm text-blue-600 mt-2 space-y-1">
              <li>• Make sure your Shippo API key is set in .env file (SHIPPO_API_KEY)</li>
              <li>• Add your carrier accounts in Shippo Dashboard for live rates</li>
              <li>• Test mode won't create real shipments or charge you</li>
              <li>• Warehouse address is used as the sender address for all shipments</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}