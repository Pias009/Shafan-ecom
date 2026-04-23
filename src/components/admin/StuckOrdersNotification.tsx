"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, AlertTriangle, Package, Eye, Bell } from "lucide-react";
import toast from "react-hot-toast";

interface StuckOrderNotification {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  hoursPending: number;
  total: number;
  currency: string;
}

interface StuckOrdersNotificationProps {
  notifications: StuckOrderNotification[];
  onMarkChecked: (orderId: string) => void;
  onViewOrder: (orderId: string) => void;
  onDismiss: () => void;
}

export function StuckOrdersNotification({ 
  notifications, 
  onMarkChecked, 
  onViewOrder,
  onDismiss 
}: StuckOrdersNotificationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [notifications.length]);

  const currentNotification = notifications[currentIndex];

  if (!isVisible || notifications.length === 0) return null;

  const getUrgencyColor = (hours: number) => {
    if (hours >= 48) return "bg-red-500";
    if (hours >= 24) return "bg-orange-500";
    return "bg-yellow-500";
  };

  const getFaceEmoji = (hours: number) => {
    if (hours >= 48) return "(O_O)";
    if (hours >= 24) return "(>_<)";
    return "(?_?)";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.8 }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <div className="glass-panel-heavy bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 border-2 border-red-200 rounded-2xl shadow-2xl overflow-hidden">
          {/* Cute Angry Header with Animation */}
          <div className={`${getUrgencyColor(currentNotification?.hoursPending || 24)} p-3 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="text-2xl"
              >
                {getFaceEmoji(currentNotification?.hoursPending || 24)}
              </motion.div>
              <div className="text-white">
                <p className="text-xs font-black uppercase tracking-wider">⚠️ Order Stuck!</p>
                <p className="text-[10px] font-medium opacity-90">{notifications.length} pending</p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Notification Content */}
          <div className="p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentNotification?.id}
                initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {/* Order Number */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-red-500" />
                    <span className="text-sm font-black text-black">
                      #{currentNotification?.orderNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-600">
                    <Clock size={12} />
                    <span className="text-xs font-bold">
                      {currentNotification?.hoursPending}h pending
                    </span>
                  </div>
                </div>

                {/* Customer */}
                <div className="text-xs text-black/60">
                  <span className="font-medium">{currentNotification?.customerName}</span>
                </div>

                {/* Amount */}
                <div className="text-lg font-black text-red-600">
                  {currentNotification?.currency?.toUpperCase()} {currentNotification?.total?.toFixed(2)}
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  <AlertTriangle size={12} />
                  <span className="text-[10px] font-bold uppercase">{currentNotification?.status}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      onViewOrder(currentNotification?.id);
                      setIsVisible(false);
                    }}
                    className="flex-1 bg-black text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-black/80 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye size={12} />
                    View Order
                  </button>
                  <button
                    onClick={() => onMarkChecked(currentNotification?.id)}
                    className="flex-1 bg-green-500 text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <Bell size={12} />
                    Got It
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots Indicator */}
            {notifications.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {notifications.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                    }}
                    className={`transition-all rounded-full ${
                      index === currentIndex 
                        ? "w-4 bg-red-400" 
                        : "w-2 bg-red-200 hover:bg-red-300"
                    } h-2`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          <div className="px-4 pb-4">
            <button
              onClick={onDismiss}
              className="w-full text-[10px] font-medium text-black/40 hover:text-black/60 transition-colors"
            >
              Dismiss all notifications
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useStuckOrdersNotification() {
  const [notifications, setNotifications] = useState<StuckOrderNotification[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const onFocus = () => {
      fetchNotifications();
    };

    window.addEventListener('focus', onFocus);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 300000); // 5 minutes
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/admin/notifications/stuck-orders');
      const data = await res.json();
      
      if (data.hasStuckOrders && data.notifications?.length > 0) {
        setNotifications(data.notifications);
        setShowNotification(true);
      } else {
        setShowNotification(false);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function markChecked(orderId: string) {
    try {
      await fetch('/api/admin/notifications/stuck-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'markChecked' }),
      });
      
      setNotifications((prev) => prev.filter((n) => n.id !== orderId));
      toast.success('Order marked as checked!');
    } catch (error) {
      console.error('Error marking checked:', error);
    }
  }

  async function dismissAll() {
    setShowNotification(false);
    setNotifications([]);
  }

  return {
    notifications,
    showNotification,
    isLoading,
    markChecked,
    dismissAll,
  };
}