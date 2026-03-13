import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PackageOpen, ArrowRight, ExternalLink } from "lucide-react";

export default async function OrdersPage() {
  const session = await getServerAuthSession();
  if (!session?.user) return redirect("/auth/sign-in");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel-heavy rounded-3xl p-8 border border-black/5 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-black">Order History</h2>
            <p className="mt-1 text-sm text-black/60 font-medium">View and track your recent orders.</p>
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
            {orders.map((order) => (
              <div 
                key={order.id}
                className="glass-panel-heavy rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-black/[0.02] border border-black/5 shadow-sm"
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center shrink-0 border border-black/5 shadow-inner">
                    <span className="text-[10px] font-bold text-black/40 uppercase tracking-tighter">ID: {order.id.slice(-4)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-black tracking-tight">
                        ${(order.totalCents / 100).toFixed(2)}
                      </span>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                        order.status === 'DELIVERED' || order.status === 'SHIPPED' ? 'bg-green-100 text-green-800' : 
                        order.status === 'PENDING_PAYMENT' || order.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-black/5 text-black/40'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-black/50 font-bold uppercase tracking-wide">
                      Ordered {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:pl-6 sm:border-l sm:border-black/5">
                  <a href="#" className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-full bg-black text-white text-xs font-bold shadow-lg shadow-black/20 transition hover:scale-[1.02] active:scale-[0.98]">
                    Details
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
