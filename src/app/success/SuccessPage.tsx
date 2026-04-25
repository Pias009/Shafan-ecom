'use client';

import { useEffect } from 'react';
import { fbEvent, generateEventId } from '@/lib/fpixel';

export default function SuccessPage({ orderData }: { orderData: { orderId: string; totalAmount: number; items: Array<{ _id: string }> } }) {
  useEffect(() => {
    if (orderData) {
      const eventId = generateEventId(orderData.orderId);
      
      fbEvent('Purchase', {
        value: orderData.totalAmount,
        currency: 'SAR',
        content_ids: orderData.items.map((item) => item._id),
        content_type: 'product',
        num_items: orderData.items.length,
      }, { eventId });
    }
  }, [orderData]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">Thank you for your purchase!</h1>
      <p>Order ID: {orderData.orderId}</p>
    </div>
  );
}