"use client";

import { useState } from 'react';
import { RotateCcw, X, Loader2, DollarSign, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface TamaraRefundActionProps {
  orderId: string;
  tamaraCheckoutId: string;
  orderTotal: number;
  currency: string;
}

export default function TamaraRefundAction({ 
  orderId, 
  tamaraCheckoutId, 
  orderTotal, 
  currency 
}: TamaraRefundActionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(orderTotal.toString());
  const [comment, setComment] = useState("Refund requested via admin dashboard");

  const handleRefund = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (Number(amount) > orderTotal) {
      toast.error("Refund amount cannot exceed order total");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/tamara/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: Number(amount),
          currency,
          comment
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process refund");
      }

      toast.success('Refund processed successfully via Tamara');
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error("Refund error:", err);
      toast.error(err.message || "Something went wrong during refund");
    } finally {
      setLoading(false);
    }
  };

  if (!tamaraCheckoutId) return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full hover:bg-orange-700 hover:scale-105 transition active:scale-95 shadow-xl shadow-orange-200"
      >
        <RotateCcw size={14} /> Refund (Tamara)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-black/5 p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-black">Tamara Refund</h2>
                <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mt-1">Order #{orderId.slice(-8).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-2 ml-2 flex items-center gap-2">
                  <DollarSign size={10} /> Refund Amount ({currency})
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/[0.03] border-none rounded-2xl px-5 py-4 text-lg font-black focus:ring-2 focus:ring-orange-500 outline-none transition"
                />
                <p className="text-[9px] font-bold text-black/30 mt-2 ml-2 uppercase">Max: {currency} {orderTotal.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-2 ml-2 flex items-center gap-2">
                  <MessageSquare size={10} /> Reason / Comment
                </label>
                <textarea 
                  rows={3}
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-black/[0.03] border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition resize-none"
                  placeholder="Reason for refund..."
                />
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-4 text-xs font-black uppercase tracking-widest text-black/40 hover:text-black transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleRefund}
                disabled={loading}
                className="flex-[2] flex items-center justify-center gap-2 bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-full hover:scale-105 transition active:scale-95 shadow-2xl shadow-black/20 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>Process Refund</>
                )}
              </button>
            </div>
            
            <p className="text-center text-[9px] font-bold text-black/20 uppercase tracking-widest mt-6">
              This will immediately notify Tamara to process the refund.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
