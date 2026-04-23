"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShoppingBag, X, Wifi, WifiOff } from "lucide-react";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useState } from "react";
import Link from "next/link";

interface OrderNotification {
  id: string;
  total: number;
  currency: string;
  userName?: string;
  email?: string;
  timestamp: string;
}

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: OrderNotification;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.9 }}
      className="bg-gradient-to-r from-green-950/90 to-emerald-950/90 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4 shadow-2xl border border-green-500/30 w-full max-w-sm"
    >
      <div className="p-3 bg-green-500/20 rounded-2xl">
        <ShoppingBag className="w-5 h-5 text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">New Order!</p>
        <p className="text-xs text-white/70 truncate">
          {notification.currency?.toUpperCase() || "AED"}{" "}
          {Number(notification.total || 0).toFixed(2)}
        </p>
        {notification.userName && (
          <p className="text-xs text-white/50 truncate">
            {notification.userName}
          </p>
        )}
      </div>
      <Link
        href={`/ueadmin/orders/${notification.id}`}
        className="text-[10px] font-bold uppercase tracking-wider text-green-400 hover:text-green-300 transition"
        onClick={onDismiss}
      >
        View
      </Link>
    </motion.div>
  );
}

export function AdminNotificationPanel() {
  const { notifications, isConnected, clearNotifications } = useAdminNotifications();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 items-end">
      {/* Connection Status */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          isConnected
            ? "bg-green-500/20 text-green-400"
            : "bg-red-500/20 text-red-400"
        }`}
      >
        {isConnected ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        {isConnected ? "Live" : "Offline"}
      </div>

      {/* Notification Toggle Button */}
      {notifications.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-black text-white p-3 rounded-full shadow-xl hover:scale-110 transition-transform relative"
        >
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
      )}

      {/* Clear All Button */}
      {notifications.length > 0 && isExpanded && (
        <button
          onClick={clearNotifications}
          className="text-xs text-white/50 hover:text-white transition"
        >
          Clear all
        </button>
      )}

      {/* Notifications List */}
      <AnimatePresence>
        {isExpanded &&
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDismiss={() => {}}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}