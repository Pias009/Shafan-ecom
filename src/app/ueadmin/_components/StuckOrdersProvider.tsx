"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Eye, Bell, X, Clock, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface StuckOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  hoursPending: number;
  total: number;
  currency: string;
}

interface StuckOrdersProviderProps {
  children?: React.ReactNode;
}

export function StuckOrdersProvider({ children }: StuckOrdersProviderProps) {
  const [stuckOrders, setStuckOrders] = useState<StuckOrder[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [direction, setDirection] = useState(0);

  const fetchStuckOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications/stuck-orders');
      const data = await res.json();

      if (data.hasStuckOrders && data.notifications?.length > 0) {
        if (!dismissed) {
          setStuckOrders(data.notifications);
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error fetching stuck orders:', error);
    }
  }, [dismissed]);

  useEffect(() => {
    const onFocus = () => {
      fetchStuckOrders();
    };

    window.addEventListener('focus', onFocus);
    fetchStuckOrders();
    const interval = setInterval(fetchStuckOrders, 43200000); // 12 hours
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [fetchStuckOrders]);

  useEffect(() => {
    if (stuckOrders.length > 1) {
      const interval = setInterval(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % stuckOrders.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [stuckOrders.length]);

  const markChecked = async (orderId: string) => {
    try {
      await fetch('/api/admin/notifications/stuck-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'markChecked' }),
      });
      
      setStuckOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success('Marked as checked!');
      
      if (stuckOrders.length <= 1) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error marking checked:', error);
    }
  };

  const viewOrder = (orderId: string) => {
    window.open(`/ueadmin/orders/${orderId}`, '_blank');
  };

  const dismissAll = () => {
    setDismissed(true);
    setIsVisible(false);
  };

  const current = stuckOrders[currentIndex];

  const getUrgencyColor = (hours: number) => {
    if (hours >= 48) return 'from-red-500 to-red-600';
    if (hours >= 24) return 'from-orange-500 to-orange-600';
    return 'from-yellow-500 to-yellow-600';
  };

  const getFace = (hours: number) => {
    if (hours >= 48) return '(O_O)';
    if (hours >= 24) return '(>_<)';
    return '(?_?)';
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {isVisible && current && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div className="glass-panel-heavy bg-white border-2 border-red-100 rounded-2xl shadow-2xl overflow-hidden">
              {/* Cute Angry Header */}
              <div className={`bg-gradient-to-r ${getUrgencyColor(current.hoursPending)} p-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1, 1.1, 1]
                    }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    className="text-2xl filter drop-shadow-lg"
                  >
                    {getFace(current.hoursPending)}
                  </motion.div>
                  <div className="text-white">
                    <p className="text-xs font-black uppercase tracking-wider">⚠️ Order Stuck!</p>
                    <p className="text-[10px] font-medium opacity-90">{stuckOrders.length} pending</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-red-500" />
                        <span className="text-sm font-black text-black">
                          #{current.orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-600">
                        <Clock size={12} />
                        <span className="text-xs font-bold">
                          {current.hoursPending}h pending
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-black/60">
                      <span className="font-medium">{current.customerName}</span>
                    </div>

                    <div className="text-lg font-black text-red-600">
                      {current.currency?.toUpperCase()} {current.total?.toFixed(2)}
                    </div>

                    <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      <AlertTriangle size={12} />
                      <span className="text-[10px] font-bold uppercase">{current.status}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => viewOrder(current.id)}
                        className="flex-1 bg-black text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-black/80 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye size={12} /> View Order
                      </button>
                      <button
                        onClick={() => markChecked(current.id)}
                        className="flex-1 bg-green-500 text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <Bell size={12} /> Got It
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {stuckOrders.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-3">
                    {stuckOrders.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setDirection(idx > currentIndex ? 1 : -1);
                          setCurrentIndex(idx);
                        }}
                        className={`transition-all rounded-full ${
                          idx === currentIndex ? "w-4 bg-red-400" : "w-2 bg-red-200"
                        } h-2`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 pb-4">
                <button
                  onClick={dismissAll}
                  className="w-full text-[10px] font-medium text-black/40 hover:text-black/60"
                >
                  Dismiss all
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}