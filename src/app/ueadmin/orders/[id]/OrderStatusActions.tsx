"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { OrderStatus } from '@prisma/client';

export default function OrderStatusActions({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const statuses = [
    { id: OrderStatus.ORDER_RECEIVED, label: 'Order Received' },
    { id: OrderStatus.ORDER_CONFIRMED, label: 'Order Confirmed' },
    { id: OrderStatus.PROCESSING, label: 'Processing' },
    { id: OrderStatus.READY_FOR_PICKUP, label: 'Ready for Pickup' },
    { id: OrderStatus.ORDER_PICKED_UP, label: 'Order Picked Up' },
    { id: OrderStatus.IN_TRANSIT, label: 'In Transit' },
    { id: OrderStatus.DELIVERED, label: 'Delivered' },
    { id: OrderStatus.CANCELLED, label: 'Cancelled' },
    { id: OrderStatus.REFUNDED, label: 'Refunded' },
  ];

  async function updateStatus(newStatus: OrderStatus) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      
      setStatus(newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black uppercase tracking-widest text-black/30">Order Control</div>
        <button
          onClick={() => updateStatus(OrderStatus.CANCELLED)}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Force Cancel Order'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Quick Status Switch</div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => updateStatus(s.id)}
              disabled={loading}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                status === s.id 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-black/40 border-black/5 hover:border-black/20'
              } disabled:opacity-50`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      
      {loading && (
        <div className="flex items-center gap-2 text-[10px] font-bold text-black/40 animate-pulse">
          <Loader2 size={12} className="animate-spin" />
          Updating database...
        </div>
      )}
    </div>
  );
}
