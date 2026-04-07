"use client";

import { Download, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

interface Props {
  orderId: string;
}

export default function InvoiceDownload({ orderId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        let errorData: { error?: string } = {};
        try {
          errorData = await res.json() as { error?: string };
        } catch {
          errorData = { error: "Failed to parse error response" };
        }
        console.error('Invoice download error:', res.status, errorData);
        toast.error(errorData.error || `Failed to download invoice (${res.status})`);
        return;
      }

      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download invoice");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed" }));
        toast.error(errorData.error || `Failed to generate invoice (${res.status})`);
        return;
      }

      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab for printing
      window.open(url, '_blank');
      toast.success("Invoice opened for printing");
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="glass-panel-heavy p-6 md:p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-4 hover:bg-black/5 transition-colors cursor-pointer w-full text-left disabled:opacity-50"
      >
        <div className="p-3 bg-black rounded-xl text-white">
          <Download size={18} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-900">Download Invoice</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">PDF format</p>
        </div>
      </button>

      <button
        onClick={handlePrint}
        disabled={loading}
        className="glass-panel-heavy p-6 md:p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-4 hover:bg-black/5 transition-colors cursor-pointer w-full text-left disabled:opacity-50"
      >
        <div className="p-3 bg-blue-600 rounded-xl text-white">
          <Printer size={18} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-slate-900">Print Invoice</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Quick print</p>
        </div>
      </button>
    </div>
  );
}