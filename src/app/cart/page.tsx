"use client";

import { useCartStore } from "@/lib/cart-store";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2, Info } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Price } from "@/components/Price";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useUserCountry } from "@/lib/country-detection";

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

function CartContent({ items, removeItem, updateQuantity, couponCode, couponDiscount, removeCoupon, subtotalCents, discountCents, totalCents, shippingCents, freeDelivery, t, userCountry, applyCoupon }: any) {
  const router = useRouter();
  const hasAddress = useCartStore(state => state.hasAddress);
  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    const result = await applyCoupon(couponInput);
    if (result.success) {
      toast.success(t.cart.couponApplied);
      setCouponInput("");
    } else {
      toast.error(result.error || t.cart.invalidCoupon);
    }
    setApplyingCoupon(false);
  }

  async function handleCheckout() {
    if (!hasAddress) {
      toast.error(t.cart.addressRequired, {
        duration: 4000,
        icon: "📍",
      });
      router.push("/account/address");
      return;
    }
    
    toast.loading(t.cart.creatingOrder, { id: "checkout" });
    
    try {
      // Fetch user's saved address
      const addressRes = await fetch("/api/account/address");
      let billing = null;
      let shipping = null;
      
      if (addressRes.ok) {
        const addressData = await addressRes.json();
        if (addressData) {
          // Use the same address for both billing and shipping
          billing = addressData;
          shipping = addressData;
        }
      }

      // Calculate prices matching cart summary calculation
      const orderItems = items.map((i: any) => {
        const countryPrice = i.countryPrices?.find((cp: any) =>
          cp.country.toUpperCase() === userCountry.toUpperCase()
        );
        const unitPriceCents = countryPrice && countryPrice.priceCents > 0
          ? countryPrice.priceCents
          : (i.discountPrice ?? i.price) * 100;
        return {
          productId: i.id,
          quantity: i.quantity,
          unitPriceCents
        };
      });
      
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          couponCode,
          billing,
          shipping,
          payment_method: "stripe",
          payment_method_title: "Credit Card (Stripe)",
          country: userCountry
        }),
      });
      
      const data = await orderRes.json();
      if (data.orderId) {
        toast.success("Order created!", { id: "checkout" });
        router.push(`/checkout/payment/${data.orderId}`);
      } else {
        toast.error(data.error || "Checkout failed", { id: "checkout" });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout failed", { id: "checkout" });
    }
  }

  return (
    <div className="pt-24 md:pt-32 pb-20 px-4 md:px-6 max-w-6xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-body text-[10px] md:text-xs font-black uppercase tracking-widest text-black/30 hover:text-black transition-colors mb-6 md:mb-8"
      >
        <ArrowLeft size={14} className="md:w-4 md:h-4" /> {t.cart.continueShopping}
      </Link>

      <h1 className="font-display text-4xl md:text-5xl font-black text-black mb-2 tracking-tight">{t.cart.title}</h1>
      <p className="font-body text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-black/30 mb-8 md:mb-12">
        {items.reduce((acc: number, i: any) => acc + i.quantity, 0)} {t.cart.itemsInBag}
      </p>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          {items.map((item: any, idx: number) => {
            const price = item.discountPrice ?? item.price;
            const itemKey = item.id || `item-${idx}`;
            return (
              <div
                key={itemKey}
                className="glass-panel-heavy flex flex-row items-center gap-4 md:gap-6 rounded-2xl md:rounded-3xl p-3 md:p-5 border border-black/5 shadow-sm group hover:shadow-md transition-shadow"
              >
                <div className="relative h-20 w-20 md:h-32 md:w-32 shrink-0 overflow-hidden rounded-xl md:rounded-2xl bg-black/[0.02] border border-black/5">
                  <Image src={isValidImageUrl(item.imageUrl) ? item.imageUrl : "/placeholder-product.png"} alt={item.name || "Product image"} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div className="flex flex-1 flex-col justify-center min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-body text-[8px] md:text-[10px] font-black uppercase tracking-widest text-black/30 truncate">{item.brand}</div>
                      <h3 className="font-display text-base md:text-xl font-bold text-black leading-tight line-clamp-1">
                        {item.name}
                      </h3>
                    </div>
                    <Price
                      amount={price}
                      countryPrices={item.countryPrices}
                      className="font-body font-black text-black text-sm md:text-lg shrink-0"
                    />
                    <span className="text-xs">×{item.quantity}</span>
                  </div>

                  <div className="mt-4 md:mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4 glass-panel rounded-full px-3 md:px-4 py-1.5 md:py-2 border border-black/5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      </button>
                      <span className="w-4 md:w-6 text-center font-body text-xs md:text-sm font-black text-black">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition"
                      >
                        <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        removeItem(item.id);
                        toast.success(`Removed ${item.name}`);
                      }}
                      className="text-black/20 hover:text-red-500 transition flex items-center gap-2 p-2 font-body text-[8px] md:text-[10px] font-black uppercase tracking-widest"
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">{t.cart.removeItem}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-4">
          <div className="glass-panel-heavy lg:sticky lg:top-32 rounded-3xl p-6 md:p-8 border border-black/5 shadow-2xl bg-white/50 backdrop-blur-md">
            <h3 className="font-black text-xl md:text-2xl text-black mb-6 md:mb-8">{t.cart.summary}</h3>

            <div className="space-y-4 pt-1">
              {/* Coupon Input */}
              {!couponCode && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder={t.cart.enterCoupon || "Enter coupon code"}
                    className="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-black/10 rounded-lg focus:outline-none focus:border-black/30"
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon(couponInput)}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponInput.trim()}
                    className="px-4 py-2 bg-black text-white text-xs font-black uppercase tracking-wider rounded-lg hover:bg-black/80 disabled:opacity-50"
                  >
                    {applyingCoupon ? "..." : t.cart.apply || "Apply"}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between font-body text-[10px] md:text-sm text-black/40 font-bold uppercase tracking-wider">
                <div>{t.cart.subtotal}</div>
                <Price amount={subtotalCents / 100} className="text-black font-black" />
              </div>

              {couponCode && (
                <div className="flex items-center justify-between font-body text-[10px] md:text-sm text-green-600 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    {t.cart.promo} ({couponCode})
                    <button onClick={removeCoupon} className="text-[9px] underline">({t.cart.remove})</button>
                  </div>
                  <div className="font-black">- <Price amount={discountCents / 100} /></div>
                </div>
              )}

              <div className="flex items-center justify-between font-body text-[10px] md:text-sm text-black/40 font-bold uppercase tracking-wider">
                <div>Delivery</div>
                <div className={freeDelivery ? "text-green-600" : "text-black"}>
                  {freeDelivery ? (
                    <span className="text-green-600 font-black">FREE</span>
                  ) : (
                    <Price amount={shippingCents / 100} />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-black/5">
                <div className="font-black text-xs md:text-sm uppercase tracking-widest">{t.cart.total}</div>
                <Price amount={totalCents / 100} className="text-2xl md:text-3xl font-black text-black" />
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="mt-8 md:mt-10 w-full rounded-full bg-black text-white py-4 md:py-5 font-body text-[10px] md:text-xs font-black tracking-[0.2em] transition hover:scale-[1.02] shadow-xl shadow-black/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {t.cart.checkout}
            </button>
            
            {!hasAddress && (
              <p className="mt-4 text-[9px] md:text-[10px] text-red-500/80 font-bold uppercase text-center flex items-center justify-center gap-1.5 px-4 leading-tight">
                <Info className="w-3 h-3 shrink-0" />
                {t.cart.addressRequired}
              </p>
            )}
            
            <div className="mt-8 md:mt-10 flex items-center justify-center gap-3 opacity-20 filter grayscale">
              <Image src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" width={40} height={20} className="w-8 h-4 md:w-10 md:h-5" />
              <div className="w-px h-3 bg-black" />
              <div className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Secure Checkout</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    couponCode,
    couponDiscount,
    removeCoupon,
    applyCoupon,
  } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const userCountry = useUserCountry();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  const subtotalCents = items.reduce(
    (acc, item) => {
      // Find country-specific price for user's country
      const countryPrice = item.countryPrices?.find(cp =>
        cp.country.toUpperCase() === userCountry.toUpperCase()
      );
      
      // Use country price if available, otherwise fallback to base price
      const priceCents = countryPrice && countryPrice.priceCents > 0
        ? countryPrice.priceCents
        : (item.discountPrice ?? item.price) * 100;
        
      return acc + priceCents * item.quantity;
    },
    0
  );
  
  const discountCents = Math.round(subtotalCents * couponDiscount);
  
  // Delivery fee calculation based on country
  const DELIVERY_CONFIG: Record<string, { minOrderCents: number; deliveryFeeCents: number; freeDeliveryCents: number }> = {
    AE: { minOrderCents: 8000, deliveryFeeCents: 1500, freeDeliveryCents: 15000 },
    KW: { minOrderCents: 12000, deliveryFeeCents: 1500, freeDeliveryCents: 18000 },
    SA: { minOrderCents: 15900, deliveryFeeCents: 1900, freeDeliveryCents: 35900 },
    BH: { minOrderCents: 1300, deliveryFeeCents: 199, freeDeliveryCents: 1800 },
    OM: { minOrderCents: 1600, deliveryFeeCents: 190, freeDeliveryCents: 2200 },
    QA: { minOrderCents: 12900, deliveryFeeCents: 1900, freeDeliveryCents: 29900 },
  };
  
  const deliveryConfig = DELIVERY_CONFIG[userCountry.toUpperCase()] || DELIVERY_CONFIG['AE'];
  const shippingCents = subtotalCents >= deliveryConfig.freeDeliveryCents ? 0 : deliveryConfig.deliveryFeeCents;
  const totalCents = subtotalCents - discountCents + shippingCents;

  if (items.length === 0) {
    return (
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto text-center">
        <div className="glass-panel mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl p-10 border border-black/5 shadow-xl">
          <div className="mb-4 text-6xl">🛒</div>
          <h1 className="font-display text-3xl text-black font-black">{t.cart.title}</h1>
          <p className="font-body mt-3 text-black/40 font-bold uppercase tracking-widest text-xs">{t.cart.emptyCart}</p>
          <Link
            href="/"
            className="mt-8 inline-block bg-black text-white rounded-full px-8 py-3 font-body text-sm font-bold tracking-widest transition hover:scale-105 shadow-lg shadow-black/20"
          >
            {t.cart.shopNow}
          </Link>
        </div>
      </div>
    );
  }

    return (
      <CartContent 
        items={items}
        removeItem={removeItem}
        updateQuantity={updateQuantity}
        couponCode={couponCode}
        couponDiscount={couponDiscount}
        removeCoupon={removeCoupon}
        subtotalCents={subtotalCents}
        discountCents={discountCents}
        totalCents={totalCents}
        shippingCents={shippingCents}
        freeDelivery={shippingCents === 0}
        applyCoupon={() => {}}
        t={t}
        userCountry={userCountry}
      />
    );
}
