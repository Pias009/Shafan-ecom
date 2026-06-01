"use client";

import { useState, useCallback } from "react";
import { PackageOpen, ChevronDown } from "lucide-react";
import OrderDetailView from "./OrderDetailView";

function formatPrice(amountCents: number, currency: string): string {
  const code = currency?.toUpperCase() || "USD";
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

function statusLabel(status: string): string {
  return status?.replace(/_/g, " ") || "PENDING";
}

function getOrderThumbnail(item: any): string | null {
  return item.imageSnapshot || item.product?.mainImage || item.product?.images?.[0] || null;
}

interface OrderItemData {
  id: string;
  name: string;
  nameSnapshot?: string;
  quantity: number;
  unitPrice: number;
  imageSnapshot?: string | null;
  product?: {
    slug?: string;
    mainImage?: string;
    images?: string[];
  };
}

interface OrderData {
  id: string;
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  itemCount: number;
  paymentMethod?: string;
  paymentMethodTitle?: string;
  items: OrderItemData[];
  shippingAddress?: Record<string, any>;
  billingAddress?: Record<string, any>;
  subtotal?: number;
  shipping?: number;
  discount?: number;
  taxAmount?: number;
  taxRate?: number;
  trackingId?: string;
  trackingUrl?: string;
  shipment?: {
    courier?: string;
    trackingCode?: string;
    trackingUrl?: string;
  };
  cancelRequest?: boolean;
  returnRequest?: boolean;
  returnStatus?: string;
}

export default function OrderList({ orders: initialOrders }: { orders: OrderData[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);

  const toggleExpand = useCallback(async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }

    // Check if we already have full data for this order (eager loaded)
    const existing = orders.find(o => o.id === orderId);
    if (existing && existing.subtotal !== undefined) {
      setExpandedId(orderId);
      return;
    }

    // Fetch full order details
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const full: any = await res.json();
        setOrders(prev =>
          prev.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  subtotal: full.subtotal,
                  shipping: full.shipping,
                  discount: full.discount,
                  taxAmount: full.taxAmount,
                  taxRate: full.taxRate,
                  paymentMethod: full.paymentMethod,
                  paymentMethodTitle: full.paymentMethodTitle,
                  shippingAddress: full.shippingAddress,
                  billingAddress: full.billingAddress,
                  trackingId: full.trackingId,
                  trackingUrl: full.trackingUrl,
                  shipment: full.shipment,
                  cancelRequest: full.cancelRequest,
                  returnRequest: full.returnRequest,
                  returnStatus: full.returnStatus,
                  items: (full.items || []).map((it: any) => ({
                    id: it.id,
                    name: it.nameSnapshot || it.name || "Unknown Product",
                    nameSnapshot: it.nameSnapshot,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    imageSnapshot: it.imageSnapshot,
                    product: it.product,
                  })),
                }
              : o
          )
        );
      }
    } catch {
      // silently fail, show what we have
    }
    setExpandedId(orderId);
  }, [expandedId, orders]);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-5 bg-black/5 rounded-full ring-1 ring-black/5 mb-4">
          <PackageOpen className="w-10 h-10 text-black/20" />
        </div>
        <h3 className="text-xl font-bold text-black">No orders yet</h3>
        <p className="mt-2 text-sm text-black/60 font-medium">When you place an order, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map(order => {
        const isExpanded = expandedId === order.id;
        const thumbnails = order.items.map(getOrderThumbnail).filter(Boolean) as string[];
        const extraCount = order.items.length - 4;

        return (
          <div
            key={order.id}
            className="glass-panel-heavy rounded-2xl border border-black/5 shadow-sm bg-white overflow-hidden transition-all"
          >
            <button
              onClick={() => toggleExpand(order.id)}
              className="w-full text-left p-5 flex items-center gap-4 hover:bg-black/[0.02] transition"
            >
              <div className="w-14 h-14 rounded-2xl bg-black text-white flex flex-col items-center justify-center shrink-0 shadow-xl shadow-black/10">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Order</span>
                <span className="text-[11px] font-black">#{order.id.substring(0, 6)}</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 flex-1 min-w-0">
                <div className="flex -space-x-2 shrink-0">
                  {thumbnails.slice(0, 4).map((src, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-lg bg-black/5 border-2 border-white overflow-hidden flex items-center justify-center text-[8px] font-bold text-black/30"
                    >
                      {src ? (
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      ) : (
                        order.items[i]?.name?.substring(0, 2) || "??"
                      )}
                    </div>
                  ))}
                  {extraCount > 0 && (
                    <div className="w-9 h-9 rounded-lg bg-black/10 border-2 border-white flex items-center justify-center text-[9px] font-black text-black/50">
                      +{extraCount}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-black text-black">
                      {formatPrice(order.total, order.currency)}
                    </span>
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border ${statusBadgeClass(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border ${
                      order.paymentStatus === "PAID" ? "bg-green-100 text-green-800 border-green-200" :
                      order.paymentStatus === "CANCELLED" ? "bg-red-100 text-red-800 border-red-200" :
                      "bg-amber-100 text-amber-800 border-amber-200"
                    }`}>
                      {order.paymentStatus || "PENDING"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-black/40 font-black uppercase tracking-widest">
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span className="w-1 h-1 bg-black/10 rounded-full" />
                    <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>

              <ChevronDown
                className={`w-5 h-5 text-black/30 shrink-0 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {isExpanded && (
              <div className="border-t border-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                <OrderDetailView order={order} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
