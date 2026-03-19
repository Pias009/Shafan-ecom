"use client";

import { useState } from "react";
import { Edit2, Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export function StockUpdateBtn({ inventoryId, currentQty }: { inventoryId: string, currentQty: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [qty, setQty] = useState(currentQty);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/${inventoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });

      if (res.ok) {
        toast.success("Stock updated!");
        setIsEditing(false);
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <input 
          type="number" 
          value={qty} 
          onChange={(e) => setQty(parseInt(e.target.value))}
          className="w-16 h-8 bg-black/5 border-none rounded-lg text-center font-black text-xs"
          autoFocus
        />
        <button 
          onClick={handleUpdate}
          disabled={loading}
          className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        </button>
        <button 
          onClick={() => { setIsEditing(false); setQty(currentQty); }}
          className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => setIsEditing(true)}
      className="p-2 hover:bg-black/5 rounded-xl transition-colors text-black/20 hover:text-black"
    >
      <Edit2 size={14} />
    </button>
  );
}
