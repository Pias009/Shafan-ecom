import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageOpen, ExternalLink } from "lucide-react";
import { OrderStatus } from "@prisma/client";

export default async function OrdersPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.email) return redirect("/auth/sign-in");

  let orders: any[] = [];
  try {
    // First, get the user ID from the session email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    const dbOrders = await (prisma as any).order.findMany({
      where: {
        OR: [
          { userId: user?.id },
          { user: { email: session.user.email } },
          { email: session.user.email }
        ]
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    orders = dbOrders.map((o: any) => ({
      id: String(o.id),
      totalCents: o.totalCents,
      status: o.status,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((acc: number, item: any) => acc + item.quantity, 0),
      paymentMethod: o.paymentMethodTitle,
      items: o.items.map((it: any) => ({
        name: it.nameSnapshot || it.name || 'Unknown Product',
        id: it.productId
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
            <p className="mt-1 text-sm text-black/60 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Manage and track your recent purchases (MongoDB).</p>
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
          <div className="grid gap-6">
            {orders.map((order) => (
              <div 
                key={order.id}
                className="glass-panel-heavy rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition hover:bg-black/[0.02] border border-black/5 shadow-sm bg-white"
              >
                <div className="flex flex-col sm:flex-row items-start gap-6 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-black text-white flex flex-col items-center justify-center shrink-0 shadow-xl shadow-black/10">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Order</span>
                    <span className="text-xs font-black">#{order.id.substring(0,6)}</span>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-2xl font-black text-black">
                        ${(order.totalCents / 100).toFixed(2)}
                      </span>
                      <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
                        order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-800 border-green-200' : 
                        [OrderStatus.PAID, OrderStatus.PROCESSING].includes(order.status) ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        [OrderStatus.PENDING_PAYMENT].includes(order.status) ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                        'bg-black/5 text-black/40 border-black/5'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Product Names as Links */}
                    <div className="flex flex-wrap gap-2">
                       {order.items.slice(0, 3).map((item: any, i: number) => {
                         const productId = item.id || item.productId;
                         const productName = item.name || item.nameSnapshot || 'Unknown Product';
                         return (
                           <Link
                             key={i}
                             href={productId ? `/products/${productId}` : '#'}
                             className="text-[10px] font-bold text-black/50 bg-black/5 px-3 py-1 rounded-lg hover:bg-black hover:text-white transition-colors"
                           >
                             {productName}
                           </Link>
                         );
                       })}
                       {order.items.length > 3 && (
                         <span className="text-[10px] font-bold text-black/30 px-2 py-1">+{order.items.length - 3} more</span>
                       )}
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-[10px] text-black/40 font-black uppercase tracking-widest">
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className="w-1 h-1 bg-black/10 rounded-full" />
                      <span>{order.paymentMethod || 'Unknown Payment'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 active:scale-95 transition-transform">
                  <Link href={`/account/orders/${order.id}`} className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-black/20 transition hover:bg-black/80">
                    View Receipt
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
