"use client";

import { useEffect, useState, useCallback } from "react";
import Pusher from "pusher-js";

interface OrderNotification {
  id: string;
  total: number;
  currency: string;
  userName?: string;
  email?: string;
  timestamp: string;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.warn("Pusher not configured - real-time notifications disabled");
      return;
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const channel = pusher.subscribe("admin-notifications");

    channel.bind("new-order", (data: OrderNotification) => {
      setNotifications((prev) => [data, ...prev].slice(0, 10));
    });

    pusher.connection.bind("connected", () => {
      setIsConnected(true);
    });

    pusher.connection.bind("disconnected", () => {
      setIsConnected(false);
    });

    setIsConnected(pusher.connection.state === "connected");

    return () => {
      pusher.unsubscribe("admin-notifications");
      pusher.disconnect();
    };
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    isConnected,
    clearNotifications,
    removeNotification,
  };
}