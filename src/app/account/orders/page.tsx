import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageOpen, Eye } from "lucide-react";

function formatPrice(amountCents: number, currency: string): string {
  const code = currency?.toUpperCase() || 'USD';
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  const amount = Number(amountCents);
  return `${code} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function statusBadgeClass(status: string): string {
  const s = status?.toUpperCase() || "";
  if (s === "DELIVERED") return "bg-green-100 text-green-800 border-green-200";
  if (s === "SHIPPED" || s === "IN_TRANSIT") return "bg-green-100 text-green-800 border-green-200";
  if (s === "PROCESSING" || s === "ORDER_CONFIRMED") return "bg-blue-100 text-blue-800 border-blue-200";
  if (s === "PAID") return "bg-blue-100 text-blue-800 border-blue-200";
  if (s === "ORDER_RECEIVED") return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "CANCELLED") return "bg-red-100 text-red-800 border-red-200";
  if (s === "REFUNDED") return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-black/5 text-black/40 border-black/5";
}

function formatAddress(shipping: Record<string, any>): string {
  if (!shipping || Object.keys(shipping).length === 0) return "";
  const parts: string[] = [];
  const house = shipping.house_building || shipping.address_2 || shipping.address2 || "";
  const street = shipping.street_road || shipping.address_1 || shipping.address1 || "";
  const area = shipping.area_name || "";
  const city = shipping.city_name || shipping.city || "";
  const country = shipping.country || "";
  if (house) parts.push(house);
  if (street) parts.push(street);
  if (area) parts.push(area);
  parts.push(city);
  if (country) parts.push(country);
  return parts.join(", ");
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
              select: { slug: true, mainImage: true, images: true }
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
      itemCount: o.items.reduce((acc: number, item: any) => acc + item.quantity, 0),
      paymentMethod: o.paymentMethodTitle,
      shippingAddress: o.shippingAddress || {},
      items: o.items.map((it: any) => ({
        id: it.id,
        name: it.nameSnapshot || it.name || 'Unknown Product',
        slug: it.product?.slug || it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        imageSnapshot: it.imageSnapshot || it.product?.mainImage || it.product?.images?.[0] || null,
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
          <div className="grid gap-4">
            {orders.map((order) => {
              const addressStr = formatAddress(order.shippingAddress);

              return (
                <div
                  key={order.id}
                  className="glass-panel-heavy rounded-2xl border border-black/5 shadow-sm bg-white overflow-hidden"
                >
                  {/* Order header */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-black">{formatPrice(order.total, order.currency)}</span>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border ${statusBadgeClass(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border ${
                        order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 border-green-200' :
                        order.paymentStatus === 'CANCELLED' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {order.paymentStatus || 'PENDING'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {addressStr && (
                        <span className="text-[10px] text-black/30 font-medium hidden sm:block truncate max-w-[200px]">
                          {addressStr}
                        </span>
                      )}
                      <span className="text-[10px] text-black/30 font-bold">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Product rows */}
                  <div className="border-t border-black/5">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3 border-t border-black/5 first:border-t-0">
                        <div className="relative w-16 h-16 flex-shrink-0 bg-black/5 rounded-md overflow-hidden">
                          {item.imageSnapshot ? (
                            <img src={item.imageSnapshot} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-black/20">
                              {item.name?.substring(0, 2) || "PD"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={item.slug ? `/products/${item.slug}` : '#'}
                            className="text-sm font-medium text-black hover:underline truncate block"
                          >
                            {item.name}
                          </Link>
                          <p className="text-xs text-black/40 font-medium">Qty: {item.quantity || 1}</p>
                        </div>
                        <div className="text-sm font-semibold text-black shrink-0">
                          {formatPrice(Number(item.unitPrice), order.currency)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View receipt link */}
                  <div className="border-t border-black/5 px-5 py-3 flex justify-end">
                    <Link
                      href={guestEmail ? `/account/orders/${order.id}?email=${encodeURIComponent(guestEmail)}` : `/account/orders/${order.id}`}
                      className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-black text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-black/20 transition hover:bg-black/80 active:scale-95"
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
