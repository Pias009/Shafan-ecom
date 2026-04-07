"use client";

import { useCartStore } from "@/lib/cart-store";
import { useEffect, useState } from "react";
import { ShoppingBag, Package, Truck, CheckCircle2, XCircle, RotateCcw, ArrowRight, Loader2, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/Price";
import { useUserCountry } from "@/lib/country-detection";

interface DashboardData {
  orders: any[];
  stats: {
    pending: number;
    shipped: number;
    delivered: number;
    refunded: number;
  };
}

export default function AccountDashboardClient() {
  const userCountry = useUserCountry();
  const { items: cartItems } = useCartStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/account/dashboard"); // We'll create this next
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (!mounted) return null;

  const cartTotal = cartItems.reduce((acc, item) => {
    // Treat as cents since it comes from the DB through the store
    const priceToUse = item.discountPrice ?? item.price ?? 0;
    return acc + priceToUse * item.quantity;
  }, 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Stats Grid - Single Row Horizontal on Mobile */}
      <div className="grid grid-cols-4 gap-1">
        {[
          { label: "Pending", value: data?.stats.pending ?? 0, icon: Loader2, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Shipped", value: data?.stats.shipped ?? 0, icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Delivered", value: data?.stats.delivered ?? 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Refunded", value: data?.stats.refunded ?? 0, icon: RotateCcw, color: "text-red-600", bg: "bg-red-50" },
        ].map((stat, i) => (
          <div key={i} className={`glass-panel border border-black/5 rounded-lg py-2 px-0.5 flex flex-col items-center justify-center text-center shadow-sm`}>
            <div className={`p-1 rounded ${stat.bg}`}>
              <stat.icon className={`w-4 h-4 ${stat.color} ${stat.label === 'Pending' ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-[9px] font-black text-black">{stat.value}</div>
            <div className="text-[5px] font-bold uppercase tracking-wider text-black/40">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Current Cart */}
        <div className="glass-panel-heavy rounded-3xl p-8 border border-black/5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-black flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Current Cart
            </h3>
            <Link href="/cart" className="text-xs font-bold text-black/40 hover:text-black transition flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
              {cartItems.length === 0 ? (
            <div className="py-10 text-center">
              <div className="inline-flex p-4 bg-black/5 rounded-full mb-4">
                <ShoppingBag className="w-8 h-8 text-black/20" />
              </div>
              <p className="text-sm font-medium text-black/40 italic">Your cart is empty.</p>
            </div>
              ) : (
                <div className="space-y-4">
              {cartItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex flex-wrap items-center gap-4 p-3 rounded-2xl bg-black/[0.02] border border-black/5">
                  <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-white shadow-sm border border-black/5">
                    <Image 
                      src={item.imageUrl || "/placeholder-product.png"} 
                      alt={item.name} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-black break-words">{item.name}</div>
                    <div className="text-xs text-black/40 font-bold uppercase tracking-tighter">{item.brand}</div>
                  </div>
                  <div className="text-sm font-black text-black">
                    <Price amount={item.discountPrice ?? item.price} countryPrices={item.countryPrices} />
                  </div>
                </div>
              ))}
              {cartItems.length > 3 && (
                <p className="text-center text-[10px] font-bold text-black/30 uppercase tracking-widest mt-2">+ {cartItems.length - 3} more items</p>
              )}
              <div className="mt-6 pt-6 border-t border-black/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Estimated Total</div>
                  <div className="text-xl font-black text-black">
                    <Price amount={cartTotal} />
                  </div>
                </div>
                <Link href="/cart" className="bg-black text-white rounded-full px-6 py-2.5 text-xs font-bold shadow-lg shadow-black/20 transition hover:scale-105 active:scale-95">
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="glass-panel-heavy rounded-3xl p-8 border border-black/5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-black flex items-center gap-2">
              <Package className="w-5 h-5" /> Recent Orders
            </h3>
            <Link href="/account/orders" className="text-xs font-bold text-black/40 hover:text-black transition flex items-center gap-1">
              History <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {!data || data.orders.length === 0 ? (
            <div className="py-10 text-center">
              <div className="inline-flex p-4 bg-black/5 rounded-full mb-4">
                <Package className="w-8 h-8 text-black/20" />
              </div>
              <p className="text-sm font-medium text-black/40 italic">No orders found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.orders.slice(0, 3).map((order) => (
                <div key={order.id} className="p-4 rounded-2xl bg-black/[0.02] border border-black/5 group hover:bg-white transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-bold text-black/40 uppercase tracking-tighter">ID: #{order.id}</div>
                    <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </div>
                  </div>
                  
                  {/* Product List Summary */}
                  <div className="mb-4 space-y-2">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="p-1 bg-black/5 rounded-lg">
                          <Package className="w-3 h-3 text-black/20" />
                        </div>
                  <span className="text-[11px] font-bold text-black/70 break-words flex-1">{item.name}</span>
                        <span className="text-[10px] font-black text-black/30">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-black/5">
                    <div>
                      <div className="text-lg font-black text-black">
                        <Price amount={order.totalCents} currency={order.currency} />
                      </div>
                      <div className="text-[10px] font-bold text-black/30 uppercase">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <Link href={`/account/orders`} className="p-2 rounded-full hover:bg-black/5 transition">
                      <ArrowRight className="w-4 h-4 text-black/40" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Advisory Note */}
      <div className="glass-panel rounded-2xl px-6 py-4 border border-blue-500/10 bg-blue-50/30 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs font-medium text-blue-800 leading-relaxed">
           Order statuses are updated automatically via courier integration. Ensure your <strong>Shipping Address</strong> is complete to avoid processing delays.
        </p>
      </div>

    </div>
  );
}
