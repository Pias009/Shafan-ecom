import Link from "next/link";
import { formatOrderNumber } from "@/lib/order-number";
import { formatReadyBy, getPickupDetails } from "@/lib/pickup";
import { MapPin, Truck, CheckCircle2, User, Store } from "lucide-react";

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

export function TrackOrderResult({
  order,
  notFound,
  email,
}: {
  order: any | null;
  notFound: boolean;
  email?: string;
}) {
  const pickup = order ? getPickupDetails(order) : null;
  return (
    <>
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
                <span className="font-bold text-black/40">{pickup ? "Method" : "Courier"}</span>
                <span className="font-bold">{pickup ? "Store Pickup" : order.shipment?.courier || "Standard"}</span>
              </div>
              {pickup && (
                <div className="flex items-start gap-2 pt-2 mt-2 border-t border-black/5 text-black/60">
                  <Store size={12} className="mt-0.5 shrink-0" />
                  <span className="font-bold">
                    {pickup.name} — {[pickup.address, pickup.city].filter(Boolean).join(", ")}
                    <span className="block text-blue-700">Ready from {formatReadyBy(pickup.readyBy)}</span>
                  </span>
                </div>
              )}
              {!pickup && order.shipment?.trackingCode && (
                <div className="flex justify-between">
                  <span className="font-bold text-black/40">Waybill</span>
                  <span className="font-bold font-mono text-[10px]">
                    {order.shipment.trackingCode}
                  </span>
                </div>
              )}
              {!pickup && order.shipment?.trackingUrl && (
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-[10px] font-black uppercase tracking-widest text-black underline hover:text-black/60"
                >
                  Track with Courier →
                </a>
              )}
              {!pickup && ((order.shippingAddress as any)?.city_name || (order.shippingAddress as any)?.city) ? (
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
              href={email ? `/account/orders?email=${encodeURIComponent(email)}` : "/account/orders"}
              className="text-black underline"
            >
              View My Orders
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
