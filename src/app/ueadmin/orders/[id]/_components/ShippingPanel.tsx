"use client";

import { useEffect, useState } from "react";
import {
  Truck, Package, MapPin, RefreshCw, ExternalLink,
  Loader2, Send, CheckCircle2, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface ShipmentData {
  orderId: string;
  courier: string;
  trackingCode: string;
  trackingUrl: string;
  status: string;
  rates: any[];
  selectedRate: string | null;
}

const DIRECT_COURIERS = [
  {
    id: "naqel",
    name: "Naqel Express",
    logo: "📦",
    color: "bg-amber-500 hover:bg-amber-600",
    badge: "GCC",
  },
  {
    id: "aramex",
    name: "Aramex",
    logo: "🚚",
    color: "bg-rose-500 hover:bg-rose-600",
    badge: "Worldwide",
  },
  {
    id: "shanfa",
    name: "Shanfa Delivery",
    logo: "🛵",
    color: "bg-black hover:bg-black/80",
    badge: "Local",
  },
];

export default function ShippingPanel({
  orderId,
  shippingAddress,
  existingShipment,
  onShipmentCreated,
}: {
  orderId: string;
  shippingAddress: any;
  existingShipment?: any;
  onShipmentCreated?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [dispatchingCourier, setDispatchingCourier] = useState<string | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [rates, setRates] = useState<any[]>([]);
  const [tracking, setTracking] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [parcelSize, setParcelSize] = useState({ length: 20, width: 15, height: 10, weight: 1 });
  const [showShippo, setShowShippo] = useState(false);

  // Populate from existing DB shipment
  useEffect(() => {
    if (existingShipment) {
      setShipment({
        orderId,
        courier: existingShipment.courier,
        trackingCode: existingShipment.trackingCode,
        trackingUrl: existingShipment.trackingUrl,
        status: existingShipment.status,
        rates: [],
        selectedRate: null,
      });
    }
  }, [existingShipment, orderId]);

  // ── Direct courier dispatch (Naqel / Aramex) ────────────────────────────────
  async function dispatchToCourier(courierId: string) {
    if (!shippingAddress) {
      toast.error("No shipping address on this order");
      return;
    }

    setDispatchingCourier(courierId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courier: courierId,
          weight: parcelSize.weight,
          length: parcelSize.length,
          width: parcelSize.width,
          height: parcelSize.height,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        toast.error(data.error || "Dispatch failed");
        setDispatchingCourier(null);
        return;
      }

      const courierLabel = DIRECT_COURIERS.find(c => c.id === courierId)?.name || courierId;
      toast.success(`Order sent to ${courierLabel}! AWB: ${data.trackingCode}`);

      setShipment({
        orderId,
        courier: data.courier,
        trackingCode: data.trackingCode,
        trackingUrl: data.trackingUrl,
        status: "Shipped",
        rates: [],
        selectedRate: null,
      });

      if (data.labelUrl) {
        window.open(data.labelUrl, "_blank");
      }

      onShipmentCreated?.();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setDispatchingCourier(null);
  }

  // ── Shippo: get rates ────────────────────────────────────────────────────────
  async function getRates() {
    if (!shippingAddress) {
      toast.error("No shipping address available");
      return;
    }
    setRatesLoading(true);
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rates",
          toAddress: {
            name: `${shippingAddress.first_name} ${shippingAddress.last_name}`,
            street1: shippingAddress.address_1,
            city: shippingAddress.city,
            state: shippingAddress.state || "",
            zip: shippingAddress.postcode || "",
            country: shippingAddress.country,
            phone: shippingAddress.phone || "",
            email: "",
          },
          parcel: {
            length: parcelSize.length,
            width: parcelSize.width,
            height: parcelSize.height,
            distanceUnit: "cm",
            weight: parcelSize.weight,
            massUnit: "kg",
          },
        }),
      });
      const data = await res.json();
      if (data.rates?.length > 0) {
        setRates(data.rates);
        toast.success(`Found ${data.rates.length} rates`);
      } else {
        toast.error(data.error || "No rates found");
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setRatesLoading(false);
  }

  // ── Shippo: purchase label ───────────────────────────────────────────────────
  async function purchaseLabel(rateId: string, rateData?: any) {
    setLoading(true);
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "purchase",
          rateId,
          rateData,
          shipmentData: {
            orderId,
            recipientName: shippingAddress
              ? `${shippingAddress.first_name} ${shippingAddress.last_name}`
              : "Customer",
            phone: shippingAddress?.phone || "",
            email: shippingAddress?.email || "",
            address: shippingAddress?.address_1 || "",
            city: shippingAddress?.city || "",
            state: shippingAddress?.state || "",
            country: shippingAddress?.country || "",
            postalCode: shippingAddress?.postcode || "",
            items: [],
          },
        }),
      });

      const data = await res.json();
      if (data.trackingNumber) {
        await fetch(`/api/admin/orders/${orderId}/ship`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courier: data.provider || "Shippo",
            trackingCode: data.trackingNumber,
            trackingUrl: data.trackingUrl,
          }),
        });
        toast.success(`Label purchased via ${data.provider}`);
        setShipment({
          orderId,
          courier: data.provider || "Shippo",
          trackingCode: data.trackingNumber,
          trackingUrl: data.trackingUrl,
          status: "Label Created",
          rates: [],
          selectedRate: rateId,
        });
        onShipmentCreated?.();
      } else {
        toast.error(data.error || "Failed to purchase label");
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setLoading(false);
  }

  // ── Print label ──────────────────────────────────────────────────────────────
  async function printLabel(trackingCode: string, courier: string) {
    setLoading(true);
    try {
      let url = "";
      if (courier?.toLowerCase() === "aramex") {
        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "aramex-print-label", trackingNumber: trackingCode }),
        });
        const data = await res.json();
        url = data.labelUrl;
      } else if (courier?.toLowerCase() === "naqel") {
        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "naqel-label", airwaybill: trackingCode }),
        });
        const data = await res.json();
        url = data[0]?.label || data.labelUrl;
      }
      if (url) {
        window.open(url, "_blank");
        toast.success("Label opened in new tab");
      } else {
        toast.error("No label URL available — try the courier portal");
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setLoading(false);
  }

  // ── Track shipment ───────────────────────────────────────────────────────────
  async function trackShipment() {
    if (!shipment?.trackingCode) return;
    setTrackingLoading(true);
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tracking",
          trackingNumber: shipment.trackingCode,
          carrier: shipment.courier,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTracking(data);
        toast.success("Tracking updated");
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setTrackingLoading(false);
  }

  if (!shippingAddress) {
    return (
      <div className="text-center p-10 text-black/40">
        <MapPin size={32} className="mx-auto mb-2 opacity-50" />
        <p className="font-bold text-sm">No shipping address on this order</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Toaster />

      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-black/5 rounded-xl"><Truck size={18} /></div>
        <h3 className="font-black text-sm uppercase tracking-widest">Shipping Management</h3>
      </div>

      {/* ── Parcel size ────────────────────────────────────────────────────── */}
      <div className="bg-black/[0.03] rounded-2xl border border-black/8 p-5 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-black/50 flex items-center gap-1">
          <Package size={12} /> Parcel Size
        </p>
        <div className="grid grid-cols-4 gap-3">
          {(["length", "width", "height", "weight"] as const).map((field) => (
            <div key={field}>
              <label className="text-[9px] font-bold uppercase text-black/40">
                {field} {field === "weight" ? "(kg)" : "(cm)"}
              </label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={parcelSize[field]}
                onChange={(e) =>
                  setParcelSize({ ...parcelSize, [field]: Number(e.target.value) })
                }
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Existing shipment card ─────────────────────────────────────────── */}
      {shipment && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={18} />
              <span className="font-black text-sm uppercase tracking-widest">Shipment Active</span>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">
              {shipment.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-green-100">
              <div className="text-[9px] font-black uppercase text-black/40 mb-1">Courier</div>
              <div className="font-black text-sm">{shipment.courier}</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-green-100">
              <div className="text-[9px] font-black uppercase text-black/40 mb-1">Tracking #</div>
              <div className="font-mono font-black text-sm">{shipment.trackingCode}</div>
            </div>
          </div>

          {shipment.trackingUrl && (
            <a
              href={shipment.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 text-sm font-bold hover:underline"
            >
              <ExternalLink size={14} /> Track on {shipment.courier}
            </a>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => printLabel(shipment.trackingCode, shipment.courier)}
              disabled={loading}
              className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1 transition"
            >
              <ExternalLink size={12} /> Print Label
            </button>
            <button
              onClick={trackShipment}
              disabled={trackingLoading}
              className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1 transition"
            >
              {trackingLoading ? <Loader2 className="animate-spin" size={12} /> : <RefreshCw size={12} />}
              Refresh Tracking
            </button>
          </div>

          {/* Tracking timeline */}
          {tracking?.events?.length > 0 && (
            <div className="space-y-2 mt-2">
              <p className="text-[9px] font-black uppercase text-black/40">Tracking History</p>
              {tracking.events.slice(0, 5).map((e: any, i: number) => (
                <div key={i} className="text-xs p-3 bg-white rounded-lg border border-green-100">
                  <div className="font-bold">{e.status}</div>
                  <div className="text-black/60">{e.message}</div>
                  <div className="text-black/40">{e.location?.city}, {e.location?.country}</div>
                </div>
              ))}
            </div>
          )}

          {/* Re-dispatch option */}
          <p className="text-[10px] text-black/40 text-center pt-1">
            You can re-dispatch below to replace this shipment
          </p>
        </div>
      )}

      {/* ── Direct courier dispatch ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-black/10 p-5 space-y-4">
        <div>
          <p className="font-black text-xs uppercase tracking-widest text-slate-700 mb-1">
            Send to Courier
          </p>
          <p className="text-[10px] text-black/50">
            One-click dispatch — creates AWB & label automatically
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {DIRECT_COURIERS.map((c) => {
            const isDispatching = dispatchingCourier === c.id;
            return (
              <button
                key={c.id}
                onClick={() => dispatchToCourier(c.id)}
                disabled={!!dispatchingCourier}
                className={`${c.color} text-white rounded-xl py-4 px-4 font-black text-sm flex flex-col items-center justify-center gap-2 transition disabled:opacity-50`}
              >
                {isDispatching ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <span className="text-2xl">{c.logo}</span>
                )}
                <span className="text-xs uppercase tracking-widest">
                  {isDispatching ? "Dispatching…" : c.name}
                </span>
                <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full">
                  {c.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Shippo rates (collapsible) ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-black/10 overflow-hidden">
        <button
          onClick={() => setShowShippo((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-black/[0.02] transition"
        >
          <div>
            <p className="font-black text-xs uppercase tracking-widest text-slate-700">
              Other Carriers (via Shippo)
            </p>
            <p className="text-[10px] text-black/40 mt-0.5">DHL, FedEx, UPS, USPS…</p>
          </div>
          {showShippo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showShippo && (
          <div className="px-5 pb-5 space-y-4 border-t border-black/5">
            <button
              onClick={getRates}
              disabled={ratesLoading}
              className="w-full mt-4 py-3 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black/80 disabled:opacity-50 transition"
            >
              {ratesLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Get Rates
            </button>

            {rates.length > 0 && (
              <div className="space-y-2">
                {rates.map((rate) => (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-black/10 hover:border-black/30 transition"
                  >
                    <div>
                      <div className="font-bold text-sm">{rate.provider} — {rate.service}</div>
                      <div className="text-xs text-black/50">{rate.duration} · {rate.estimatedDays}d</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-base">{rate.currency} {rate.amount?.toFixed(2)}</div>
                      <button
                        onClick={() => purchaseLabel(rate.rateId, rate)}
                        disabled={loading}
                        className="mt-1 px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-bold uppercase transition disabled:opacity-50"
                      >
                        {loading ? "…" : "Ship"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}