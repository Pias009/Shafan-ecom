"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ticket, Copy, CheckCircle, Calendar, Sparkles, ShoppingBag, Zap } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useCartStore } from "@/lib/cart-store";
import { useUserCountry } from "@/lib/country-detection";
import toast from "react-hot-toast";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: string;
  value: number;
  endDate?: Date;
}

export function OffersClient({ products, coupons }: { products: any[], coupons: Coupon[] }) {
  const [quickView, setQuickView] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { addItem, hasAddress } = useCartStore();
  const router = useRouter();
  const userCountry = useUserCountry();

  function addToCart(product: any) {
    const cartItem = {
      id: product.id,
      name: product.name,
      brand: product.brandName,
      category: product.categoryName,
      price: product.price,
      discountPrice: product.discountPrice || undefined,
      imageUrl: product.imageUrl,
      countryPrices: product.countryPrices,
    };
    addItem(cartItem, 1);
    toast.success(`${product.name} added to cart`);
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Promo code copied!");
    setTimeout(() => setCopiedCode(null), 3000);
  };

  async function orderNow(product: any) {
    if (!hasAddress) {
      toast.error("Please add a delivery address first", { duration: 3000 });
      router.push("/account/address");
      return;
    }

    const tid = toast.loading("Preparing your order...");
    try {
      const countryPrice = product.countryPrices?.find((cp: any) =>
        cp.country.toUpperCase() === userCountry.toUpperCase()
      );
      const unitPrice = countryPrice && Number(countryPrice.price) > 0
        ? Number(countryPrice.price)
        : (product.discountPrice ?? product.price);

      let billing = null;
      let shipping = null;

      try {
        const addressRes = await fetch("/api/account/address");
        if (addressRes.ok) {
          const addressData = await addressRes.json();
          if (addressData) {
            billing = addressData;
            shipping = addressData;
          }
        }
      } catch (e) {}

      if (!billing) {
        const guestStr = localStorage.getItem('guest_address');
        if (guestStr) {
          try {
            const guestData = JSON.parse(guestStr);
            billing = guestData;
            shipping = guestData;
          } catch (e) {}
        }
      }

      if (!billing) {
        toast.error("Please provide your shipping address", { id: tid });
        router.push("/account/address");
        return;
      }

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: [{ 
            productId: product.id, 
            quantity: 1,
            unitPrice,
            price: unitPrice
          }],
          country: userCountry,
          billing,
          shipping
        }),
      });
      const data = await res.json();
      if (data.orderId) {
        toast.success("Order initiated!", { id: tid });
        router.push(`/checkout/payment/${data.orderId}`);
      } else {
        throw new Error(data.error || "Order creation failed");
      }
    } catch (err: any) {
      toast.error(err.message, { id: tid });
      addToCart(product);
      router.push("/cart");
    }
  }

  return (
    <main className="min-h-screen bg-[#fdfaf5]">
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Glass Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-black flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} /> Exclusive Offers
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Premium Beauty Deals</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-black/30">Active Deals</span>
                <span className="text-sm font-black text-black">{products.length} Products</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <section className="relative overflow-hidden pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          {/* Coupons Section */}
          {coupons.length > 0 && (
            <div className="mb-20">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/10">
                  <Ticket size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Active Promo Codes</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Apply these at checkout</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                  <div 
                    key={coupon.id} 
                    className="group relative bg-white rounded-[2.5rem] border border-black/5 p-1 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500"
                  >
                    <div className="bg-black text-white rounded-[2.2rem] p-8 h-full flex flex-col justify-between overflow-hidden relative">
                      {/* Decorative elements */}
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                            Verified Coupon
                          </span>
                          {coupon.endDate && (
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/50 uppercase">
                              <Calendar size={12} />
                              {new Date(coupon.endDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <h3 className="text-3xl font-black tracking-tighter mb-2 leading-tight">
                          {coupon.description}
                        </h3>
                      </div>

                      <div className="mt-8 pt-8 border-t border-white/10">
                        <div className="flex items-center justify-between bg-white/5 rounded-2xl p-3 border border-white/5">
                          <span className="text-xl font-black tracking-[0.2em] pl-2">{coupon.code}</span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                              copiedCode === coupon.code 
                                ? "bg-green-500 text-white" 
                                : "bg-white text-black hover:scale-105 active:scale-95"
                            }`}
                          >
                            {copiedCode === coupon.code ? (
                              <><CheckCircle size={14} /> Copied</>
                            ) : (
                              <><Copy size={14} /> Copy</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured Products */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                <ShoppingBag size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Flash Sale Products</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">Limited quantity available</p>
              </div>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <div key={product.id} className="relative group">
                  <ProductCard
                    product={{
                      ...product,
                      price: product.price,
                      discountPrice: product.discountPrice || undefined,
                    }}
                    onQuickView={(p) => setQuickView(p)}
                    onAddToCart={(p) => addToCart(p)}
                    onOrderNow={(p) => orderNow(p)}
                  />
                  {/* Premium Badge Wrapper */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-black text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl">
                      <Zap size={10} className="fill-amber-400 text-amber-400" />
                      Save {product.discountPercentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] border border-black/5 p-20 text-center shadow-xl shadow-black/[0.02]">
              <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6 text-black/20">
                <ShoppingBag size={40} />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-black mb-4">No Active Offers</h2>
              <p className="text-black/40 font-bold uppercase text-xs tracking-widest max-w-sm mx-auto mb-10">
                We're currently preparing new exclusive deals for you. Check back very soon!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-3 bg-black text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl shadow-black/20"
              >
                Explore Collection <ArrowLeft size={16} className="rotate-180" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Premium Trust Section */}
      <section className="bg-black text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: ShieldCheck, title: "Authentic Only", desc: "Every product is sourced directly from certified brand partners." },
              { icon: Truck, title: "Swift Delivery", desc: "Priority shipping across the region with live order tracking." },
              { icon: Heart, title: "Skin First", desc: "Expertly curated selections tailored to your unique skin concerns." }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                  <item.icon size={32} className="text-white/80" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest mb-3">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductQuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => addToCart(p)}
        onOrderNow={(p) => orderNow(p)}
        onMoreDetails={(productId) => { setQuickView(null); router.push(`/products/${productId}`); }}
      />
    </main>
  );
}

// Helper icons that were missing
function ShieldCheck(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
  )
}

function Truck(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
  )
}

function Heart(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
  )
}
