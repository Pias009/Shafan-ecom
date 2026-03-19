"use client";

import { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

export function OrderFilter({ currentStatus }: { currentStatus: string }) {
  const router = useRouter();

  return (
    <form className="flex flex-wrap items-center gap-2">
      <label className="text-xs font-bold uppercase tracking-widest text-black/50">Filter Status:</label>
      <select 
        name="status" 
        defaultValue={currentStatus} 
        onChange={(e) => {
          const val = e.target.value;
          router.push(`/ueadmin/orders?status=${val}`);
        }}
        className="border border-black/10 rounded-xl px-4 py-2 text-sm bg-black/5 font-bold focus:ring-2 focus:ring-black outline-none transition-all cursor-pointer appearance-none"
      >
        <option value="ALL">All Orders</option>
        {Object.values(OrderStatus).map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </form>
  );
}
