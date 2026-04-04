"use client";

import { useEffect, useState } from "react";
import { Truck, Package, MapPin, RefreshCw, Check, X, ExternalLink, Loader2 } from "lucide-react";
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

const CARRIERS = [
  { id: 'aramex', name: 'Aramex', logo: '🚚' },
  { id: 'naqel', name: 'Naqel Express', logo: '📦' },
  { id: 'dhl_express', name: 'DHL Express', logo: '✈️' },
  { id: 'fedex', name: 'FedEx', logo: '📬' },
  { id: 'ups', name: 'UPS', logo: '📫' },
  { id: 'usps', name: 'USPS', logo: '🐢' },
];

export default function ShippingPanel({ orderId, shippingAddress, existingShipment, onShipmentCreated }: { 
  orderId: string; 
  shippingAddress: any;
  existingShipment?: any;
  onShipmentCreated?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [rates, setRates] = useState<any[]>([]);
  const [tracking, setTracking] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [parcelSize, setParcelSize] = useState({ length: 20, width: 15, height: 10, weight: 1 });

  // Use existing shipment from props instead of fetching
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

  async function fetchShipment() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const text = await res.text();
      
      if (!res.ok) {
        console.error("Fetch shipment failed:", res.status, text);
        if (text.includes('Unauthorized')) {
          toast.error("Not authorized to view this order");
        } else {
          toast.error(`Error: ${text}`);
        }
        setLoading(false);
        return;
      }
      
      if (!text) {
        console.log("Empty response for order", orderId);
        setLoading(false);
        return;
      }
      
      // Check if response is HTML (error page) instead of JSON
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.error("Got HTML instead of JSON:", text.substring(0, 200));
        toast.error("Server error - check console");
        setLoading(false);
        return;
      }
      
      const data = JSON.parse(text);
      
      if (data.error) {
        console.error("Order API error:", data.error);
        toast.error(data.error);
        setLoading(false);
        return;
      }
      
      if (data.shipment) {
        setShipment({
          orderId: data.id,
          courier: data.shipment.courier,
          trackingCode: data.shipment.trackingCode,
          trackingUrl: data.shipment.trackingUrl,
          status: data.shipment.status,
          rates: [],
          selectedRate: null,
        });
      }
    } catch (e: any) {
      console.error("Error fetching shipment:", e);
      toast.error("Error: " + e.message);
    }
    setLoading(false);
  }

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
      if (data.rates && data.rates.length > 0) {
        setRates(data.rates);
        toast.success(`Found ${data.rates.length} shipping rates`);
      } else {
        toast.error(data.error || "Failed to get rates");
      }
    } catch (e: any) {
      toast.error("Error getting rates: " + e.message);
    }
    setRatesLoading(false);
  }

  async function purchaseLabel(rateId: string, rateData?: any) {
    setLoading(true);
    try {
      const shipmentPayload = {
        orderId,
        recipientName: shippingAddress ? `${shippingAddress.first_name} ${shippingAddress.last_name}` : 'Customer',
        phone: shippingAddress?.phone || '',
        email: shippingAddress?.email || '',
        address: shippingAddress?.address_1 || '',
        city: shippingAddress?.city || '',
        state: shippingAddress?.state || '',
        country: shippingAddress?.country || '',
        postalCode: shippingAddress?.postcode || '',
        items: [],
      };

      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "purchase",
          rateId,
          rateData,
          shipmentData: shipmentPayload,
        }),
      });

      const data = await res.json();
      if (data.trackingNumber) {
        // Save shipment to database
        await fetch(`/api/admin/orders/${orderId}/ship`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courier: data.provider || "Shippo",
            trackingCode: data.trackingNumber,
            trackingUrl: data.trackingUrl,
          }),
        });

        toast.success(`Label purchased via ${data.provider}! Shipment created.`);
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

  async function printLabel(trackingCode: string, courier: string) {
    setLoading(true);
    try {
      let url = '';
      
      if (courier?.toLowerCase() === 'aramex') {
        const res = await fetch('/api/shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'aramex-print-label', trackingNumber: trackingCode }),
        });
        const data = await res.json();
        url = data.labelUrl;
      } else if (courier?.toLowerCase() === 'naqel') {
        const res = await fetch('/api/shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'naqel-label', airwaybill: trackingCode }),
        });
        const data = await res.json();
        url = data[0]?.label || data.labelUrl;
      }
      
      if (url) {
        window.open(url, '_blank');
        toast.success('Label opened in new tab');
      } else {
        toast.error('No label available');
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
    setLoading(false);
  }

  async function getInvoice(trackingCode: string, courier: string) {
    setLoading(true);
    try {
      let url = '';
      
      if (courier?.toLowerCase() === 'aramex') {
        const res = await fetch('/api/shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'aramex-invoice', trackingNumber: trackingCode }),
        });
        const data = await res.json();
        url = data.invoiceUrl;
      }
      
      if (url) {
        window.open(url, '_blank');
        toast.success('Invoice opened in new tab');
      } else {
        toast.error('No invoice available for this courier');
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
    setLoading(false);
  }

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
        toast.success("Tracking info updated");
      }
    } catch (e: any) {
      toast.error("Error tracking: " + e.message);
    }
    setTrackingLoading(false);
  }

  return (
    <div className="space-y-6">
      <Toaster />
      
      {/* Parcel Size Settings */}
      <div className="bg-white rounded-2xl border border-black/10 p-6 space-y-4">
        <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
          <Package size={16} /> Parcel Details
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {['length', 'width', 'height', 'weight'].map((field) => (
            <div key={field}>
              <label className="text-[10px] font-bold uppercase text-black/50">{field} (cm/kg)</label>
              <input
                type="number"
                value={parcelSize[field as keyof typeof parcelSize]}
                onChange={(e) => setParcelSize({ ...parcelSize, [field]: Number(e.target.value) })}
                className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm font-bold"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Get Rates Button */}
      <button
        onClick={getRates}
        disabled={ratesLoading || !shippingAddress}
        className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black/80 disabled:opacity-50"
      >
        {ratesLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
        Get Shipping Rates
      </button>

      {/* Rates List */}
      {rates.length > 0 && !shipment && (
        <div className="bg-white rounded-2xl border border-black/10 p-6 space-y-4">
          <h3 className="font-black text-sm uppercase tracking-widest">Available Rates</h3>
          <div className="space-y-3">
            {rates.map((rate) => (
              <div
                key={rate.id}
                className="flex items-center justify-between p-4 rounded-xl border border-black/10 hover:border-black/30 transition-all"
              >
                <div>
                  <div className="font-bold text-sm">{rate.provider} - {rate.service}</div>
                  <div className="text-xs text-black/50">{rate.duration} • {rate.estimatedDays} days</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-lg">{rate.currency} {rate.amount.toFixed(2)}</div>
                  <button
                    onClick={() => purchaseLabel(rate.rateId, rate)}
                    disabled={loading}
                    className="mt-2 px-4 py-2 bg-green-500 text-white rounded-full text-xs font-bold uppercase"
                  >
                    Ship
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Shipment */}
      {shipment && (
        <div className="bg-white rounded-2xl border border-black/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <Truck size={16} /> Shipment Details
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              shipment.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {shipment.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-black/5 rounded-xl">
            <div>
              <div className="text-[10px] font-bold uppercase text-black/50">Courier</div>
              <div className="font-black text-sm">{shipment.courier}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-black/50">Tracking #</div>
              <div className="font-black text-sm">{shipment.trackingCode}</div>
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

          {/* Label & Invoice Buttons */}
          {shipment.trackingCode && (
            <div className="flex gap-2">
              <button
                onClick={() => printLabel(shipment.trackingCode, shipment.courier)}
                className="flex-1 py-2 bg-purple-500 text-white rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1"
              >
                <ExternalLink size={12} /> Print Label
              </button>
              <button
                onClick={() => getInvoice(shipment.trackingCode, shipment.courier)}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1"
              >
                <ExternalLink size={12} /> Invoice
              </button>
            </div>
          )}

          <button
            onClick={trackShipment}
            disabled={trackingLoading}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            {trackingLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Refresh Tracking
          </button>

          {/* Tracking Events */}
          {tracking?.events?.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="text-xs font-black uppercase text-black/50">Tracking History</h4>
              {tracking.events.slice(0, 5).map((event: any, idx: number) => (
                <div key={idx} className="text-xs p-3 bg-black/5 rounded-lg">
                  <div className="font-bold">{event.status}</div>
                  <div className="text-black/60">{event.message}</div>
                  <div className="text-black/40">{event.location?.city}, {event.location?.country}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Shipping Address */}
      {!shippingAddress && (
        <div className="text-center p-8 text-black/40">
          <MapPin size={32} className="mx-auto mb-2 opacity-50" />
          <p className="font-bold text-sm">No shipping address available</p>
        </div>
      )}
    </div>
  );
}