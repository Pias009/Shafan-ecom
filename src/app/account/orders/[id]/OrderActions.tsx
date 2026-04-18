"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, RotateCcw, AlertCircle, Info } from "lucide-react";
import toast from "react-hot-toast";

interface OrderActionsProps {
  orderId: string;
  status: string;
  createdAt: string;
  cancelRequest?: boolean;
  returnRequest?: boolean;
  returnStatus?: string;
}

export default function OrderActions({ 
  orderId, 
  status, 
  createdAt, 
  cancelRequest, 
  returnRequest, 
  returnStatus 
}: OrderActionsProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState<"CANCEL" | "RETURN" | null>(null);
  const router = useRouter();

  const orderDate = new Date(createdAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - orderDate.getTime()) / (1000 * 60);
  const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
  
  const isCancelled = status.toUpperCase() === "CANCELLED";
  const isDelivered = status.toUpperCase() === "DELIVERED";
  
  const canCancel = !isCancelled && !isDelivered && status.toUpperCase() !== "REFUNDED";
  const canReturn = isDelivered && diffDays <= 7 && returnStatus === "NONE";

  async function handleAction(action: "CANCEL" | "RETURN") {
    if (!reason && action === "RETURN") {
      toast.error("Please provide a reason for return");
      return;
    }

    setLoading(true);
    const tid = toast.loading(`${action === "CANCEL" ? "Processing cancellation" : "Processing return"}...`);

    try {
      // Get guest email from localStorage if available
      const guestEmail = localStorage.getItem('guest_email');

      const res = await fetch(`/api/account/orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason, guestEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Request sent successfully", { id: tid });
        setShowReasonInput(null);
        setReason("");
        router.refresh(); 
      } else {
        toast.error(data.error || "Action failed", { id: tid });
      }
    } catch {
      toast.error("An unexpected error occurred", { id: tid });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pt-8 border-t border-black/5">
      {/* Request Status Info */}
      {cancelRequest && (
        <div className="glass-panel rounded-2xl p-4 bg-amber-50 border-amber-500/20 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">
            Cancellation Request Pending Admin Review
          </p>
        </div>
      )}

      {returnRequest && (
        <div className="glass-panel rounded-2xl p-4 bg-blue-50 border-blue-500/20 flex items-start gap-3">
          <RotateCcw className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-800 mb-1">
              Return Request: {returnStatus}
            </p>
            {returnStatus === 'APPROVED' && (
              <p className="text-[10px] font-medium text-blue-700 normal-case tracking-normal">
                Your return request has been granted! Our team will contact you soon for the collection.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        {canCancel && !cancelRequest && (
          <div className="flex-1 min-w-[280px] space-y-4">
            {diffMinutes <= 30 ? (
              <div className="glass-panel rounded-2xl p-4 bg-green-50/50 border-green-500/10 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-green-800 uppercase tracking-widest leading-relaxed">
                  Fast Cancel Available! Your order is under 30 minutes old and can be auto-approved.
                </p>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-4 bg-black/5 border-black/5 flex items-start gap-3">
                <Info className="w-4 h-4 text-black/40 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest leading-relaxed">
                  Orders over 30 minutes require manual approval for cancellation.
                </p>
              </div>
            )}
            
            {showReasonInput === "CANCEL" ? (
              <div className="space-y-3">
                <textarea 
                  placeholder="Reason for cancellation (optional)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-black/5 rounded-2xl p-4 text-xs font-medium outline-none border border-black/5 focus:border-black/20 h-24"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction("CANCEL")}
                    disabled={loading}
                    className="flex-1 bg-black text-white rounded-full py-3 text-[10px] font-black uppercase tracking-widest transition active:scale-95"
                  >
                    Confirm Cancellation
                  </button>
                  <button
                    onClick={() => setShowReasonInput(null)}
                    className="px-6 bg-black/5 text-black rounded-full py-3 text-[10px] font-black uppercase tracking-widest"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowReasonInput("CANCEL")}
                className="w-full flex items-center justify-center gap-2 bg-red-500 text-white rounded-full py-4 text-xs font-black uppercase tracking-[0.2em] transition hover:bg-red-600 active:scale-95 shadow-xl shadow-red-500/20"
              >
                <XCircle className="w-4 h-4" />
                Cancel Order
              </button>
            )}
          </div>
        )}

        {canReturn && (
          <div className="flex-1 min-w-[280px]">
             {showReasonInput === "RETURN" ? (
              <div className="space-y-3">
                <textarea 
                  placeholder="Reason for return (required)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-black/5 rounded-2xl p-4 text-xs font-medium outline-none border border-black/5 focus:border-black/20 h-24"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction("RETURN")}
                    disabled={loading}
                    className="flex-1 bg-black text-white rounded-full py-3 text-[10px] font-black uppercase tracking-widest transition active:scale-95"
                  >
                    Submit Return Request
                  </button>
                  <button
                    onClick={() => setShowReasonInput(null)}
                    className="px-6 bg-black/5 text-black rounded-full py-3 text-[10px] font-black uppercase tracking-widest"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowReasonInput("RETURN")}
                className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-full py-4 text-xs font-black uppercase tracking-[0.2em] transition hover:bg-black/80 active:scale-95 shadow-xl shadow-black/20"
              >
                <RotateCcw className="w-4 h-4" />
                Request Return
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


