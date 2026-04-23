"use client";

import { useState, useEffect } from 'react';
import { OrderStatus } from '@prisma/client';

interface OrderStatusBadgeProps {
  orderId: string;
  initialStatus: string;
}

export default function OrderStatusBadge({ orderId, initialStatus }: OrderStatusBadgeProps) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only poll for pending orders, every 60 seconds
    const pendingStatuses = ['ORDER_RECEIVED', 'ORDER_CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP'];
    if (!pendingStatuses.includes(initialStatus)) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status !== status) {
            setStatus(data.status);
          }
        }
      } catch (error) {
        // Ignore polling errors
      }
    }, 60000); // Poll every 60 seconds for pending orders

    return () => clearInterval(interval);
  }, [orderId, status, initialStatus]);

  const statusColors: Record<string, string> = {
    ORDER_RECEIVED: 'bg-blue-100 text-blue-800',
    ORDER_CONFIRMED: 'bg-green-100 text-green-800',
    PROCESSING: 'bg-yellow-100 text-yellow-800',
    READY_FOR_PICKUP: 'bg-purple-100 text-purple-800',
    ORDER_PICKED_UP: 'bg-indigo-100 text-indigo-800',
    IN_TRANSIT: 'bg-cyan-100 text-cyan-800',
    DELIVERED: 'bg-green-500 text-white',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-orange-100 text-orange-800',
  };

  const color = statusColors[status] || 'bg-black/10 text-black/60';

  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${color}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}