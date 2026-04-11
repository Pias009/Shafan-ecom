"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { PaymentStatus } from '@prisma/client';

interface PaymentStatusEditorProps {
  orderId: string;
  currentPaymentStatus: string;
}

const PAYMENT_STATUSES = [
  { value: PaymentStatus.PAID, label: 'Paid', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: PaymentStatus.PENDING, label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: PaymentStatus.CANCELLED, label: 'Cancelled', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

export default function PaymentStatusEditor({ orderId, currentPaymentStatus }: PaymentStatusEditorProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentPaymentStatus);
  const [isOpen, setIsOpen] = useState(false);

  const currentStatusData = PAYMENT_STATUSES.find(s => s.value === status) || PAYMENT_STATUSES[1];

  async function handleStatusChange(newStatus: string) {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to update (${res.status})`);
      }

      // Update UI immediately without reload
      setStatus(newStatus);
      setIsOpen(false);
      toast.success(`Payment status updated to ${newStatus}`);
    } catch (err: any) {
      console.error('Payment status update error:', err);
      toast.error(err.message || 'Failed to update payment status');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all hover:scale-105 ${currentStatusData.color}`}
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          currentStatusData.label
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-xl border-2 border-black/10 shadow-xl overflow-hidden min-w-[140px]">
          {PAYMENT_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              disabled={loading}
              className={`w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-black/5 ${
                s.value === status ? 'bg-black/5 text-black' : 'text-slate-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}