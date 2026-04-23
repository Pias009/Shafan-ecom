"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, X } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import Pusher from "pusher-js";

interface OrderData {
  id: string;
  total: number;
  currency: string;
  userName?: string;
  email?: string;
}

export function OrderAlertListener() {
  const [latestOrderId, setLatestOrderId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const audioLoadedRef = useRef(false);
  const latestOrderIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  const playAlert = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.3);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.4);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
      
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (e) {
      console.log("Audio play failed:", e);
    }
  }, []);

  const handleNewOrder = useCallback((order: OrderData) => {
    playAlert();
    showNotification(order);
    setLatestOrderId(order.id);
    latestOrderIdRef.current = order.id;
  }, [playAlert]);

  const showNotification = (order: OrderData) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-2xl rounded-[2rem] pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-black/5`}
      >
        <div className="flex-1 w-0 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white animate-pulse">
                <Bell size={24} />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-black uppercase tracking-widest text-emerald-600">New Order!</p>
              <p className="mt-1 text-lg font-black text-black">
                {order.userName || order.email || "A customer"} just placed an order
              </p>
              <p className="mt-1 text-sm font-bold text-amber-600 uppercase tracking-widest">
                Amount: {order.currency?.toUpperCase() || "AED"} {Number(order.total || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col border-l border-black/5">
          <Link
            href={`/ueadmin/orders/${order.id}`}
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 w-full border border-transparent rounded-none rounded-tr-2xl p-4 flex items-center justify-center text-xs font-black uppercase tracking-widest text-white bg-black hover:bg-gray-800 transition-colors"
          >
            View Order
          </Link>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 w-full border border-transparent rounded-none rounded-br-2xl p-4 flex items-center justify-center text-xs font-black uppercase tracking-widest text-black/40 hover:bg-black/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    ), {
      duration: 15000,
      position: 'top-right',
    });
  };

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (pusherKey && pusherCluster) {
      try {
        pusherRef.current = new Pusher(pusherKey, {
          cluster: pusherCluster,
        });

        const channel = pusherRef.current.subscribe("admin-notifications");
        
        channel.bind("new-order", (data: OrderData) => {
          console.log("WebSocket: New order received via Pusher", data);
          handleNewOrder(data);
        });

        pusherRef.current.connection.bind("connected", () => {
          console.log("WebSocket: Connected to Pusher");
        });

        pusherRef.current.connection.bind("disconnected", () => {
          console.log("WebSocket: Disconnected from Pusher");
        });
      } catch (error) {
        console.error("Pusher initialization failed:", error);
      }
    }

    const checkForNewOrders = async () => {
      try {
        const res = await fetch("/api/admin/orders/latest");
        if (res.ok) {
          const data = await res.json();
          if (data.id) {
            if (!hasInitializedRef.current) {
              setLatestOrderId(data.id);
              latestOrderIdRef.current = data.id;
              setHasInitialized(true);
              hasInitializedRef.current = true;
            } else if (data.id !== latestOrderIdRef.current) {
              handleNewOrder({
                id: data.id,
                total: data.total,
                currency: data.currency,
                userName: data.customerName,
              });
            }
          }
        }
      } catch (error) {
        console.error("Order check failed:", error);
      }
    };

    const onFocus = () => {
      checkForNewOrders();
    };

    window.addEventListener('focus', onFocus);
    checkForNewOrders();
    pollingRef.current = setInterval(checkForNewOrders, 43200000); // 12 hours

    return () => {
      window.removeEventListener('focus', onFocus);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (pusherRef.current) {
        pusherRef.current.unsubscribe("admin-notifications");
        pusherRef.current.disconnect();
      }
    };
  }, [handleNewOrder]);

  return null;
}