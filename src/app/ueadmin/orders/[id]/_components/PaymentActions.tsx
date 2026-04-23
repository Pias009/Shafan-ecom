"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, DollarSign } from 'lucide-react';

interface PaymentActionsProps {
  orderId: string;
  currentPaymentStatus: string;
  paymentMethod: string | null;
}

export default function PaymentActions({ orderId, currentPaymentStatus, paymentMethod }: PaymentActionsProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentPaymentStatus);

  const isCOD = paymentMethod?.toLowerCase() === 'cod';
  const isPending = status === 'PENDING' || status === 'UNPAID';

  async function markAsPaid() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentStatus: 'PAID'
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      
      setStatus('PAID');
      toast.success('Payment marked as PAID');
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment status");
    } finally {
      setLoading(true); // Keeping it loading as we usually redirect or refresh
      window.location.reload();
    }
  }

  if (!isCOD || !isPending) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
          <DollarSign size={18} />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-800">Cash on Delivery</div>
          <div className="text-[9px] text-amber-600">Awaiting payment on delivery</div>
        </div>
      </div>
      <button
        onClick={markAsPaid}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full shadow-lg shadow-green-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <DollarSign size={14} />
            Mark Paid
          </>
        )}
      </button>
    </div>
  );
}
