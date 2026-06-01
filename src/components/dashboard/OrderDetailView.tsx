"use client";

import Link from "next/link";
import {
  ShoppingBag,
  CreditCard,
  Truck,
  MapPin,
  ExternalLink,
} from "lucide-react";

function formatPrice(amountCents: number, currency: string): string {
  const code = currency?.toUpperCase() || "USD";
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  const amount = Number(amountCents);
  return `${code} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function formatAddress(shipping: Record<string, any>) {
  if (!shipping || Object.keys(shipping).length === 0) {
    return <span className="text-black/30 italic">No address recorded</span>;
  }

  // Support both new and legacy field names
  const house = shipping.house_building || shipping.address_2 || shipping.address2 || "";
  const street = shipping.street_road || shipping.address_1 || shipping.address1 || "";
  const area = shipping.area_name || "";
  const city = shipping.city_name || shipping.city || "";
  const country = shipping.country || "";

  return (
    <div className="text-[11px] font-bold text-black/60 leading-relaxed">
      {house && <div className="text-black/40 text-[10px]">{house}</div>}
      {street && <div>{street}</div>}
      {area && <div className="text-black/40">{area}</div>}
      <div>
        {city}
        {country && <>, {country}</>}
      </div>
    </div>
  );
}

interface OrderDetailViewProps {
  order: {
    id: string;
    total: number;
    currency: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
    subtotal?: number;
    shipping?: number;
    discount?: number;
    taxAmount?: number;
    taxRate?: number;
    paymentMethod?: string;
    paymentMethodTitle?: string;
    shippingAddress?: Record<string, any>;
    billingAddress?: Record<string, any>;
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
    items: Array<{
      id: string;
      name: string;
      nameSnapshot?: string;
      quantity: number;
      unitPrice: number;
      imageSnapshot?: string | null;
      product?: { slug?: string };
    }>;
  };
}

export default function OrderDetailView({ order }: OrderDetailViewProps) {
  const shipping = order.shippingAddress || {};
  const billing = order.billingAddress || {};
  const shipment = order.shipment;

  const trackingUrl =
    order.trackingUrl || shipment?.trackingUrl || null;
  const trackingCode =
    order.trackingId || shipment?.trackingCode || null;
  const courierName =
    shipment?.courier || "Standard Shipping";

  return (
    <div className="p-5 md:p-6 space-y-6 bg-black/[0.015]">
      {/* Products Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="w-4 h-4 text-black/40" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40">Products</h4>
        </div>
        <div className="divide-y divide-black/5 rounded-xl border border-black/5 bg-white overflow-hidden">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-black/5 border border-black/5 overflow-hidden flex items-center justify-center text-[8px] font-bold text-black/20 shrink-0">
                  {item.imageSnapshot ? (
                    <img src={item.imageSnapshot} alt="" className="w-full h-full object-cover" />
                  ) : (
                    item.name.substring(0, 2)
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={item.product?.slug ? `/products/${item.product.slug}` : "#"}
                    className="text-[12px] font-bold text-black hover:underline truncate block"
                  >
                    {item.name}
                  </Link>
                  <div className="text-[9px] font-bold text-black/30 uppercase tracking-widest">
                    Qty: {item.quantity}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="text-[12px] font-black">
                  {formatPrice(Number(item.unitPrice) * item.quantity, order.currency)}
                </div>
                <div className="text-[9px] font-bold text-black/30">
                  {formatPrice(Number(item.unitPrice), order.currency)} ea
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Order Summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Payment Info */}
        <section className="rounded-xl border border-black/5 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-black/40" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40">Payment</h4>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="font-bold text-black/40">Method</span>
              <span className="font-bold">{order.paymentMethodTitle || order.paymentMethod || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-black/40">Status</span>
              <span className={`font-black uppercase tracking-widest text-[9px] ${
                order.paymentStatus === "PAID" ? "text-green-600" :
                order.paymentStatus === "CANCELLED" ? "text-red-500" :
                "text-amber-600"
              }`}>
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
                  <span className="font-bold text-green-600">-{formatPrice(order.discount ?? 0, order.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px]">
                <span className="text-black/40 font-bold">Shipping</span>
                <span className="font-bold">{formatPrice(order.shipping || 0, order.currency)}</span>
              </div>
              {Number(order.taxAmount) > 0 && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-orange-600 font-bold">VAT ({(order.taxRate || 0) * 100}%)</span>
                  <span className="font-bold text-orange-600">{formatPrice(order.taxAmount || 0, order.currency)}</span>
                </div>
              )}
              <div className="border-t border-black/10 pt-2 flex justify-between">
                <span className="text-[12px] font-black">Total</span>
                <span className="text-[14px] font-black">{formatPrice(order.total, order.currency)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Courier & Tracking */}
        <section className="rounded-xl border border-black/5 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-black/40" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40">Delivery</h4>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="font-bold text-black/40">Courier</span>
              <span className="font-bold">{courierName}</span>
            </div>
            {trackingCode && (
              <div className="flex justify-between">
                <span className="font-bold text-black/40">Waybill</span>
                <span className="font-bold font-mono text-[10px]">{trackingCode}</span>
              </div>
            )}
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-3 w-full px-4 py-2.5 rounded-full bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-black/80 transition"
              >
                <ExternalLink className="w-3 h-3" />
                Track Package
              </a>
            )}
            {!trackingUrl && !trackingCode && (
              <p className="text-[10px] text-black/30 italic font-medium mt-2">
                Tracking details will appear once shipped.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Delivery Address */}
      <section className="rounded-xl border border-black/5 bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-black/40" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40">Delivery Address</h4>
        </div>
        {formatAddress(shipping)}
      </section>

      {/* Billing Info (compact) */}
      {billing?.first_name && (
        <section className="text-[10px] text-black/30 font-bold border-t border-black/5 pt-4">
          Billing: {billing.first_name} {billing.last_name} &mdash; {billing.email || ""}
        </section>
      )}
    </div>
  );
}
