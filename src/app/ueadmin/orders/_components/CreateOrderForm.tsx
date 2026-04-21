"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Minus, Trash2, User, Mail, Phone, MapPin, Package, CreditCard, Loader2, Scale, Box, Check } from 'lucide-react';
import { useMemo } from 'react';
import { COUNTRY_CONFIG } from '@/lib/address-config';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  mainImage: string | null;
  price: number;
  weight: number;
  weightUnit: string;
  countryPrices: { country: string; price: number; currency: string }[];
}

interface SelectedItem {
  product: Product;
  quantity: number;
  price: number;
}

export function CreateOrderForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("AE");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  
  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    country: "AE"
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING">("PENDING");
  const [shippingFee, setShippingFee] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{ code: string; type: string; discount: number; maxLimitAmount?: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Fetch products on mount or search
  useEffect(() => {
    const fetchProducts = async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/products?select=id,name,sku,mainImage,price,weight,weightUnit,countryPrices`);
        if (res.ok) {
          const data = await res.json();
          // The API might return different structure depending on implementation
          // Let's assume it returns Product objects
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setSearching(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addItem = (product: Product) => {
    const existing = selectedItems.find(item => item.product.id === product.id);
    
    // Get price for selected country
    const countryPrice = product.countryPrices?.find(cp => cp.country === selectedCountry);
    const price = countryPrice && countryPrice.price ? countryPrice.price : (product.price || 0);

    if (price <= 0) {
      toast.error(`Product ${product.name} does not have a price for ${selectedCountry}. Please set a price first.`);
      return;
    }

    if (existing) {
      setSelectedItems(selectedItems.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { product, quantity: 1, price }]);
    }
    toast.success(`Added ${product.name}`);
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = selectedItems.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0);
  
  // Automate shipping fee based on subtotal and country config
  useEffect(() => {
    const config = COUNTRY_CONFIG[selectedCountry];
    if (config) {
      if (subtotal >= config.freeDelivery) {
        setShippingFee(0);
      } else {
        setShippingFee(config.deliveryFee);
      }
    }
  }, [subtotal, selectedCountry]);

  const discountAmount = useMemo(() => {
    if (!discountInfo) return 0;
    let amount = 0;
    if (discountInfo.type === "PERCENTAGE") {
      amount = subtotal * discountInfo.discount;
      if (discountInfo.maxLimitAmount && amount > discountInfo.maxLimitAmount) {
        amount = discountInfo.maxLimitAmount;
      }
    } else if (discountInfo.type === "FIXED_AMOUNT") {
      amount = discountInfo.discount;
    } else if (discountInfo.type === "FREE_SHIPPING") {
      amount = 0; // Handled separately if needed, but usually it just zeros out shipping
    }
    return amount;
  }, [subtotal, discountInfo]);

  const preTaxTotal = subtotal + (discountInfo?.type === "FREE_SHIPPING" ? 0 : Number(shippingFee)) - discountAmount;
  const taxRate = COUNTRY_CONFIG[selectedCountry]?.taxRate || 0;
  const taxAmount = Math.round(preTaxTotal * taxRate * 100) / 100;
  const finalTotal = preTaxTotal + taxAmount;

  const totalWeight = selectedItems.reduce((acc, item) => {
    const weight = item.product.weight || 0;
    const itemWeight = item.product.weightUnit === 'g' ? weight / 1000 : weight;
    return acc + (itemWeight * item.quantity);
  }, 0);

  const applyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    try {
      const res = await fetch(`/api/coupons/validate?code=${couponCode}&country=${selectedCountry}`);
      const data = await res.json();
      if (data.valid) {
        setDiscountInfo(data);
        toast.success(`Coupon ${couponCode} applied!`);
      } else {
        toast.error(data.error || "Invalid coupon");
        setDiscountInfo(null);
      }
    } catch (err) {
      toast.error("Failed to validate coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please add at least one product");
      return;
    }
    if (!customer.firstName || !customer.lastName || !customer.email || !customer.phone || !customer.address1 || !customer.city) {
      toast.error("Please fill in all required customer fields");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items: selectedItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price
        })),
        billing: {
          fullName: `${customer.firstName} ${customer.lastName}`.trim(),
          email: customer.email,
          phone: customer.phone,
          address1: customer.address1,
          address2: customer.address2,
          city: customer.city,
          state: customer.state,
          postalCode: customer.postcode,
          country: customer.country
        },
        shipping: {
          fullName: `${customer.firstName} ${customer.lastName}`.trim(),
          email: customer.email,
          phone: customer.phone,
          address1: customer.address1,
          address2: customer.address2,
          city: customer.city,
          state: customer.state,
          postalCode: customer.postcode,
          country: customer.country
        },
        payment_method: paymentMethod,
        payment_method_title: 
          paymentMethod === 'cod' ? 'Cash on Delivery' : 
          paymentMethod === 'card' ? 'Credit Card' : 
          paymentMethod === 'tabby' ? 'Tabby' : 
          paymentMethod === 'tamara' ? 'Tamara' : 
          paymentMethod === 'apple_pay' ? 'Apple Pay' : 
          paymentMethod === 'google_pay' ? 'Google Pay' : 'Other',
        payment_status: paymentStatus,
        country: selectedCountry,
        subtotal,
        total: finalTotal,
        shippingFee: Number(shippingFee),
        discountAmount: discountAmount,
        couponCode: discountInfo?.code || null
      };

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Order created successfully!");
        router.push(`/ueadmin/orders/${data.orderId}`);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create order");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 pb-20">
      {/* Configuration Header */}
      <div className="lg:col-span-12">
        <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm flex flex-wrap items-center gap-8">
           <div className="space-y-1.5 min-w-[200px]">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2 flex items-center gap-2">
                <MapPin size={12} /> Target Country
              </label>
              <select
                value={selectedCountry}
                onChange={e => {
                  if (selectedItems.length > 0) {
                    if (confirm("Changing country will clear selected items as prices may differ. Continue?")) {
                      setSelectedCountry(e.target.value);
                      setSelectedItems([]);
                      setDiscountInfo(null);
                    }
                  } else {
                    setSelectedCountry(e.target.value);
                  }
                }}
                className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
              >
                <option value="AE">UAE</option>
                <option value="SA">Saudi Arabia</option>
                <option value="KW">Kuwait</option>
                <option value="BH">Bahrain</option>
                <option value="OM">Oman</option>
                <option value="QA">Qatar</option>
              </select>
           </div>

           <div className="space-y-1.5 flex-1 min-w-[250px]">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2 flex items-center gap-2">
                <Package size={12} /> Apply Coupon
              </label>
              <div className="flex gap-2">
                <input 
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="COUPON10"
                />
                <button 
                  onClick={applyCoupon}
                  disabled={validatingCoupon || !couponCode}
                  className="bg-black text-white px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {validatingCoupon ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                </button>
              </div>
              {discountInfo && (
                <div className="px-2 text-[9px] font-bold text-green-600 flex items-center gap-1 mt-1">
                   <Check size={10} /> {discountInfo.code} Applied ({discountInfo.type === 'PERCENTAGE' ? `${(discountInfo.discount * 100).toFixed(0)}%` : 'Fixed'})
                   <button onClick={() => setDiscountInfo(null)} className="text-red-500 hover:underline ml-2">Remove</button>
                </div>
              )}
           </div>
        </section>
      </div>

      <div className="lg:col-span-8 space-y-8">
        {/* Customer Information */}
        <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
            <User size={14} /> Customer Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">First Name</label>
              <input 
                value={customer.firstName}
                onChange={e => setCustomer({...customer, firstName: e.target.value})}
                className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="John"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Last Name</label>
              <input 
                value={customer.lastName}
                onChange={e => setCustomer({...customer, lastName: e.target.value})}
                className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Email</label>
              <div className="relative">
                <input 
                  type="email"
                  value={customer.email}
                  onChange={e => setCustomer({...customer, email: e.target.value})}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="john@example.com"
                />
                <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-black/20" size={16} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Phone</label>
              <div className="relative">
                <input 
                  value={customer.phone}
                  onChange={e => setCustomer({...customer, phone: e.target.value})}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="+971 50 123 4567"
                />
                <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-black/20" size={16} />
              </div>
            </div>
          </div>
        </section>

        {/* Shipping Address */}
        <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
            <MapPin size={14} /> Shipping Address
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Address Line 1</label>
              <input 
                value={customer.address1}
                onChange={e => setCustomer({...customer, address1: e.target.value})}
                className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="Street address, P.O. box"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Address Line 2 (Optional)</label>
              <input 
                value={customer.address2}
                onChange={e => setCustomer({...customer, address2: e.target.value})}
                className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">City</label>
                <input 
                  value={customer.city}
                  onChange={e => setCustomer({...customer, city: e.target.value})}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="Dubai"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">State / Emirate</label>
                <input 
                  value={customer.state}
                  onChange={e => setCustomer({...customer, state: e.target.value})}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="Dubai"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Postcode</label>
                <input 
                  value={customer.postcode}
                  onChange={e => setCustomer({...customer, postcode: e.target.value})}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="00000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Country</label>
                <select
                  value={customer.country}
                  onChange={e => {
                    setCustomer({...customer, country: e.target.value});
                    setSelectedCountry(e.target.value);
                  }}
                  className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black outline-none appearance-none cursor-pointer"
                >
                  <option value="AE">UAE</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="KW">Kuwait</option>
                  <option value="BH">Bahrain</option>
                  <option value="OM">Oman</option>
                  <option value="QA">Qatar</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Product Selection */}
        <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
              <Package size={14} /> Selected Products
            </h3>
            <div className="flex items-center gap-2 bg-black/5 px-4 py-2 rounded-full">
              <Scale size={14} className="text-black/40" />
              <span className="text-[10px] font-black uppercase tracking-widest text-black/60">Total Weight: {totalWeight.toFixed(2)} KG</span>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {selectedItems.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 text-center border-2 border-dashed border-black/5 rounded-[2rem]"
                >
                  <Box className="mx-auto text-black/10 mb-4" size={40} />
                  <p className="text-sm font-bold text-black/30">No products selected yet</p>
                </motion.div>
              ) : (
                selectedItems.map((item) => (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-4 p-4 bg-black/5 rounded-2xl group"
                  >
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-black/5 relative shrink-0">
                      {item.product.mainImage && (
                        <Image src={item.product.mainImage} alt={item.product.name} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-black truncate">{item.product.name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/30">
                        {item.product.sku || 'No SKU'} • {item.product.weight} {item.product.weightUnit}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-full px-3 py-1.5 border border-black/5">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="text-black/40 hover:text-black transition">
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-black min-w-[20px] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="text-black/40 hover:text-black transition">
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <div className="text-sm font-black">{selectedCountry} {((item.price || 0) * item.quantity).toFixed(2)}</div>
                      <div className="text-[9px] font-bold text-black/40">{(item.price || 0).toFixed(2)} / unit</div>
                    </div>
                    <button 
                      onClick={() => removeItem(item.product.id)}
                      className="p-2 text-black/20 hover:text-red-500 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <div className="lg:col-span-4 space-y-8">
        {/* Product Search Panel */}
        <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
            <Search size={14} /> Search Products
          </h3>
          
          <div className="relative">
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/5 border-none rounded-2xl px-5 py-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
              placeholder="Search by name or SKU..."
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-black/20" size={16} />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {searching ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-black/20" /></div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center py-8 text-xs font-bold text-black/20">No products found</p>
            ) : (
              filteredProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => addItem(p)}
                  className="w-full flex items-center gap-3 p-3 bg-black/[0.02] hover:bg-black/5 rounded-xl transition-all text-left group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border border-black/5 relative shrink-0">
                    {p.mainImage && <Image src={p.mainImage} alt={p.name} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-black truncate group-hover:text-black transition-colors">{p.name}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-black/30">
                      {p.sku || 'No SKU'} • {p.weight} {p.weightUnit}
                    </div>
                  </div>
                  <Plus size={14} className="text-black/20 group-hover:text-black transition-colors" />
                </button>
              ))
            )}
          </div>
        </section>

        {/* Order Summary */}
        <section className="glass-panel-heavy p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm space-y-6 sticky top-8">
          <h3 className="text-sm font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
            <CreditCard size={14} /> Order Summary
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-black/40">
              <span>Subtotal</span>
              <span className="text-black">{selectedCountry} {(subtotal || 0).toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-green-600">
                <span>Discount ({discountInfo?.code})</span>
                <span>-{selectedCountry} {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-black/40">
              <span>Shipping</span>
              <span className={Number(shippingFee) === 0 ? "text-green-600" : "text-black"}>
                {Number(shippingFee) === 0 ? "FREE" : `${selectedCountry} ${Number(shippingFee).toFixed(2)}`}
              </span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-orange-600">
                <span>VAT ({(taxRate * 100).toFixed(0)}%)</span>
                <span>{selectedCountry} {taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-4 border-t border-black/5 flex justify-between items-center">
              <span className="text-sm font-black uppercase tracking-widest">Total</span>
              <span className="text-2xl font-black">{selectedCountry} {(finalTotal || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Payment Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setPaymentStatus("PENDING");
                    setPaymentMethod("cod");
                  }}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentStatus === 'PENDING' ? 'bg-black text-white shadow-lg' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                >
                  Pending / COD
                </button>
                <button
                  onClick={() => setPaymentStatus("PAID")}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentStatus === 'PAID' ? 'bg-black text-white shadow-lg' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                >
                  Paid
                </button>
              </div>
            </div>

            {paymentStatus === "PAID" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'card', label: 'Credit Card' },
                    { id: 'tabby', label: 'Tabby' },
                    { id: 'tamara', label: 'Tamara' },
                    { id: 'apple_pay', label: 'Apple Pay' },
                    { id: 'google_pay', label: 'Google Pay' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === method.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || selectedItems.length === 0}
            className="w-full bg-black text-white py-5 rounded-full text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Box size={16} />}
            {loading ? 'Creating Order...' : 'Create Order Now'}
          </button>
        </section>
      </div>
    </div>
  );
}
