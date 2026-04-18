"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RequestAlertsProps {
  orderId: string;
  cancelRequest: boolean;
  cancelReason?: string;
  returnRequest: boolean;
  returnReason?: string;
  returnStatus: string;
}

export default function RequestAlerts({ 
  orderId, 
  cancelRequest, 
  cancelReason, 
  returnRequest, 
  returnReason, 
  returnStatus 
}: RequestAlertsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAction(action: string) {
    setLoading(true);
    const tid = toast.loading("Processing request...");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process request");
      }
      
      toast.success("Request processed successfully", { id: tid });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message, { id: tid });
    } finally {
      setLoading(false);
    }
  }

  if (!cancelRequest && !returnRequest) return null;

  return (
    <div className="space-y-4 mb-8">
      {cancelRequest && (
        <div className="glass-panel-heavy p-6 rounded-[2rem] border-2 border-red-500/20 bg-red-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-red-500/5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500 rounded-2xl text-white shadow-lg shadow-red-200">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-red-900 uppercase tracking-widest">Cancellation Request</h3>
              <p className="text-[10px] font-bold text-red-700/60 mt-1 uppercase tracking-widest">Manual approval required (order &gt; 30 mins)</p>
              {cancelReason && (
                <div className="mt-3 p-3 bg-white/50 rounded-xl border border-red-500/10 italic text-xs text-red-800">
                  "{cancelReason}"
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleAction('APPROVE_CANCEL')}
              disabled={loading}
              className="px-6 py-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-red-600 transition shadow-lg shadow-red-200 disabled:opacity-50"
            >
              Approve & Cancel
            </button>
            <button 
              onClick={() => handleAction('REJECT_CANCEL')}
              disabled={loading}
              className="px-6 py-3 bg-white text-red-500 border border-red-200 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-red-50 transition disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {returnRequest && (
        <div className="glass-panel-heavy p-6 rounded-[2rem] border-2 border-blue-500/20 bg-blue-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-blue-500/5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-200">
              <RotateCcw size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">Return Request</h3>
              <p className="text-[10px] font-bold text-blue-700/60 mt-1 uppercase tracking-widest">Status: {returnStatus}</p>
              {returnReason && (
                <div className="mt-3 p-3 bg-white/50 rounded-xl border border-blue-500/10 italic text-xs text-blue-800">
                  "{returnReason}"
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {returnStatus === 'PENDING' && (
              <>
                <button 
                  onClick={() => handleAction('APPROVE_RETURN')}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-600 transition shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  Approve Return
                </button>
                <button 
                  onClick={() => handleAction('REJECT_RETURN')}
                  disabled={loading}
                  className="px-6 py-3 bg-white text-blue-500 border border-blue-200 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-50 transition disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
            {returnStatus === 'APPROVED' && (
              <button 
                onClick={() => handleAction('COMPLETE_RETURN')}
                disabled={loading}
                className="px-6 py-3 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-green-600 transition shadow-lg shadow-green-200 disabled:opacity-50"
              >
                Complete Return & Refund
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
