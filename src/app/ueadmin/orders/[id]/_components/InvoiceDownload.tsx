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
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownload}
        disabled={loading}
        title="Download Invoice PDF"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 bg-white shadow-sm hover:bg-black/5 transition-colors disabled:opacity-50 text-slate-800"
      >
        <Download size={15} />
        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Invoice</span>
      </button>

      <button
        onClick={handlePrint}
        disabled={loading}
        title="Print Invoice"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50 text-blue-700"
      >
        <Printer size={15} />
        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Print</span>
      </button>
    </div>
  );
}