"use client";

import { Download } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  orderId: string;
}

export default function InvoiceDownload({ orderId }: Props) {
  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        toast.error("Failed to download invoice");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId.slice(-8)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download invoice");
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="glass-panel-heavy p-6 md:p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-4 hover:bg-black/5 transition-colors cursor-pointer w-full text-left"
    >
      <div className="p-3 bg-black rounded-xl text-white">
        <Download size={18} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-black uppercase tracking-widest text-black">Download Invoice</p>
        <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest">PDF format</p>
      </div>
    </button>
  );
}
