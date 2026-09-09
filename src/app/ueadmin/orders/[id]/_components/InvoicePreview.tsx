"use client";

import React, { useRef } from "react";
import { Printer, Download } from "lucide-react";

interface InvoicePreviewProps {
  order: any;
}

export default function InvoicePreview({ order }: InvoicePreviewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const billing = order.billingAddress as Record<string, any> | null;
  const shipping = order.shippingAddress as Record<string, any> | null;

  const customerName =
    order.user?.name ||
    (billing?.fullName || `${billing?.first_name || ""} ${billing?.last_name || ""}`.trim()) ||
    (shipping?.fullName || `${shipping?.first_name || ""} ${shipping?.last_name || ""}`.trim()) ||
    "Customer";

  const customerPhone = billing?.phone || shipping?.phone || "N/A";
  const addressLine =
    billing?.house_building ||
    billing?.address_2 ||
    billing?.street_road ||
    billing?.address_1 ||
    shipping?.street_road ||
    shipping?.address_1 ||
    "Address details";

  const cityCountry = `${billing?.city_name || billing?.city || shipping?.city || ""} ${billing?.country || shipping?.country || ""}`.trim();

  const orderNum = order.id ? `#${order.id.slice(-5).toUpperCase()}` : "#35767";
  const invoiceNum = order.id ? `${order.id.slice(-5).toUpperCase()}` : "26157";
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const currency = (order.currency || "AED").toUpperCase();
  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || order.discountAmount || 0);
  const discountPercent = subtotal > 0 && discount > 0 ? ((discount / subtotal) * 100).toFixed(2) : "0.00";
  const tax = Number(order.taxAmount || 0);
  const shippingFee = Number(order.shipping || 0);
  const total = Number(order.total || subtotal - discount + tax + shippingFee);

  const decimals = ["KWD", "BHD", "OMR"].includes(currency) ? 3 : 2;
  const formatAmt = (val: number) => `${currency} ${val.toFixed(decimals)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.open(`/api/admin/orders/${order.id}/invoice`, "_blank");
  };

  const qrData = encodeURIComponent(`https://shanafaglobal.com/account/orders/${order.id}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrData}`;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
      {/* Action bar on top */}
      <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
          Official Invoice Preview
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-700"
          >
            <Printer size={13} /> Print
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Download size={13} /> PDF
          </button>
        </div>
      </div>

      {/* Invoice Document Body (Matches Page 8 Sample) */}
      <div
        ref={invoiceRef}
        className="p-6 md:p-8 bg-white relative text-neutral-800 text-xs font-sans select-none"
        style={{ minHeight: "650px" }}
      >
        {/* Purple decorative accent bar on left */}
        <div className="absolute left-0 top-6 bottom-6 w-2 bg-[#8A3FFC] rounded-r-md" />
        {/* Purple decorative bottom accent bar */}
        <div className="absolute left-0 bottom-0 right-0 h-2.5 bg-[#8A3FFC]" />

        <div className="pl-4">
          {/* Header Row */}
          <div className="flex justify-between items-start border-b border-neutral-100 pb-5 mb-5">
            <div>
              <div className="inline-block bg-[#8A3FFC] text-white px-2.5 py-1 rounded font-black tracking-widest text-xs uppercase mb-2">
                SHANFA GLOBAL
              </div>
              <div className="text-[11px] text-neutral-600 space-y-0.5 mt-1">
                <p className="flex items-center gap-1.5">
                  <span>📞</span> 048387827
                </p>
                <p className="flex items-center gap-1.5">
                  <span>✉</span> support@shanfaglobal.com
                </p>
                <p className="flex items-center gap-1.5">
                  <span>📍</span> Office: 405, 4th floor, Al Diyafa&apos;h Center, Satwa Roundabout
                </p>
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-2xl font-black text-[#8A3FFC] tracking-tight">INVOICE</h2>
              <p className="text-neutral-500 font-semibold text-xs mt-0.5">Invoice No : {invoiceNum}</p>
            </div>
          </div>

          {/* Billing & Order Meta Row */}
          <div className="grid grid-cols-3 gap-4 pb-4 mb-4 border-b border-neutral-100 text-[11px]">
            <div>
              <p className="font-bold text-[#8A3FFC] uppercase text-[10px] tracking-wider mb-1">Billing</p>
              <p className="font-bold text-neutral-900">{customerName}</p>
              <p className="text-neutral-600">{addressLine}</p>
              <p className="text-neutral-600">{cityCountry}</p>
              <p className="text-neutral-600 font-medium">{customerPhone}</p>
            </div>

            <div>
              <p className="font-bold text-[#8A3FFC] uppercase text-[10px] tracking-wider mb-1">Ship To</p>
              <p className="font-bold text-neutral-900">{customerName}</p>
              <p className="text-neutral-600">{addressLine}</p>
              <p className="text-neutral-600">{cityCountry}</p>
              <p className="text-neutral-600 font-medium">{customerPhone}</p>
            </div>

            <div className="text-right space-y-1">
              <p>
                <span className="text-neutral-400 font-medium">Order Number :</span>{" "}
                <span className="font-bold text-neutral-900">{orderNum}</span>
              </p>
              <p>
                <span className="text-neutral-400 font-medium">Invoice Date :</span>{" "}
                <span className="font-semibold text-neutral-800">{dateStr}</span>
              </p>
              <p>
                <span className="text-neutral-400 font-medium">Date Of Supply :</span>{" "}
                <span className="font-semibold text-neutral-800">{dateStr}</span>
              </p>
              <p>
                <span className="text-neutral-400 font-medium">Payment Method :</span>{" "}
                <span className="font-bold text-neutral-800 uppercase">
                  {order.paymentMethod || "cod"}
                </span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-2 px-1 w-8">No.</th>
                  <th className="py-2 px-2">Products</th>
                  <th className="py-2 px-2 text-center w-12">Qty</th>
                  <th className="py-2 px-2 text-right w-20">Unit Rate</th>
                  <th className="py-2 px-2 text-right w-20">Discount</th>
                  <th className="py-2 px-2 text-right w-16">Tax</th>
                  <th className="py-2 px-2 text-right w-20">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {order.items?.map((item: any, idx: number) => {
                  const itemPrice = Number(item.unitPrice || 0);
                  const itemQty = Number(item.quantity || 1);
                  const itemTotal = itemPrice * itemQty;
                  return (
                    <tr key={item.id || idx}>
                      <td className="py-2.5 px-1 font-semibold text-neutral-500">{idx + 1}</td>
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-neutral-900 leading-snug">
                          {item.nameSnapshot || item.product?.name || "Product"}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-semibold text-neutral-700">{itemQty}</td>
                      <td className="py-2.5 px-2 text-right text-neutral-700 font-medium">
                        {formatAmt(itemPrice)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-neutral-500">
                        {formatAmt(0)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-neutral-500">
                        {formatAmt(0)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-neutral-900">
                        {formatAmt(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary: QR Code on Left, Totals on Right */}
          <div className="flex justify-between items-end pb-6 mb-6 border-b border-neutral-100">
            {/* QR code */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white border border-neutral-200 rounded-lg p-1 flex items-center justify-center shadow-2xs">
                <img src={qrUrl} alt="Scan to Download" className="w-full h-full object-contain" />
              </div>
              <span className="text-[9px] font-bold text-neutral-400 mt-1 uppercase tracking-wider">
                Scan to Download
              </span>
            </div>

            {/* Totals Box */}
            <div className="w-64 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-neutral-600">
                <span>Total Amount Before Tax</span>
                <span className="font-semibold text-neutral-800">{formatAmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="font-semibold">-{formatAmt(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Total Tax</span>
                <span className="font-semibold text-neutral-800">{formatAmt(tax)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span className="font-semibold text-neutral-800">{formatAmt(shippingFee)}</span>
              </div>
              <div className="flex justify-between font-black text-neutral-900 pt-2 border-t border-neutral-200 text-sm">
                <span>Total</span>
                <span className="text-[#8A3FFC]">{formatAmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions & Signature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end text-[10px] text-neutral-500 leading-relaxed">
            <div>
              <p className="font-bold text-neutral-800 uppercase text-[9px] tracking-wider mb-1">
                Terms &amp; Conditions
              </p>
              <p>
                Returns are accepted for defective items within 2 days of delivery (unused, original
                packaging); shipped orders can&apos;t be canceled, delivery times may vary, and return
                requests must be approved by Customer Support at support@shanfaglobal.com or +971 04 834 7827.
              </p>
            </div>

            <div className="text-right flex flex-col items-end justify-end">
              <div className="font-serif italic text-lg font-bold text-neutral-800 tracking-wide mb-1">
                Shanfa Global
              </div>
              <div className="w-36 border-t border-neutral-300 pt-1 text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                Authorized Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
