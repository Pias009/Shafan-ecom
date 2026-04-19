"use client";

import { useState } from 'react';
import { Edit2, Save, X, Trash2, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface OrderEditorProps {
  order: any;
}

export default function OrderEditor({ order }: OrderEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState(order.shippingAddress || {});
  const [billingAddress, setBillingAddress] = useState(order.billingAddress || {});
  const [items, setItems] = useState(order.items || []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Calculate new totals
      const newSubtotal = items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
      const discountAmount = order.discountAmount || 0;
      const shippingCost = order.shipping || 0;
      const newTotal = newSubtotal + shippingCost - discountAmount;

      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress,
          billingAddress,
          items,
          subtotal: newSubtotal,
          total: newTotal
        })
      });

      if (res.ok) {
        toast.success('Order updated successfully');
        setIsEditing(false);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update order');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = (id: string, delta: number) => {
    setItems(items.map((item: any) => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  if (!isEditing) {
    return (
      <button 
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 bg-black text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full hover:scale-105 transition active:scale-95 shadow-xl"
      >
        <Edit2 size={14} /> Edit Order Details
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-black/5 p-8 md:p-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-black">Edit Order</h2>
            <p className="text-xs font-bold text-black/40 uppercase tracking-widest mt-1">Order #{order.id?.slice(-8)?.toUpperCase()}</p>
          </div>
          <button onClick={() => setIsEditing(false)} className="p-3 bg-black/5 rounded-full hover:bg-black/10 transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-10">
          {/* Items Section */}
          <section>
            <h3 className="text-sm font-black uppercase tracking-widest text-black/30 mb-6 border-b border-black/5 pb-2 flex items-center gap-2">
               Order Items & Quantities
            </h3>
            <div className="space-y-4">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-4 glass-panel rounded-2xl border border-black/5 bg-black/[0.02]">
                  <div className="w-12 h-12 rounded-xl bg-black/10 overflow-hidden flex-shrink-0">
                    <img 
                      src={item.imageSnapshot || item.product?.images?.[0]} 
                      alt={item.nameSnapshot || item.product?.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-black truncate">{item.nameSnapshot || item.product?.name}</div>
                    <div className="text-[10px] font-bold text-black/40 uppercase mt-0.5">{order.currency} {item.unitPrice.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-full border border-black/10 p-1">
                    <button 
                      onClick={() => updateItemQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-black text-sm w-8 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateItemQuantity(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Shipping Address */}
          <section className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-black/30 mb-6 border-b border-black/5 pb-2">
                Shipping Address
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 ml-2">First Name</label>
                    <input 
                      type="text" 
                      value={shippingAddress.first_name || ''} 
                      onChange={(e) => setShippingAddress({...shippingAddress, first_name: e.target.value})}
                      className="w-full bg-black/[0.03] border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 ml-2">Last Name</label>
                    <input 
                      type="text" 
                      value={shippingAddress.last_name || ''} 
                      onChange={(e) => setShippingAddress({...shippingAddress, last_name: e.target.value})}
                      className="w-full bg-black/[0.03] border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 ml-2">Email (Gmail)</label>
                  <input 
                    type="email" 
                    value={shippingAddress.email || ''} 
                    onChange={(e) => setShippingAddress({...shippingAddress, email: e.target.value})}
                    className="w-full bg-black/[0.03] border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 ml-2">Phone (Number)</label>
                  <input 
                    type="text" 
                    value={shippingAddress.phone || ''} 
                    onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                    className="w-full bg-black/[0.03] border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 ml-2">Address Line 1</label>
                  <input 
                    type="text" 
                    value={shippingAddress.address_1 || ''} 
                    onChange={(e) => setShippingAddress({...shippingAddress, address_1: e.target.value})}
                    className="w-full bg-black/[0.03] border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 ml-2">City</label>
                  <input 
                    type="text" 
                    value={shippingAddress.city || ''} 
                    onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                    className="w-full bg-black/[0.03] border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-black/30 mb-6 border-b border-black/5 pb-2">
                Billing Address
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 ml-2">First Name</label>
                    <input 
                      type="text" 
                      value={billingAddress.first_name || ''} 
                      onChange={(e) => setBillingAddress({...billingAddress, first_name: e.target.value})}
                      className="w-full bg-black/[0.03] border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 ml-2">Last Name</label>
                    <input 
                      type="text" 
                      value={billingAddress.last_name || ''} 
                      onChange={(e) => setBillingAddress({...billingAddress, last_name: e.target.value})}
                      className="w-full bg-black/[0.03] border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 ml-2">Email</label>
                  <input 
                    type="email" 
                    value={billingAddress.email || ''} 
                    onChange={(e) => setBillingAddress({...billingAddress, email: e.target.value})}
                    className="w-full bg-black/[0.03] border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 ml-2">Phone</label>
                  <input 
                    type="text" 
                    value={billingAddress.phone || ''} 
                    onChange={(e) => setBillingAddress({...billingAddress, phone: e.target.value})}
                    className="w-full bg-black/[0.03] border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 ml-2">Address Line 1</label>
                  <input 
                    type="text" 
                    value={billingAddress.address_1 || ''} 
                    onChange={(e) => setBillingAddress({...billingAddress, address_1: e.target.value})}
                    className="w-full bg-black/[0.03] border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 ml-2">City</label>
                  <input 
                    type="text" 
                    value={billingAddress.city || ''} 
                    onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                    className="w-full bg-black/[0.03] border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 flex items-center justify-end gap-4 border-t border-black/5 pt-8">
          <button 
            onClick={() => setIsEditing(false)}
            className="px-8 py-4 text-xs font-black uppercase tracking-widest text-black/40 hover:text-black transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-black text-white text-xs font-black uppercase tracking-widest px-10 py-4 rounded-full hover:scale-105 transition active:scale-95 shadow-2xl shadow-black/20 disabled:opacity-50"
          >
            {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
