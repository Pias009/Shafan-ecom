import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageOpen, Eye, CreditCard, Truck, MapPin, ExternalLink } from "lucide-react";

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

function formatAddress(shipping: Record<string, any>): string {
  if (!shipping || Object.keys(shipping).length === 0) return "";
  const parts: string[] = [];
  const h = shipping.house_building || shipping.address_2 || shipping.address2;
  const s = shipping.street_road || shipping.address_1 || shipping.address1;
  if (h) parts.push(h);
  if (s) parts.push(s);
  if (shipping.block_no) parts.push(`Block ${shipping.block_no}`);
  if (shipping.zone) parts.push(`Zone ${shipping.zone}`);
  if (shipping.area_name) parts.push(shipping.area_name);
  const c = shipping.city_name || shipping.city;
  parts.push(c || "Unknown");
  if (shipping.region) parts.push(shipping.region);
  if (shipping.country) parts.push(shipping.country);
  return parts.join(", ");
}

function getItemImage(item: any): string | null {
  return item.imageSnapshot || item.product?.mainImage || item.product?.images?.[0] || null;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const session = await getServerAuthSession();
  const sp = await searchParams;
  const guestEmail = sp?.email;
  const userEmail = session?.user?.email || guestEmail;

  if (!userEmail) return redirect("/?login=true");

  let orders: any[] = [];
  try {
    const user = session?.user?.email ? await prisma.user.findUnique({
      where: { email: session.user.email }
    }) : null;

    const dbOrders = await (prisma as any).order.findMany({
      where: {
        OR: [
          ...(user?.id ? [{ userId: user.id }] : []),
          ...(session?.user?.email ? [{ user: { email: session.user.email } }] : []),
          { email: userEmail }
        ]
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, slug: true, mainImage: true, images: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    orders = dbOrders.map((o: any) => ({
      id: String(o.id),
      total: o.total,
      currency: o.currency,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      paymentMethod: o.paymentMethodTitle,
      subtotal: o.subtotal,
      shipping: o.shipping,
      discount: o.discount,
      taxAmount: o.taxAmount,
      shippingAddress: o.shippingAddress || {},
      shipment: o.shipment
        ? {
            courier: (o.shipment as any)?.courier,
            trackingCode: (o.shipment as any)?.trackingCode,
            trackingUrl: (o.shipment as any)?.trackingUrl,
          }
        : null,
      items: o.items.map((it: any) => ({
        id: it.id,
        name: it.nameSnapshot || it.product?.name || 'Unknown Product',
        nameSnapshot: it.nameSnapshot,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        cancelledAt: it.cancelledAt,
        imageSnapshot: it.imageSnapshot,
        product: it.product
          ? {
              slug: it.product.slug,
              mainImage: it.product.mainImage,
              images: it.product.images,
            }
          : undefined,
      })),
    }));
  } catch (error) {
    console.error("Prisma Orders Page Error:", error);
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel-heavy rounded-3xl p-8 border border-black/5 shadow-xl bg-white">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-black">My Orders</h2>
            <p className="mt-1 text-sm text-black/60 font-medium">Manage and track your recent purchases.</p>
          </div>
          <div className="p-3 bg-black/5 rounded-2xl ring-1 ring-black/10 hidden sm:block">
            <PackageOpen className="w-6 h-6 text-black" />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-5 bg-black/5 rounded-full ring-1 ring-black/5 mb-4">
              <PackageOpen className="w-10 h-10 text-black/20" />
            </div>
            <h3 className="text-xl font-bold text-black">No orders yet</h3>
            <p className="mt-2 text-sm text-black/60 font-medium">When you place an order, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => {
              const imgSrc = getItemImage(order.items?.[0]);

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-black/5 bg-white overflow-hidden shadow-sm"
                >
                  {/* Order header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-black/[0.02]">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-black">{formatPrice(order.total, order.currency)}</span>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border ${statusBadgeClass(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border ${
                        order.paymentStatus === "PAID" ? "bg-green-100 text-green-800 border-green-200" :
                        order.paymentStatus === "CANCELLED" ? "bg-red-100 text-red-800 border-red-200" :
                        "bg-amber-100 text-amber-800 border-amber-200"
                      }`}>
                        {order.paymentStatus || "PENDING"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-black/40 font-bold">
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className="w-1 h-1 bg-black/10 rounded-full" />
                      <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Compact clickable product cards */}
                  <div className="px-4 py-3 space-y-1">
                    {order.items.map((item: any, i: number) => {
                      const itemImg = getItemImage(item);
                      const isCancelled = item.cancelledAt;
                      return (
                        <Link
                          key={i}
                          href={guestEmail ? `/account/orders/${order.id}?product=${item.id}&email=${encodeURIComponent(guestEmail)}` : `/account/orders/${order.id}?product=${item.id}`}
                          className={`flex gap-3 items-center rounded-xl px-3 py-2.5 transition ${isCancelled ? "bg-black/[0.02] opacity-60" : "bg-black/[0.02] hover:bg-black/[0.06]"}`}
                        >
                          <div className="relative h-10 w-10 md:h-12 md:w-12 shrink-0 overflow-hidden rounded-xl bg-white border border-black/10 shadow-sm">
                            {itemImg ? (
                              <img src={itemImg} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-black/20">
                                {item.name?.substring(0, 2) || "PD"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] md:text-xs font-bold text-black leading-tight truncate">{item.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-flex items-center justify-center bg-red-500/10 text-red-600 rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-wider">
                                Qty {item.quantity || 1}
                              </span>
                              {isCancelled && (
                                <span className="text-[7px] font-black uppercase tracking-widest text-red-400">Cancelled</span>
                              )}
                            </div>
                          </div>
                          <div className="font-black text-xs md:text-sm text-black shrink-0">
                            {formatPrice(Number(item.unitPrice) * (item.quantity || 1), order.currency)}
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Order details footer */}
                  <div className="border-t border-black/5 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 text-[11px]">
                      <div className="flex items-center gap-1.5 text-black/50">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span className="font-bold">{order.paymentMethod || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-black/50">
                        <Truck className="w-3.5 h-3.5" />
                        <span className="font-bold">{order.shipment?.courier || "Standard"}</span>
                      </div>
                      {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 && (
                        <div className="flex items-center gap-1.5 text-black/50">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="font-bold text-[10px] truncate max-w-[200px]">{formatAddress(order.shippingAddress)}</span>
                        </div>
                      )}
                    </div>
                    <Link
                      href={guestEmail ? `/account/orders/${order.id}?email=${encodeURIComponent(guestEmail)}` : `/account/orders/${order.id}`}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-black text-white text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-black/80 active:scale-95 transition shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Receipt
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
