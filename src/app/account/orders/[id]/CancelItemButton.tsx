"use client";

import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function CancelItemButton({
  orderId,
  itemId,
  itemName,
  guestEmail,
  disabled,
}: {
  orderId: string;
  itemId: string;
  itemName: string;
  guestEmail?: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  if (done) {
    return (
      <span className="text-[9px] font-black uppercase tracking-widest text-red-400">
        Cancelled
      </span>
    );
  }

  const handleCancel = async () => {
    if (!confirm(`Cancel "${itemName}" from this order?`)) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (guestEmail) params.set("email", guestEmail);
      const qs = params.toString();
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}/cancel${qs ? `?${qs}` : ""}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${itemName} cancelled`);
        setDone(true);
        if (data.allCancelled) {
          router.refresh();
        } else {
          router.refresh();
        }
      } else {
        toast.error(data.error || "Failed to cancel item");
      }
    } catch {
      toast.error("Failed to cancel item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading || disabled}
      className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition disabled:opacity-40"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <XCircle className="w-3 h-3" />
      )}
      {loading ? "Cancelling..." : "Cancel"}
    </button>
  );
}
