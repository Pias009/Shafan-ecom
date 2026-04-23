"use client";

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Bell, X } from 'lucide-react';

interface NewOrder {
  id: string;
  createdAt: string;
  total: number;
  currency: string;
  status: string;
  email: string | null;
  shipping: any;
  items: any[];
  paymentMethod?: string;
}

export function OrderNotifications() {
  const [newOrders, setNewOrders] = useState<NewOrder[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const lastTimestamp = useRef<number>(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    const checkForNewOrders = async () => {
      try {
        const res = await fetch(`/api/admin/orders/new?since=${lastTimestamp.current}`);
        if (!res.ok) return;

        const data = await res.json();
        
        if (data.orders && data.orders.length > 0) {
          const orders = data.orders as NewOrder[];
          
          // Update timestamp
          lastTimestamp.current = data.timestamp;
          
          // Play notification sound
          playNotificationSound();
          
          // Show toast notification
          showOrderNotification(orders);
          
          // Add to local state
          setNewOrders(prev => [...orders, ...prev].slice(0, 20));
        }
      } catch (error) {
        console.error('Error checking for new orders:', error);
      }
    };

    const onFocus = () => {
      checkForNewOrders();
    };

    window.addEventListener('focus', onFocus);
    
    // Check every 12 hours
    const interval = setInterval(checkForNewOrders, 43200000);
    
    // Initial check after 3 seconds
    const initialTimeout = setTimeout(checkForNewOrders, 3000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [isEnabled]);

  const playNotificationSound = () => {
    // Create audio element for notification sound
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleUclT6bXyIVII0Sd3tHPlX5IGk6j1NHEjEoZTazW0ciOWBlTqdPQzJFhJVSu1NPKk2YqVarU0syWZy1YrdPUzplsM2C609LOmHI0Y9nSzZm1NmTf1NLOnHk2ZNzT0s6dgTZk29PTz6CBOGTZ1NPQoYI3ZNjU0s+ihDdj19TT0aKGN2PW1dTRooY3Y9bW1NGjhjdj1dXU0aKGN2PV1tTRooY3Y9bW1NGjhjdj1tXU0aKGN2PW1tTRooY3Y9bV1NGihjdj1tXU0aKGN2PW1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y9XV1NGihjdj1dXU0aKGN2PV1dTRooY3Y3');
    }
    
    audioRef.current?.play().catch(() => {
      // Audio play failed, silent fallback
    });
  };

  const showOrderNotification = (orders: NewOrder[]) => {
    const total = orders.length;
    const firstOrder = orders[0];
    const totalAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const currency = firstOrder.currency?.toUpperCase() || 'AED';

    // Dismiss previous toast if exists
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }

    if (total === 1) {
      // Single order notification
      toastIdRef.current = toast.custom(
        (t) => (
          <div
            className={`bg-white shadow-2xl rounded-2xl p-4 border-l-4 border-emerald-500 flex items-start gap-3 min-w-[300px] ${
              t.visible ? 'animate-enter' : 'animate-leave'
            }`}
          >
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Bell className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-black">New Order Received!</p>
              <p className="text-xs text-black/60 mt-0.5">
                {currency} {totalAmount.toFixed(2)} • {firstOrder.paymentMethod?.toUpperCase() === 'COD' ? 'Cash on Delivery' : 'Paid'}
              </p>
              <p className="text-xs text-black/40 mt-0.5">{firstOrder.email || 'Guest'}</p>
            </div>
            <a
              href={`/ueadmin/orders/${firstOrder.id}`}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              View →
            </a>
          </div>
        ),
        { duration: 8000, position: 'top-right' }
      );
    } else {
      // Multiple orders notification
      toastIdRef.current = toast.custom(
        (t) => (
          <div
            className={`bg-white shadow-2xl rounded-2xl p-4 border-l-4 border-emerald-500 flex items-start gap-3 min-w-[300px] ${
              t.visible ? 'animate-enter' : 'animate-leave'
            }`}
          >
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Bell className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-black">{total} New Orders!</p>
              <p className="text-xs text-black/60 mt-0.5">
                Total: {currency} {totalAmount.toFixed(2)}
              </p>
            </div>
            <a
              href="/ueadmin/orders"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              View All →
            </a>
          </div>
        ),
        { duration: 8000, position: 'top-right' }
      );
    }
  };

  return null;
}