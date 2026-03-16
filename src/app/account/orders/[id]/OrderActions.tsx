"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface OrderActionsProps {
  orderId: string;
  status: string;
  createdAt: string;
}

export default function OrderActions({ orderId, status, createdAt }: OrderActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const orderDate = new Date(createdAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - orderDate.getTime()) / (1000 * 60);
  
  const canCancel = diffMinutes <= 30 && !["completed", "cancelled", "refunded"].includes(status.toLowerCase());
  const canRefund = status.toLowerCase() === "completed";

  async function handleAction(action: "CANCEL" | "REFUND") {
    const confirmMessage = action === "CANCEL" 
      ? "Are you sure you want to cancel this order? This action cannot be undone."
      : "Are you sure you want to request a refund? Our team will review your request.";
    
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    const tid = toast.loading(`${action === "CANCEL" ? "Cancelling" : "Processing"} order...`);

    try {
      const res = await fetch(`/api/account/orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Order ${action === "CANCEL" ? "Cancelled" : "Refund Requested"} Successfully`, { id: tid });
        router.refresh(); // Refresh server component data
      } else {
        toast.error(data.error || "Action failed", { id: tid });
      }
    } catch (err) {
      toast.error("An unexpected error occurred", { id: tid });
    } finally {
      setLoading(false);
    }
  }

  if (!canCancel && !canRefund) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 pt-8 border-t border-black/5">
      {canCancel && (
        <div className="flex-1 min-w-[280px] space-y-4">
          <div className="glass-panel rounded-2xl p-4 bg-red-50/50 border-red-500/10 flex items-start gap-3">
             <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
             <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest leading-relaxed">
               Cancellations are only available within 30 minutes of purchase. 
               Remaining time: {Math.max(0, Math.ceil(30 - diffMinutes))} minutes.
             </p>
          </div>
          <button
            onClick={() => handleAction("CANCEL")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-red-500 text-white rounded-full py-4 text-xs font-black uppercase tracking-[0.2em] transition hover:bg-red-600 active:scale-95 disabled:opacity-50 shadow-xl shadow-red-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Cancel Order
          </button>
        </div>
      )}

      {canRefund && (
        <div className="flex-1 min-w-[280px]">
          <button
            onClick={() => handleAction("REFUND")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-full py-4 text-xs font-black uppercase tracking-[0.2em] transition hover:bg-black/80 active:scale-95 disabled:opacity-50 shadow-xl shadow-black/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Request Refund
          </button>
        </div>
      )}
    </div>
  );
}
