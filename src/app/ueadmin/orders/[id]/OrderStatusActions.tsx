"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw } from 'lucide-react';

export default function OrderStatusActions({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const statuses = [
    { id: 'pending', label: 'Pending Payment' },
    { id: 'processing', label: 'Processing' },
    { id: 'on-hold', label: 'On Hold' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'refunded', label: 'Refunded' },
  ];

  async function updateStatus(newStatus: string) {
    const apiStatus = newStatus.toUpperCase().replace('-', '_'); // Map to API format if needed
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST', // Changed from PATCH to match route.ts
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: apiStatus }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setStatus(newStatus.toLowerCase());
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
          onClick={() => updateStatus('cancelled')}
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
          Updating WooCommerce database...
        </div>
      )}
    </div>
  );
}
