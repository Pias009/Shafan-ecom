import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, User, MapPin, CheckCircle2, ShoppingBag, Truck } from "lucide-react";
import OrderActions from "./OrderActions";
import OrderStatusBadge from "./OrderStatusBadge";
import CancelItemButton from "./CancelItemButton";
import ScrollToProduct from "./ScrollToProduct";

function formatPrice(amount: number, currency?: string): string {
  const code = currency?.toUpperCase() || "AED";
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  return `${code} ${(Number(amount) || 0).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function statusBadgeClass(status: string): string {
  const s = status?.toUpperCase() || "";
  if (s === "DELIVERED") return "bg-green-100 text-green-800 border-green-200";
  if (s === "SHIPPED" || s === "IN_TRANSIT") return "bg-green-100 text-green-800 border-green-200";
  if (s === "PROCESSING" || s === "ORDER_CONFIRMED") return "bg-blue-100 text-blue-800 border-blue-200";
  if (s === "ORDER_RECEIVED") return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "CANCELLED") return "bg-red-100 text-red-800 border-red-200";
  if (s === "REFUNDED") return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-black/5 text-black/40 border-black/5";
}

function getItemImage(item: any): string | null {
  return item.imageSnapshot || item.product?.mainImage || item.product?.images?.[0] || null;
}

export const dynamic = 'force-dynamic';

export default async function UserOrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ email?: string; product?: string }> }) {
  const session = await getServerAuthSession();
  const sp = await searchParams;
  const guestEmail = sp?.email;
  const focusItemId = sp?.product;
  const userEmail = session?.user?.email || guestEmail;

  if (!userEmail) return redirect("/?login=true");

  const { id } = await params;
  let order;

  try {
    const data = await (prisma as any).order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, slug: true, mainImage: true, images: true }
            }
          }
        },
        user: true,
      }
    });
    
    if (!data) throw new Error("Not found");

    const orderEmail = data.email?.toLowerCase() || data.user?.email?.toLowerCase();
    if (orderEmail !== userEmail.toLowerCase()) {
      return (
        <div className="pt-20 text-center">
          <h2 className="text-xl font-bold">Unauthorized Access</h2>
          <p className="text-black/40 mt-2">You do not have permission to view this order.</p>
          <Link href={guestEmail ? `/account/orders?email=${encodeURIComponent(guestEmail)}` : `/account/orders`} className="text-black underline mt-4 inline-block font-bold">Back to My Orders</Link>
        </div>
      );
    }
    order = data as any;
  } catch (error) {
    return (
      <div className="pt-20 text-center">
        <h2 className="text-xl font-bold">Order Not Found</h2>
        <Link href={guestEmail ? `/account/orders?email=${encodeURIComponent(guestEmail)}` : `/account/orders`} className="text-black underline mt-4 inline-block font-bold">Back to My Orders</Link>
      </div>
    );
  }

  const billing = order.billingAddress || {};
  const shipping = order.shippingAddress || {};
  const adminAddedItems = (order.items || []).filter((it: any) => it.adminAddedAt);
  const shipment = order.shipment || {};
  const totalPaid = order.items
    .filter((it: any) => !it.cancelledAt)
    .reduce((sum: number, it: any) => sum + (Number(it.unitPrice) * it.quantity), 0);

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-16 px-4 md:px-6 space-y-8 md:space-y-12">
      <ScrollToProduct itemId={focusItemId} />
      <Link href={guestEmail ? `/account/orders?email=${encodeURIComponent(guestEmail)}` : `/account/orders`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition">
        <ArrowLeft size={14} /> Back to My Orders
      </Link>

      {/* Header: Receipt ID, Status, Date, Total */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 border-b border-black/5 pb-8 md:pb-10">
        <div className="text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter">Receipt #{order.id.substring(0, 8)}</h1>
            <OrderStatusBadge orderId={order.id} initialStatus={order.status} />
          </div>
          <p className="text-[10px] md:text-xs font-bold text-black/30 uppercase tracking-widest">
            {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
            <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
              order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 border-green-200' :
              order.paymentStatus === 'CANCELLED' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-amber-100 text-amber-800 border-amber-200'
            }`}>
              Payment: {order.paymentStatus || 'PENDING'}
            </span>
            <span className="text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border bg-blue-100 text-blue-800 border-blue-200">
              {order.paymentMethod || order.paymentMethodTitle || "N/A"}
            </span>
          </div>
        </div>
        <div className="text-center md:text-right bg-black/5 p-6 rounded-3xl md:bg-transparent md:p-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-1">Total Paid</div>
          <div className="text-4xl md:text-5xl font-black">{formatPrice(order.total || 0, order.currency)}</div>
        </div>
      </div>

      {/* Address & Delivery Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-black/5 pb-4 mb-4">
            <div className="p-2 bg-black/5 rounded-xl"><MapPin size={16} className="text-black/40" /></div>
            <h3 className="font-black uppercase tracking-widest text-xs">Delivery Address</h3>
          </div>
          <div className="text-[11px] font-bold text-black/60 leading-relaxed">
            <div>{shipping.first_name} {shipping.last_name}</div>
            <div>{shipping.street_road || shipping.address_1 || ""}</div>
            {(shipping.house_building || shipping.address_2) && <div className="text-black/40">{shipping.house_building || shipping.address_2}</div>}
            {shipping.area_name && <div className="text-black/40">{shipping.area_name}</div>}
            <div>{shipping.city_name || shipping.city || ""}{shipping.country ? `, ${shipping.country}` : ""}</div>
            {shipping.phone && <div className="mt-2 text-black/40 text-[10px]">Phone: {shipping.phone}</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-black/5 pb-4 mb-4">
            <div className="p-2 bg-black/5 rounded-xl"><Truck size={16} className="text-black/40" /></div>
            <h3 className="font-black uppercase tracking-widest text-xs">Delivery &amp; Payment</h3>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="font-bold text-black/40">Courier</span>
              <span className="font-bold">{shipment.courier || "Standard"}</span>
            </div>
            {shipment.trackingCode && (
              <div className="flex justify-between">
                <span className="font-bold text-black/40">Waybill</span>
                <span className="font-bold font-mono text-[10px]">{shipment.trackingCode}</span>
              </div>
            )}
            {shipment.trackingUrl && (
              <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-[10px] font-black uppercase tracking-widest text-black underline hover:text-black/60">
                Track Package →
              </a>
            )}
            <div className="border-t border-black/5 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-black/40">Payment</span>
                <span className="font-bold">{order.paymentMethodTitle || order.paymentMethod || "N/A"}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-bold text-black/40">Status</span>
                <span className={`font-black uppercase tracking-widest text-[9px] ${order.paymentStatus === "PAID" ? "text-green-600" : "text-amber-600"}`}>
                  {order.paymentStatus || "PENDING"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Customer info bar */}
      {billing.first_name && (
        <div className="flex items-center gap-2 text-[10px] font-bold text-black/40">
          <User size={12} />
          {billing.first_name} {billing.last_name} &mdash; {billing.email || ""}
        </div>
      )}

      {/* Purchased Items — each product is its own mini-receipt */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-black/5 pb-4">
          <div className="p-2 bg-black/5 rounded-xl"><ShoppingBag size={16} className="text-black/40" /></div>
          <h3 className="font-black uppercase tracking-widest text-xs">Purchased Items</h3>
        </div>

        <div className="space-y-4">
          {order.items.map((it: any) => {
            const imgSrc = getItemImage(it);
            const isFocused = focusItemId === it.id;
            const isCancelled = it.cancelledAt;
            const lineTotal = Number(it.unitPrice) * it.quantity;
            return (
              <div
                key={it.id}
                id={`item-${it.id}`}
                className={`rounded-2xl border-2 overflow-hidden transition ${
                  isFocused
                    ? "border-black shadow-lg ring-2 ring-black/10"
                    : isCancelled
                    ? "border-red-100 opacity-60"
                    : "border-black/10 shadow-sm"
                }`}
              >
                {/* Card header: product name + status */}
                <div className={`flex items-center justify-between px-5 py-3 ${isCancelled ? "bg-red-50" : "bg-black/[0.03]"}`}>
                  <Link
                    href={`/products/${it.product?.slug || it.productId}`}
                    className="text-sm md:text-base font-black text-black hover:underline truncate mr-3"
                  >
                    {it.name || it.product?.name || "Unknown Product"}
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {it.adminAddedAt && (
                      <span className="text-[7px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Store</span>
                    )}
                    {isCancelled ? (
                      <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-100 px-2.5 py-0.5 rounded-full">Cancelled</span>
                    ) : (
                      <span className="text-[8px] font-black uppercase tracking-widest text-green-600 bg-green-100 px-2.5 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                </div>

                {/* Card body: image + pricing + action */}
                <div className="flex gap-5 p-5 items-center">
                  {/* Product image */}
                  <div className="relative h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-xl bg-white border border-black/10 shadow-sm">
                    {imgSrc ? (
                      <img src={imgSrc} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-black/20">
                        {it.name?.substring(0, 2) || "PD"}
                      </div>
                    )}
                  </div>

                  {/* Pricing breakdown */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-lg md:text-xl text-black">{formatPrice(lineTotal, order.currency)}</span>
                      <span className="text-[10px] font-bold text-black/30">({formatPrice(Number(it.unitPrice), order.currency)} × {it.quantity})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-red-500/10 text-red-600 rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider">
                        Qty {it.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {!isCancelled && (
                      <CancelItemButton orderId={String(order.id)} itemId={String(it.id)} itemName={it.name || it.product?.name || "Product"} guestEmail={guestEmail || undefined} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Order Summary */}
      <div className="flex justify-end">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm w-full md:w-96 space-y-3">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-black/40">
            <span>Subtotal</span>
            <span className="text-black">{formatPrice(order.subtotal, order.currency)}</span>
          </div>
          {(order.discountAmount > 0 || order.discount > 0) && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-green-600">
              <span>Discount</span>
              <span>-{formatPrice(order.discountAmount || order.discount, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-black/40">
            <span>Shipping</span>
            <span className="text-black">{formatPrice(order.shipping, order.currency)}</span>
          </div>
          {order.taxAmount > 0 && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-orange-600">
              <span>VAT {(order.taxRate ? `(${(order.taxRate * 100).toFixed(0)}%)` : "")}</span>
              <span>{formatPrice(order.taxAmount, order.currency)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-black/5 flex justify-between items-center">
            <span className="text-sm font-black uppercase tracking-widest">Total</span>
            <span className="text-2xl font-black">{formatPrice(order.total, order.currency)}</span>
          </div>
        </div>
      </div>

      {/* Payment secured bar */}
      <section className="bg-black rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl md:rounded-3xl flex items-center justify-center border border-white/10 shrink-0">
            <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="text-center md:text-left">
            <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Payment Method</div>
            <div className="text-lg md:text-xl font-black">{order.paymentMethodTitle || 'N/A'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/60">
          <CheckCircle2 size={20} className="text-green-400 shrink-0" />
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-center md:text-left">Transaction Verified and Secured</p>
        </div>
      </section>

      {/* Dynamic Actions: Cancel (30m), Cancel Admin-Added Items, or Refund (Delivered) */}
      <OrderActions 
        orderId={order.id.toString()} 
        status={order.status} 
        createdAt={order.createdAt} 
        cancelRequest={order.cancelRequest}
        returnRequest={order.returnRequest}
        returnStatus={order.returnStatus}
        adminAddedItems={adminAddedItems}
      />
    </div>
  );
}
