'use client';

import React from 'react';

interface InvoiceData {
  orderNumber: string;
  orderDate: string;
  orderTime: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: {
    name: string;
    street: string;
    building: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingAddress: {
    name: string;
    street: string;
    building: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    productCode: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    itemTotal: string;
    image: string;
  }>;
  subtotal: string;
  shipping: string;
  discount: string;
  total: string;
  currency: string;
  paymentMethod: string;
  paymentStatus?: string;
  trackingCode: string;
  courier: string;
  status: string;
}

interface InvoiceTemplateProps {
  data: InvoiceData;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ data }, ref) => {
    const getStatusBadgeColor = (status: string) => {
      const colors: Record<string, string> = {
        ORDER_RECEIVED: '#f59e0b',
        ORDER_CONFIRMED: '#3b82f6',
        PROCESSING: '#8b5cf6',
        READY_FOR_PICKUP: '#10b981',
        ORDER_PICKED_UP: '#0ea5e9',
        IN_TRANSIT: '#06b6d4',
        DELIVERED: '#34d399',
        CANCELLED: '#ef4444',
        REFUNDED: '#f97316',
      };
      return colors[status] || '#6b7280';
    };

    return (
      <div
        ref={ref}
        className="w-full max-w-4xl mx-auto bg-white p-8 font-sans"
        style={{ fontSize: '14px', lineHeight: '1.6', color: '#1f2937' }}
      >
        {/* Header */}
        <div className="mb-8 pb-8 border-b-2 border-gray-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
              <p className="text-gray-500 mt-1">Professional Invoice Document</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Invoice #:</span> {data.orderNumber}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">Date:</span> {data.orderDate}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Time:</span> {data.orderTime}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-4">
            <span
              className="px-4 py-2 rounded-full text-white text-sm font-semibold"
              style={{ backgroundColor: getStatusBadgeColor(data.status) }}
            >
              {data.status.replace(/_/g, ' ')}
            </span>
            {data.trackingCode !== 'Not yet assigned' && (
              <div className="text-sm">
                <span className="text-gray-600">
                  <strong>Tracking:</strong> {data.trackingCode}
                </span>
                {data.courier !== 'Not yet assigned' && (
                  <span className="text-gray-600 ml-4">
                    <strong>Courier:</strong> {data.courier}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Customer & Addresses */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          {/* Bill To */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
              Bill To
            </h3>
            <p className="font-semibold text-gray-900">{data.billingAddress.name}</p>
            <p className="text-gray-600 text-sm mt-2">
              {data.billingAddress.street}
              {data.billingAddress.building && `, ${data.billingAddress.building}`}
            </p>
            <p className="text-gray-600 text-sm">
              {data.billingAddress.city}, {data.billingAddress.state}
            </p>
            <p className="text-gray-600 text-sm">
              {data.billingAddress.postalCode}, {data.billingAddress.country}
            </p>
            <p className="text-gray-600 text-sm mt-3">
              <strong>Email:</strong> {data.customerEmail}
            </p>
            {data.customerPhone && (
              <p className="text-gray-600 text-sm">
                <strong>Phone:</strong> {data.customerPhone}
              </p>
            )}
          </div>

          {/* Ship To */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
              Ship To
            </h3>
            <p className="font-semibold text-gray-900">{data.shippingAddress.name}</p>
            <p className="text-gray-600 text-sm mt-2">
              {data.shippingAddress.street}
              {data.shippingAddress.building && `, ${data.shippingAddress.building}`}
            </p>
            <p className="text-gray-600 text-sm">
              {data.shippingAddress.city}, {data.shippingAddress.state}
            </p>
            <p className="text-gray-600 text-sm">
              {data.shippingAddress.postalCode}, {data.shippingAddress.country}
            </p>
          </div>

          {/* Payment Info */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
              Payment Method
            </h3>
            <p className="text-gray-600 text-sm font-semibold">{data.paymentMethod}</p>
            <div className="mt-6 p-4 bg-white rounded border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
                Order Summary
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-semibold">
                    {data.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="border-b-2 border-gray-300"
                style={{ backgroundColor: '#f3f4f6' }}
              >
                <th className="text-left py-3 px-4 font-bold text-gray-900">Product</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">Code</th>
                <th className="text-center py-3 px-4 font-bold text-gray-900">Qty</th>
                <th className="text-right py-3 px-4 font-bold text-gray-900">Unit Price</th>
                <th className="text-right py-3 px-4 font-bold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-4 px-4">
                    <p className="font-semibold text-gray-900">{item.productName}</p>
                  </td>
                  <td className="py-4 px-4 text-gray-600 text-sm">
                    {item.productCode}
                  </td>
                  <td className="py-4 px-4 text-center font-semibold text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="py-4 px-4 text-right text-gray-600">
                    {data.currency} {item.unitPrice}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-gray-900">
                    {data.currency} {item.itemTotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-xs">
            <div className="border-t-2 border-gray-300 pt-4">
              {/* Subtotal */}
              <div className="flex justify-between mb-3">
                <span className="text-gray-700">Subtotal:</span>
                <span className="text-gray-900 font-semibold">
                  {data.currency} {data.subtotal}
                </span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between mb-3">
                <span className="text-gray-700">Shipping & Handling:</span>
                <span className="text-gray-900 font-semibold">
                  {data.currency} {data.shipping}
                </span>
              </div>

              {/* Discount */}
              {parseFloat(data.discount) > 0 && (
                <div className="flex justify-between mb-3">
                  <span className="text-gray-700">Discount:</span>
                  <span className="text-green-600 font-semibold">
                    -{data.currency} {data.discount}
                  </span>
                </div>
              )}

              {/* Total */}
              <div
                className="flex justify-between pt-4 px-4 rounded"
                style={{ backgroundColor: '#f0f9ff' }}
              >
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-blue-600">
                  {data.currency} {data.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 pt-8">
          <div className="text-center">
            <p className="text-gray-700 font-semibold mb-2">
              Thank you for your business!
            </p>
            <p className="text-gray-600 text-sm">
              For support, please contact our customer service team or visit our website.
            </p>
            <p className="text-gray-500 text-xs mt-4">
              This is an automatically generated invoice. Please keep this document for your records.
            </p>
            <p className="text-gray-400 text-xs mt-6">
              Generated on {new Date().toLocaleDateString()} at{' '}
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
