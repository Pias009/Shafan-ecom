"use client";

import { useCartStore } from "@/lib/cart-store";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import {
  Package, Truck, CheckCircle2, RotateCcw,
  Loader2, ShoppingBag, CreditCard, MapPin, ExternalLink, ChevronDown
} from "lucide-react";
import Link from "next/link";

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
  const a = shipping.area_name;
  const c = shipping.city_name || shipping.city;
  const co = shipping.country;
  if (h) parts.push(h);
  if (s) parts.push(s);
  if (a) parts.push(a);
  parts.push(c || "Unknown");
  if (co) parts.push(co);
  return parts.join(", ");
}

export default function AccountDashboardClient() {
  const { data: session } = useSession();
  const { items: cartItems } = useCartStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const ge = localStorage.getItem("guest_email");
    setGuestEmail(ge);

    async function fetchDashboard() {
      try {
        let apiUrl = "/api/account/dashboard";
        if (ge) apiUrl += `?email=${encodeURIComponent(ge)}`;
        const res = await fetch(apiUrl);
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  if (!mounted) return null;

  const stats = data?.stats || { pending: 0, shipped: 0, delivered: 0, refunded: 0 };
  const orders: any[] = data?.orders || [];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-1">
        {[
          { label: "Pending", value: stats.pending, icon: Loader2, color: "text-yellow-600", bg: "bg-yellow-50", spin: true },
          { label: "Shipped", value: stats.shipped, icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Refunded", value: stats.refunded, icon: RotateCcw, color: "text-red-600", bg: "bg-red-50" },
        ].map((stat, i) => (
          <div key={i} className="glass-panel border border-black/5 rounded-lg py-2 px-0.5 flex flex-col items-center justify-center text-center shadow-sm">
            <div className={`p-1 rounded ${stat.bg}`}>
              <stat.icon className={`w-4 h-4 ${stat.color} ${(stat as any).spin ? "animate-spin" : ""}`} />
            </div>
            <div className="text-[9px] font-black text-black">{stat.value}</div>
            <div className="text-[5px] font-bold uppercase tracking-wider text-black/40">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Cart Summary Bar - minimal, no product list */}
      {cartItems.length > 0 && (
        <Link
          href="/cart"
          className="flex items-center justify-between gap-3 glass-panel-heavy rounded-2xl px-5 py-3 border border-black/5 shadow-sm hover:bg-black/[0.02] transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/5 rounded-xl">
              <ShoppingBag className="w-4 h-4 text-black/40" />
            </div>
            <div>
              <div className="text-xs font-bold text-black">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in cart</div>
              <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Continue checkout</div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-black/30 -rotate-90" />
        </Link>
      )}

      {/* Orders */}
      <div className="glass-panel-heavy rounded-3xl p-6 md:p-8 border border-black/5 shadow-xl bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-black flex items-center gap-2">
            <Package className="w-5 h-5" /> Orders
          </h3>
          {orders.length > 0 && (
            <Link
              href={guestEmail ? `/account/orders?email=${encodeURIComponent(guestEmail)}` : "/account/orders"}
              className="text-xs font-bold text-black/40 hover:text-black transition flex items-center gap-1"
            >
              All Orders →
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-black/20" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex p-4 bg-black/5 rounded-full mb-4">
              <Package className="w-8 h-8 text-black/20" />
            </div>
            <p className="text-sm font-medium text-black/40 italic">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => {
              const isExpanded = expandedId === order.id;
              const thumbnails = order.items.map((it: any) => it.image).filter(Boolean);

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-black/5 bg-white overflow-hidden shadow-sm transition-all"
                >
                  {/* Order header: total + status + date */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-black">{formatPrice(order.total, order.currency)}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${statusBadgeClass(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-black/30 font-bold">{new Date(order.createdAt).toLocaleDateString()}</span>
                      <ChevronDown className={`w-4 h-4 text-black/30 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Product rows */}
                  <div className="border-t border-black/5">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 px-5 py-3 border-t border-black/5 first:border-t-0">
                        <div className="relative w-16 h-16 flex-shrink-0 bg-black/5 rounded-md overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-black/20">
                              {item.name?.substring(0, 2) || "PD"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-black truncate">{item.name}</h4>
                          <p className="text-xs text-black/40 font-medium">Qty: {item.quantity || 1}</p>
                        </div>
                        <div className="text-sm font-semibold text-black shrink-0">
                          {formatPrice(Number(item.unitPrice), order.currency)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-black/5 px-4 py-5 space-y-5 bg-black/[0.015] animate-in fade-in slide-in-from-top-2 duration-200">

                      {/* Payment & Summary row */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-black/5 bg-white p-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-2 flex items-center gap-1.5">
                            <CreditCard className="w-3 h-3" /> Payment
                          </h4>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between">
                              <span className="font-bold text-black/40">Method</span>
                              <span className="font-bold">{order.paymentMethod || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold text-black/40">Status</span>
                              <span className={`font-black uppercase tracking-widest text-[9px] ${order.paymentStatus === "PAID" ? "text-green-600" : "text-amber-600"}`}>
                                {order.paymentStatus || "PENDING"}
                              </span>
                            </div>
                            <div className="border-t border-black/5 pt-2 mt-2 space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-black/40 font-bold">Subtotal</span>
                                <span className="font-bold">{formatPrice(order.subtotal || 0, order.currency)}</span>
                              </div>
                              {(order.discount ?? 0) > 0 && (
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-green-600 font-bold">Discount</span>
                                  <span className="font-bold text-green-600">-{formatPrice(order.discount, order.currency)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-[10px]">
                                <span className="text-black/40 font-bold">Shipping</span>
                                <span className="font-bold">{formatPrice(order.shipping || 0, order.currency)}</span>
                              </div>
                              {(order.taxAmount ?? 0) > 0 && (
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-orange-600 font-bold">VAT</span>
                                  <span className="font-bold text-orange-600">{formatPrice(order.taxAmount, order.currency)}</span>
                                </div>
                              )}
                              <div className="border-t border-black/10 pt-2 flex justify-between">
                                <span className="text-[12px] font-black">Total</span>
                                <span className="text-[14px] font-black">{formatPrice(order.total, order.currency)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tracking */}
                        <div className="rounded-xl border border-black/5 bg-white p-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-2 flex items-center gap-1.5">
                            <Truck className="w-3 h-3" /> Delivery
                          </h4>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between">
                              <span className="font-bold text-black/40">Courier</span>
                              <span className="font-bold">{order.shipment?.courier || "Standard"}</span>
                            </div>
                            {order.shipment?.trackingCode && (
                              <div className="flex justify-between">
                                <span className="font-bold text-black/40">Waybill</span>
                                <span className="font-bold font-mono text-[10px]">{order.shipment.trackingCode}</span>
                              </div>
                            )}
                            {(order.trackingUrl || order.shipment?.trackingUrl) && (
                              <a
                                href={order.trackingUrl || order.shipment?.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 mt-3 w-full px-4 py-2 rounded-full bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-black/80 transition"
                              >
                                <ExternalLink className="w-3 h-3" /> Track
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 && (
                        <div className="rounded-xl border border-black/5 bg-white p-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-2 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> Delivery Address
                          </h4>
                          <div className="text-[11px] font-bold text-black/60 leading-relaxed">
                            {formatAddress(order.shippingAddress)}
                          </div>
                        </div>
                      )}

                      <Link
                        href={guestEmail ? `/account/orders/${order.id}?email=${encodeURIComponent(guestEmail)}` : `/account/orders/${order.id}`}
                        className="block w-full text-center py-3 rounded-full border border-black/10 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition"
                      >
                        Full Receipt →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
