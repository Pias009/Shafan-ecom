import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CreateOrderForm } from '../_components/CreateOrderForm';

export default function CreateOrderPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <Link 
          href="/ueadmin/orders" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition-colors"
        >
          <ArrowLeft size={12} /> Back to Orders
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black">Create Custom Order</h1>
          <div className="text-[10px] font-black uppercase tracking-widest text-black/40 bg-black/5 px-4 py-2 rounded-full">
            Admin Fulfillment
          </div>
        </div>
        <p className="text-sm text-black/60 max-w-2xl font-medium">
          Create a manual order for a customer. Select products, enter shipping details, and the system will automatically calculate weights and totals.
        </p>
      </div>

      <CreateOrderForm />
    </div>
  );
}
