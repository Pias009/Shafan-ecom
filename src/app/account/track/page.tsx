import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findOrderForTracking } from "@/lib/track-order";
import { formatOrderNumber } from "@/lib/order-number";
import { TrackOrderResult } from "@/components/TrackOrderResult";
import { Search, PackageSearch, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_LABEL = (s: string) => s.replace(/_/g, " ");

// Order tracking rendered inside the user dashboard (same layout + sidebar as
// /account/orders). Signed-in customers don't need to type their email.
export default async function AccountTrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; email?: string }>;
}) {
  const session = await getServerAuthSession();
  const sessionEmail = session?.user?.email || "";
  const userId = (session?.user as any)?.id as string | undefined;
  const signedIn = Boolean(sessionEmail);

  const sp = await searchParams;
  const orderNumber = sp?.order?.trim() || "";
  const email = signedIn ? sessionEmail : sp?.email?.trim() || "";
  const hasQuery = Boolean(orderNumber && (signedIn || email));

  const order = hasQuery ? await findOrderForTracking(orderNumber, email, userId) : null;
  const notFound = hasQuery && !order;

  // Quick-pick: the customer's own recent orders
  const recentOrders = signedIn
    ? await prisma.order.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            { email: { equals: sessionEmail, mode: "insensitive" } },
          ],
        },
        select: { id: true, status: true, createdAt: true, total: true, currency: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-black/5 rounded-2xl">
            <PackageSearch className="w-5 h-5 text-black/60" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter">Track Your Order</h1>
            <p className="text-black/40 text-xs md:text-sm font-medium mt-0.5">
              {signedIn
                ? "Pick one of your orders or enter an order number."
                : "Enter your order number and the email you used at checkout."}
            </p>
          </div>
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div className="rounded-3xl border border-black/5 bg-white shadow-sm p-4 md:p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-3">Your recent orders</p>
          <div className="space-y-2">
            {recentOrders.map((o) => {
              const number = formatOrderNumber(o.id);
              const selected = order?.id === o.id;
              return (
                <Link
                  key={o.id}
                  href={`/account/track?order=${encodeURIComponent(o.id.slice(-8).toUpperCase())}`}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                    selected ? "border-black bg-black/[0.03]" : "border-black/5 hover:border-black/20"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black">Order {number}</p>
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
                      {new Date(o.createdAt).toLocaleDateString(undefined, { timeZone: "Asia/Dubai" })} · {STATUS_LABEL(String(o.status))}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-black/30 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <form method="GET" className="rounded-3xl border border-black/5 bg-white shadow-sm p-5 md:p-6 space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">Order Number</label>
          <input
            name="order"
            defaultValue={orderNumber}
            placeholder="e.g. A1B2C3D4"
            required
            className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white"
          />
          <p className="text-[10px] text-black/30 font-medium mt-1">Found on your order confirmation email or receipt.</p>
        </div>
        {!signedIn && (
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">Email Address</label>
            <input
              name="email"
              type="email"
              defaultValue={email}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white"
            />
          </div>
        )}
        <button
          type="submit"
          className="w-full h-12 rounded-full bg-black text-white font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.01] transition"
        >
          <Search size={16} /> Track Order
        </button>
      </form>

      <TrackOrderResult order={order} notFound={notFound} email={email} />
    </div>
  );
}
