"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Package, Check, Truck, CircleDollarSign, RotateCcw } from 'lucide-react';
import { OrderStatus } from '@prisma/client';
import CourierServices from '@/components/CourierServices';

interface OrderStatusActionsProps {
  orderId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export default function OrderStatusActions({ orderId, currentStatus, onStatusChange }: OrderStatusActionsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  const statuses = [
    { id: OrderStatus.ORDER_RECEIVED, label: 'Received', icon: Package },
    { id: OrderStatus.ORDER_CONFIRMED, label: 'Confirmed', icon: Check },
    { id: OrderStatus.PROCESSING, label: 'Processing', icon: Loader2 },
    { id: OrderStatus.READY_FOR_PICKUP, label: 'Pickup', icon: Truck },
    { id: OrderStatus.IN_TRANSIT, label: 'Transit', icon: Truck },
    { id: OrderStatus.DELIVERED, label: 'Delivered', icon: Check },
    { id: OrderStatus.CANCELLED, label: 'Cancel', icon: RotateCcw },
    { id: OrderStatus.REFUNDED, label: 'Refund', icon: CircleDollarSign },
  ];

  async function updateStatus(newStatus: OrderStatus, sendEmailNotification: boolean = true) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          sendEmail: sendEmailNotification
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      
      setStatus(newStatus);
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
      
      if (sendEmailNotification) {
        toast.success(`Order status updated to ${newStatus} - Email sent to customer`);
      } else {
        toast.success(`Order status updated to ${newStatus}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-black/5 pb-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">Fulfilment Actions</div>
        <CourierServices 
          orderId={orderId} 
          currentStatus={currentStatus} 
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">Order Control</div>
        <button
          onClick={() => updateStatus(OrderStatus.CANCELLED, sendEmail)}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Force Cancel Order'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">Quick Status Switch</div>
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {statuses.map((s) => {
            const Icon = s.icon;
            return (
            <button
              key={s.id}
              onClick={() => updateStatus(s.id, sendEmail)}
              disabled={loading}
              title={s.label}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                status === s.id 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              } disabled:opacity-50 min-w-[60px]`}
            >
              <Icon size={14} />
              {s.label}
            </button>
          )})}
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-black/5 rounded-xl">
        <input
          type="checkbox"
          id="sendEmail"
          checked={sendEmail}
          onChange={(e) => setSendEmail(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black"
        />
        <label htmlFor="sendEmail" className="text-[10px] font-bold text-slate-700 cursor-pointer">
          Send email notification to customer
        </label>
      </div>
      
      {loading && (
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 animate-pulse">
          <Loader2 size={12} className="animate-spin" />
          Updating database...
        </div>
      )}
    </div>
  );
}