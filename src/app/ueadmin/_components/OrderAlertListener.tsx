"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, ShoppingBag, X } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export function OrderAlertListener() {
  const [latestOrderId, setLatestOrderId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    
    // Check for new orders every 30 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/orders/latest");
        if (res.ok) {
          const data = await res.json();
          if (data.id && data.id !== latestOrderId) {
            // New order detected!
            if (latestOrderId !== null) {
              playAlert();
              showNotification(data);
            }
            setLatestOrderId(data.id);
          }
        }
      } catch (error) {
        console.error("Order check failed:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [latestOrderId]);

  const playAlert = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  const showNotification = (order: any) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-2xl rounded-[2rem] pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-black/5`}
      >
        <div className="flex-1 w-0 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white">
                <ShoppingBag size={24} />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-black uppercase tracking-widest text-black/40">New Order Received!</p>
              <p className="mt-1 text-lg font-black text-black">
                {order.customerName || "A customer"} just placed an order
              </p>
              <p className="mt-1 text-sm font-bold text-amber-600 uppercase tracking-widest">
                Amount: {order.currency} {order.total}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col border-l border-black/5">
          <Link
            href={`/ueadmin/orders/${order.id}`}
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 w-full border border-transparent rounded-none rounded-tr-2xl p-4 flex items-center justify-center text-xs font-black uppercase tracking-widest text-black hover:bg-black/5 transition-colors"
          >
            View
          </Link>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 w-full border border-transparent rounded-none rounded-br-2xl p-4 flex items-center justify-center text-xs font-black uppercase tracking-widest text-black/40 hover:bg-black/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-right',
    });
  };

  return null;
}
