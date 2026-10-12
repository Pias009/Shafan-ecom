import { findOrderForTracking } from "@/lib/track-order";
import { TrackOrderResult } from "@/components/TrackOrderResult";
import { Search, PackageSearch } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; email?: string }>;
}) {
  const sp = await searchParams;
  const orderNumber = sp?.order?.trim() || "";
  const email = sp?.email?.trim() || "";
  const hasQuery = !!(orderNumber && email);

  const order = hasQuery ? await findOrderForTracking(orderNumber, email) : null;
  const notFound = hasQuery && !order;

  return (
    <div className="max-w-2xl mx-auto py-12 md:py-20 px-4 md:px-6">
      <div className="text-center mb-10">
        <div className="inline-flex p-4 bg-black/5 rounded-full mb-4">
          <PackageSearch className="w-7 h-7 text-black/60" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter">Track Your Order</h1>
        <p className="text-black/40 text-sm font-medium mt-2">
          Enter your order number and the email you used at checkout.
        </p>
      </div>

      <form
        method="GET"
        className="rounded-3xl border border-black/5 bg-white shadow-sm p-6 md:p-8 space-y-4"
      >
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">
            Order Number
          </label>
          <input
            name="order"
            defaultValue={orderNumber}
            placeholder="e.g. A1B2C3D4"
            required
            className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white"
          />
          <p className="text-[10px] text-black/30 font-medium mt-1">
            Found on your order confirmation email or receipt.
          </p>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">
            Email Address
          </label>
          <input
            name="email"
            type="email"
            defaultValue={email}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white"
          />
        </div>
        <button
          type="submit"
          className="w-full h-14 rounded-full bg-black text-white font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.01] transition"
        >
          <Search size={16} /> Track Order
        </button>
      </form>

      <TrackOrderResult order={order} notFound={notFound} email={email} />
    </div>
  );
}
