"use client";

import { useState, useEffect, useRef } from 'react';
import { Edit2, Save, X, Trash2, Plus, Minus, Search, Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const BLOCKED_STATUSES = ['IN_TRANSIT', 'ORDER_PICKED_UP', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const STATUS_LABELS: Record<string, string> = {
  IN_TRANSIT: 'In Transit',
  ORDER_PICKED_UP: 'Picked Up',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

interface ProductSearchResult {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  discountPrice?: number;
  images?: string[];
  weight?: number;
  weightUnit?: string;
  countryPrices?: { productId: string; price: number; currency: string }[];
}

function getProductPrice(product: ProductSearchResult): number {
  if (product.price) return product.price;
  if (product.discountPrice) return product.discountPrice;
  if (product.countryPrices && product.countryPrices.length > 0) {
    const valid = product.countryPrices.find(cp => cp.price > 0);
    if (valid) return valid.price;
  }
  return 0;
}

interface OrderEditorProps {
  order: any;
}

function formatPrice(amount: number, currency: string): string {
  const code = currency?.toUpperCase() || 'USD';
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  return `${code} ${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export default function OrderEditor({ order }: OrderEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [shippingAddress, setShippingAddress] = useState(order.shippingAddress || {});
  const [billingAddress, setBillingAddress] = useState(order.billingAddress || {});
  const [items, setItems] = useState(order.items || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState<ProductSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const isBlocked = BLOCKED_STATUSES.includes(order.status);

  useEffect(() => {
    if (isEditing && allProducts.length === 0) {
      setLoadingProducts(true);
      fetch('/api/admin/products?select=name,id,sku,price,images,weight,weightUnit')
        .then(res => res.ok ? res.json() : [])
        .then(data => setAllProducts(data))
        .catch(() => {})
        .finally(() => setLoadingProducts(false));
    }
  }, [isEditing, allProducts.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = searchTerm.trim()
    ? allProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 20)
    : [];

  const addProductToOrder = (product: ProductSearchResult) => {
    const existingIndex = items.findIndex((item: any) =>
      item.productId === product.id || item.id === product.id
    );
    if (existingIndex >= 0) {
      setItems(items.map((item: any, i: number) =>
        i === existingIndex ? { ...item, quantity: (item.quantity || 0) + 1 } : item
      ));
    } else {
      setItems([...items, {
        productId: product.id,
        nameSnapshot: product.name,
        imageSnapshot: product.images?.[0] || '',
        unitPrice: getProductPrice(product),
        quantity: 1,
        weightSnapshot: product.weight || 0,
        weightUnitSnapshot: product.weightUnit || 'kg',
      }]);
    }
    setSearchTerm('');
    setShowSearch(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_: any, i: number) => i !== index));
  };

  const updateItemQuantity = (index: number, delta: number) => {
    setItems(items.map((item: any, i: number) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateItemPrice = (index: number, price: number) => {
    setItems(items.map((item: any, i: number) => {
      if (i === index) {
        return { ...item, unitPrice: Math.max(0, isNaN(price) ? 0 : price) };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum: number, item: any) =>
    sum + ((item.unitPrice || 0) * (item.quantity || 0)), 0
  );
  const discountAmount = order.discountAmount || 0;
  const shippingCost = order.shipping || 0;
  const taxAmount = order.taxAmount || 0;
  const grandTotal = subtotal + shippingCost - discountAmount + taxAmount;

  const handleSave = async () => {
    setLoading(true);
    try {
      const originalIds = new Set((order.items || []).map((item: any) => item.id).filter(Boolean));
      const currentIds = new Set(items.map((item: any) => item.id).filter(Boolean));
      const deletedItemIds = [...originalIds].filter(id => !currentIds.has(id));

      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress,
          billingAddress,
          items,
          subtotal,
          total: grandTotal,
          deletedItemIds,
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
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (isBlocked) {
    return (
      <div className="flex items-center gap-2 bg-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full cursor-not-allowed shadow-xl" title={`Cannot edit - order is ${STATUS_LABELS[order.status] || order.status}`}>
        <AlertTriangle size={14} /> Edit Order Details
      </div>
    );
  }

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
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl border border-black/5 p-8 md:p-12">
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-black/30 border-b border-black/5 pb-2 flex items-center gap-2">
                <Package size={16} /> Order Items & Quantities
              </h3>
              <div className="text-xs font-bold text-black/30">
                {order.currency} &middot; {items.length} item{items.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Product Search */}
            <div ref={searchRef} className="relative mb-6">
              <div className="flex items-center gap-3 bg-black/[0.03] border border-black/10 rounded-2xl px-5 py-3 focus-within:ring-2 focus-within:ring-black/20 transition">
                <Search size={18} className="text-black/30 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search products to add to order..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
                  className="w-full bg-transparent border-none outline-none text-sm font-bold text-black placeholder:text-black/20"
                />
                {loadingProducts && <span className="text-xs text-black/30 font-bold">Loading...</span>}
              </div>
              {showSearch && searchTerm.trim() && (
                <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-white rounded-2xl border border-black/10 shadow-2xl max-h-72 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-5 text-center text-xs font-bold text-black/30">No products found</div>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addProductToOrder(product)}
                        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-black/5 transition text-left border-b border-black/5 last:border-b-0"
                      >
                        <div className="w-10 h-10 rounded-lg bg-black/10 overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-black/20"><Package size={16} /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-black truncate">{product.name}</div>
                          {product.sku && <div className="text-[10px] font-bold text-black/30 uppercase">SKU: {product.sku}</div>}
                        </div>
                        <div className="text-xs font-black text-black/50">{formatPrice(getProductPrice(product), order.currency)}</div>
                        <Plus size={16} className="text-black/30 flex-shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Current Items */}
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="p-8 text-center text-sm font-bold text-black/30 bg-black/[0.02] rounded-2xl border border-dashed border-black/10">
                  No items in this order. Search and add products above.
                </div>
              ) : (
                items.map((item: any, index: number) => (
                  <div key={item.id || `new-${index}`} className="flex items-center gap-4 p-4 glass-panel rounded-2xl border border-black/5 bg-black/[0.02]">
                    <div className="w-14 h-14 rounded-xl bg-black/10 overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageSnapshot || item.product?.images?.[0]}
                        alt={item.nameSnapshot || item.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-black truncate">{item.nameSnapshot || item.product?.name}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <div className="flex items-center gap-2 bg-white rounded-full border border-black/10 p-0.5">
                          <button
                            onClick={() => updateItemQuantity(index, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 transition"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="font-black text-xs w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(index, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 transition"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-[10px] font-bold text-black/30">&times;</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-black/40">{order.currency}</span>
                          <input
                            type="number"
                            value={item.unitPrice || 0}
                            onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-white border border-black/10 rounded-lg px-2 py-1 text-xs font-black text-black text-right focus:ring-2 focus:ring-black outline-none"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <span className="text-xs font-black text-black/60">
                          = {formatPrice((item.unitPrice || 0) * (item.quantity || 0), order.currency)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 hover:bg-red-50 rounded-full transition text-black/20 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="mt-6 ml-auto w-full max-w-sm space-y-2 bg-black/[0.02] rounded-2xl p-5 border border-black/5">
              <div className="flex justify-between text-xs font-bold text-black/50">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-black/50">
                <span>Shipping</span>
                <span>{formatPrice(shippingCost, order.currency)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs font-bold text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discountAmount, order.currency)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-xs font-bold text-orange-600">
                  <span>VAT ({(order.taxRate * 100).toFixed(0)}%)</span>
                  <span>{formatPrice(taxAmount, order.currency)}</span>
                </div>
              )}
              <div className="border-t border-black/10 pt-2 flex justify-between text-sm font-black text-black">
                <span>Total</span>
                <span>{formatPrice(grandTotal, order.currency)}</span>
              </div>
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
