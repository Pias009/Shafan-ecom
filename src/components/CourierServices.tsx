"use client";

import { useState } from "react";
import { Truck, Loader2, Check, X } from "lucide-react";
import toast from "react-hot-toast";

interface CourierServicesProps {
  orderId: string;
  currentStatus: string;
  onSent?: () => void;
}

interface Courier {
  id: string;
  name: string;
  logo: string;
  description: string;
}

const COURIERS: Courier[] = [
  {
    id: "naqel",
    name: "Naqel Express",
    logo: "📦",
    description: "Saudi Arabia's leading logistics provider"
  },
  {
    id: "aramex",
    name: "Aramex",
    logo: "🚚",
    description: "International express delivery"
  },
  {
    id: "shanfa",
    name: "Shanfa Delivery",
    logo: "🏃",
    description: "Local delivery in Kuwait"
  }
];

export default function CourierServices({ orderId, currentStatus, onSent }: CourierServicesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const isOrderReadyForCourier = ["ORDER_CONFIRMED", "PROCESSING", "READY_FOR_PICKUP"].includes(currentStatus);

  const handleSendToCourier = async () => {
    if (!selectedCourier) {
      toast.error("Please select a courier service");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/orders/ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          courier: selectedCourier
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send to courier");
      }

      toast.success(`Order sent to ${COURIERS.find(c => c.id === selectedCourier)?.name}!`);
      setIsOpen(false);
      setSelectedCourier(null);
      onSent?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to send order to courier");
    } finally {
      setSending(false);
    }
  };

  if (!isOrderReadyForCourier) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-xs font-bold shadow-lg shadow-blue-500/20 transition hover:scale-[1.02] active:scale-[0.98]"
      >
        <Truck size={14} />
        Call Courier
      </button>

      {/* Courier Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => !sending && setIsOpen(false)}
          />
          
          <div className="relative bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <button
              onClick={() => !sending && setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition"
              disabled={sending}
            >
              <X size={20} className="text-black/40" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-black">Select Courier Service</h3>
              <p className="text-sm text-black/40 mt-1">Choose a courier to ship this order</p>
            </div>

            <div className="space-y-3 mb-6">
              {COURIERS.map((courier) => (
                <button
                  key={courier.id}
                  onClick={() => setSelectedCourier(courier.id)}
                  disabled={sending}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                    selectedCourier === courier.id
                      ? "border-blue-600 bg-blue-50 shadow-lg"
                      : "border-black/10 hover:border-black/20"
                  } ${sending ? "opacity-50" : ""}`}
                >
                  <div className="text-3xl">{courier.logo}</div>
                  <div className="flex-1">
                    <div className="font-bold text-black">{courier.name}</div>
                    <div className="text-xs text-black/40">{courier.description}</div>
                  </div>
                  {selectedCourier === courier.id && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleSendToCourier}
              disabled={!selectedCourier || sending}
              className="w-full h-14 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending to Courier...
                </>
              ) : (
                <>
                  <Truck size={18} />
                  Send to {COURIERS.find(c => c.id === selectedCourier)?.name || "Courier"}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}