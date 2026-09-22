"use client";

import { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function OrderFilter({ currentStatus, currentQuery }: { currentStatus: string; currentQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(currentQuery || "");

  const navigate = (status: string, query: string) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.set("status", status);
    const trimmed = query.trim().replace(/^#+/, "");
    if (trimmed) params.set("q", trimmed);
    const qs = params.toString();
    router.push(`/ueadmin/orders${qs ? `?${qs}` : ""}`);
  };

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(currentStatus, q);
      }}
    >
      <label className="text-xs font-bold uppercase tracking-widest text-black/50">Filter Status:</label>
      <select
        name="status"
        value={currentStatus}
        onChange={(e) => navigate(e.target.value, currentQuery || "")}
        className="border border-black/10 rounded-xl px-4 py-2 text-sm bg-black/5 font-bold focus:ring-2 focus:ring-black outline-none transition-all cursor-pointer appearance-none"
      >
        <option value="ALL">All Orders</option>
        {Object.values(OrderStatus).map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by order number..."
          className="border border-black/10 rounded-xl px-4 py-2 text-sm bg-black/5 font-bold focus:ring-2 focus:ring-black outline-none transition-all w-56 md:w-60"
        />
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition shadow-lg shadow-black/10 flex items-center gap-1.5"
        >
          <Search size={14} /> Search
        </button>
        {currentQuery && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              navigate(currentStatus, "");
            }}
            className="text-[10px] font-bold uppercase tracking-widest text-black/50 hover:text-black border border-black/10 rounded-xl px-3 py-2 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
