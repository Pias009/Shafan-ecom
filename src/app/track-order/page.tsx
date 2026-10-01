import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatOrderNumber } from "@/lib/order-number";
import { Search, PackageSearch, MapPin, Truck, CheckCircle2, User } from "lucide-react";

export const dynamic = "force-dynamic";

function formatPrice(amount: number, currency?: string): string {
  const code = currency?.toUpperCase() || "AED";
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  return `${code} ${(Number(amount) || 0).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

const STATUS_STEPS = [
  { key: "ORDER_RECEIVED", label: "Order Received" },
  { key: "ORDER_CONFIRMED", label: "Confirmed" },
  { key: "PROCESSING", label: "Processing" },
  { key: "IN_TRANSIT", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
];

const STATUS_COLORS: Record<string, string> = {
  ORDER_RECEIVED: "bg-amber-100 text-amber-800 border-amber-200",
  ORDER_CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
  READY_FOR_PICKUP: "bg-purple-100 text-purple-800 border-purple-200",
  ORDER_PICKED_UP: "bg-indigo-100 text-indigo-800 border-indigo-200",
  IN_TRANSIT: "bg-cyan-100 text-cyan-800 border-cyan-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  REFUNDED: "bg-orange-100 text-orange-800 border-orange-200",
};

function currentStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  if (idx >= 0) return idx;
  // READY_FOR_PICKUP / ORDER_PICKED_UP count as "shipped" on the simplified timeline
  if (status === "READY_FOR_PICKUP" || status === "ORDER_PICKED_UP") return 3;
  return 0;
}

async function findOrder(orderNumberRaw: string, emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const cleaned = orderNumberRaw.trim().replace(/^#/, "");

  if (!email || !cleaned) return null;

  // A full Mongo ObjectId was pasted (e.g. copied from a link/invoice).
  if (/^[0-9a-fA-F]{24}$/.test(cleaned)) {
    const order = await prisma.order.findUnique({
      where: { id: cleaned.toLowerCase() },
      include: { items: true, shipment: true, user: { select: { email: true } } },
    });
    if (!order) return null;
    const orderEmail = order.email?.toLowerCase() || order.user?.email?.toLowerCase();
    return orderEmail === email ? order : null;
  }

  // Short order number (last 8 chars, as shown on receipts/emails) — find by
  // email first (a real field), then match the derived order number in JS.
  const candidates = await prisma.order.findMany({
    where: {
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        { user: { email: { equals: email, mode: "insensitive" } } },
      ],
    },
    include: { items: true, shipment: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const target = cleaned.toUpperCase();
  return candidates.find((o) => o.id.slice(-8).toUpperCase() === target) || null;
}

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; email?: string }>;
}) {
  const sp = await searchParams;
  const orderNumber = sp?.order?.trim() || "";
  const email = sp?.email?.trim() || "";
  const hasQuery = !!(orderNumber && email);

  const order = hasQuery ? await findOrder(orderNumber, email) : null;
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

      {notFound && (
        <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="font-bold text-red-700 text-sm">
            We couldn&apos;t find an order matching those details.
          </p>
          <p className="text-red-500/70 text-xs font-medium mt-1">
            Double-check your order number and email, or{" "}
            <Link href="/contact" className="underline font-bold">contact us</Link> for help.
          </p>
        </div>
      )}

      {order && (
        <div className="mt-8 space-y-6">
          {/* Header */}
          <div className="rounded-3xl border border-black/5 bg-white shadow-sm p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                Order {formatOrderNumber(order.id)}
              </h2>
              <span
                className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
                  STATUS_COLORS[order.status] || "bg-black/5 text-black/40 border-black/5"
                }`}
              >
                {String(order.status).replace(/_/g, " ")}
              </span>
            </div>

            {order.status !== "CANCELLED" && order.status !== "REFUNDED" ? (
              <div className="flex items-center justify-between mb-2">
                {STATUS_STEPS.map((step, i) => {
                  const current = currentStepIndex(order.status);
                  const done = i <= current;
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {i > 0 && (
                        <div
                          className={`absolute top-3 right-1/2 w-full h-0.5 -z-0 ${
                            i <= current ? "bg-black" : "bg-black/10"
                          }`}
                        />
                      )}
                      <div
                        className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                          done ? "bg-black border-black" : "bg-white border-black/15"
                        }`}
                      >
                        {done && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <span
                        className={`text-[8px] font-black uppercase tracking-wider mt-2 text-center ${
                          done ? "text-black" : "text-black/30"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs font-bold text-black/40">
                This order was {order.status === "CANCELLED" ? "cancelled" : "refunded"}.
              </p>
            )}

            <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest mt-6">
              Placed{" "}
              {new Date(order.createdAt).toLocaleDateString(undefined, {
                timeZone: "Asia/Dubai",
              })}
            </p>
          </div>

          {/* Delivery info */}
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 pb-4 mb-4">
              <div className="p-2 bg-black/5 rounded-xl">
                <Truck size={16} className="text-black/40" />
              </div>
              <h3 className="font-black uppercase tracking-widest text-xs">Delivery</h3>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="font-bold text-black/40">Courier</span>
                <span className="font-bold">{order.shipment?.courier || "Standard"}</span>
              </div>
              {order.shipment?.trackingCode && (
                <div className="flex justify-between">
                  <span className="font-bold text-black/40">Waybill</span>
                  <span className="font-bold font-mono text-[10px]">
                    {order.shipment.trackingCode}
                  </span>
                </div>
              )}
              {order.shipment?.trackingUrl && (
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-[10px] font-black uppercase tracking-widest text-black underline hover:text-black/60"
                >
                  Track with Courier →
                </a>
              )}
              {(order.shippingAddress as any)?.city_name || (order.shippingAddress as any)?.city ? (
                <div className="flex items-center gap-2 pt-2 mt-2 border-t border-black/5 text-black/50">
                  <MapPin size={12} />
                  <span className="font-bold">
                    {(order.shippingAddress as any)?.city_name || (order.shippingAddress as any)?.city}
                    {(order.shippingAddress as any)?.country ? `, ${(order.shippingAddress as any).country}` : ""}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Items */}
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h3 className="font-black uppercase tracking-widest text-xs border-b border-black/5 pb-4 mb-4">
              Items ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((it: any) => (
                <div key={it.id} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="font-bold truncate">{it.nameSnapshot || "Product"}</span>
                  <span className="font-bold text-black/40 shrink-0">
                    x{it.quantity} · {formatPrice(Number(it.unitPrice) * it.quantity, order.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-black/5">
              <span className="text-xs font-black uppercase tracking-widest">Total</span>
              <span className="text-lg font-black">{formatPrice(order.total || 0, order.currency)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-black/30 font-bold pt-2">
            <User size={12} />
            Want your full order history?{" "}
            <Link
              href={`/account/orders?email=${encodeURIComponent(email)}`}
              className="text-black underline"
            >
              View My Orders
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
