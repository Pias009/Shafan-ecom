"use client";

import { useCartStore } from "@/lib/cart-store";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2, Info, CheckCircle, Circle, Loader2, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Price } from "@/components/Price";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useUserCountry } from "@/lib/country-detection";
import { useCountryStore } from "@/lib/country-store";
import { getDisplayPrice } from "@/lib/product-utils";
import { COUNTRY_CONFIG } from "@/lib/address-config";
import { useLoadingStore } from "@/lib/loading-store";
import { trackBeginCheckout } from "@/lib/datalayer";
import TabbyPromo from "@/components/TabbyPromo";
import TamaraWidget from "@/components/TamaraWidget";

function getCurrencyForCountry(countryCode: string): string {
  const currencies: Record<string, string> = {
    AE: 'AED', KW: 'KWD', SA: 'SAR', BH: 'BHD', OM: 'OMR', QA: 'QAR'
  };
  return currencies[countryCode?.toUpperCase()] || 'AED';
}
import { getOptimizedUrl } from "@/lib/cloudinary-url";

function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') || url.startsWith('http');
}

function CartContent({ items, removeItem, updateQuantity, couponCode, couponDiscount, couponMaxLimit, removeCoupon, subtotal, discount, total, shipping, taxRate, taxAmount, freeDelivery, t, selectedCountry, applyCoupon }: any) {
  const router = useRouter();
  const { currentLanguage } = useLanguageStore();
  const isArabic = currentLanguage.code === "ar";
  const hasAddress = useCartStore(state => state.hasAddress);
  const setHasAddress = useCartStore(state => state.setHasAddress);
  const { data: session } = useSession();
  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe");

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
      router.push("/account/address?redirect=/cart");
      return;
    }

    toast.loading(t.cart.creatingOrder, { id: "checkout" });

    try {
      let billing = null;
      let shipping = null;

      if (session) {
        const addressRes = await fetch("/api/account/address");
        if (addressRes.ok) {
          const addressData = await addressRes.json();
          if (addressData) {
            billing = addressData;
            shipping = addressData;
          }
        }
      } else {
        const guestStr = localStorage.getItem('guest_address');
        if (guestStr) {
          try {
            const guestData = JSON.parse(guestStr);
            billing = guestData;
            shipping = guestData;
          } catch (e) {
            console.error(e);
          }
        }
      }

      if (!billing) {
        toast.error("Please provide your shipping address", { id: "checkout" });
        router.push("/account/address?redirect=/cart");
        return;
      }

      // Build order items first
      const orderItems = items.map((i: any) => {
        const { price: itemPrice } = getDisplayPrice(i, selectedCountry);
        return {
          productId: i.id || i.productId,
          quantity: Number(i.quantity) || 1,
          price: Number(itemPrice) || 0
        };
      });
      
      // Calculate subtotal from items
      const subtotal = Number(orderItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0));
      
      // Get shipping fee based on country config
      const deliveryConfig = (COUNTRY_CONFIG as any)[selectedCountry];
      const freeDeliveryThreshold = deliveryConfig?.freeDelivery || 150;
      const shippingFee = subtotal >= freeDeliveryThreshold ? 0 : (deliveryConfig?.deliveryFee || 10);
      
      // Calculate discount amount (from coupon if applied)
      const discountAmount = (couponDiscount && typeof couponDiscount === 'number') ? couponDiscount : 0;
      
      // Calculate VAT tax on pre-tax total
      const preTaxTotal = subtotal - discountAmount + shippingFee;
      const taxRate = deliveryConfig?.taxRate || 0;
      const taxAmount = Math.round(preTaxTotal * taxRate * 100) / 100;

      // Calculate final total: (subtotal - discount) + shipping + tax
      const total = Number((preTaxTotal + taxAmount).toFixed(2));
      
      // MOV check: Minimum Order Value
      const minOrderValue = deliveryConfig?.minOrder || 80;
      if (subtotal < minOrderValue) {
        toast.error(`Minimum order is ${getCurrencyForCountry(selectedCountry)} ${minOrderValue}. Add more items!`, { id: "checkout" });
        return;
      }

      let paymentMethodData = { payment_method: "stripe", payment_method_title: "Credit Card (Stripe)" };
      if (paymentMethod === "cod") {
        paymentMethodData = { payment_method: "cod", payment_method_title: "Cash on Delivery" };
      } else if (paymentMethod === "tabby") {
        paymentMethodData = { payment_method: "tabby", payment_method_title: "Tabby Pay-in-4" };
      } else if (paymentMethod === "tamara") {
        paymentMethodData = { payment_method: "tamara", payment_method_title: "Tamara Installments" };
      }

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          subtotal,
          shippingFee: Number(shippingFee),
          discountAmount: Number(discountAmount),
          taxAmount,
          taxRate,
          total,
          ...(couponCode && { couponCode }),
          billing,
          shipping,
          country: selectedCountry,
          ...paymentMethodData
        }),
      });

      const data = await orderRes.json();
      
      if (orderRes.ok && data.orderId) {
        // Save order ID for post-order notification on homepage
        if (typeof window !== 'undefined') {
          localStorage.setItem('recent_order', data.orderId);
        }
        toast.success("Order created! Redirecting...", { id: "checkout" });
        // Always redirect to payment page to allow confirmation or method change
        useLoadingStore.getState().setRedirecting(true, "Redirecting to secure payment...");
        router.push(`/checkout/payment/${data.orderId}?method=${paymentMethod}`);
      } else if (!orderRes.ok) {
        toast.error(data?.error || `Server error (${orderRes.status})`, { id: "checkout" });
        console.error("Order failed:", orderRes.status, data);
      } else if (data.minOrderRequired) {
        const currencySymbol = data.currency || 'AED';
        toast.error(`Minimum order is ${currencySymbol} ${data.minOrder}. Add more items!`, { id: "checkout" });
      } else if (data.error) {
        toast.error(data.error, { id: "checkout" });
        console.error("Order error:", data.error);
      } else {
        toast.error(data.error || "Checkout failed", { id: "checkout" });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout failed", { id: "checkout" });
    }
  }

  const [address, setAddress] = useState<any>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchAddress() {
      try {
        if (session) {
          const res = await fetch("/api/account/address");
          if (res.ok && isMounted) {
            const data = await res.json();
            setAddress(data);
            if (data) {
              setHasAddress(true);
            }
          }
        } else {
          const guestStr = localStorage.getItem('guest_address');
          if (guestStr && isMounted) {
            const data = JSON.parse(guestStr);
            setAddress(data);
            if (data) {
              setHasAddress(true);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoadingAddress(false);
      }
    }
    fetchAddress();
    return () => { isMounted = false; };
  }, [session, setHasAddress]);

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
            // STRICT: Get price using selectedCountry for live display
            const { price: itemDisplayPrice } = getDisplayPrice(item, selectedCountry);
            const itemKey = item.id || `item-${idx}`;
            return (
              <div
                key={itemKey}
                className="glass-panel-heavy flex flex-row items-center gap-4 md:gap-6 rounded-2xl md:rounded-3xl p-3 md:p-5 border border-black/5 shadow-sm group hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* In Cart indicator - Green */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-[8px] font-bold text-green-600 uppercase">In Cart</span>
                </div>

                <div className="relative h-20 w-20 md:h-32 md:w-32 shrink-0 overflow-hidden rounded-xl md:rounded-2xl bg-black/[0.02] border border-black/5">
                  <Image
                    src={isValidImageUrl(item.imageUrl) ? getOptimizedUrl(item.imageUrl, 150) : "/placeholder-product.png"}
                    alt={item.name || "Product image"}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
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
                      amount={itemDisplayPrice}
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

          {/* Tabby & Tamara installment widgets - rendered at the bottom of the products list */}
          <div className="mt-6 bg-[#ffffff] rounded-3xl p-5 border border-black/5 flex flex-col gap-4 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-1">Payment Options</div>
            <TabbyPromo 
              price={total} 
              currency={getCurrencyForCountry(selectedCountry)} 
              publicKey={process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY || ""} 
              merchantCode={process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE || "SGAE"} 
            />
            <TamaraWidget 
              price={total} 
              currency={getCurrencyForCountry(selectedCountry)} 
              country={["AE", "SA", "KW", "BH", "QA", "OM"].includes(selectedCountry.toUpperCase()) ? selectedCountry : "AE"}
              widgetType="cart"
            />
          </div>
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
                <Price amount={subtotal} className="text-black font-black" />
              </div>

              {couponCode && (
                <div className="flex items-center justify-between font-body text-[10px] md:text-sm text-green-600 font-bold uppercase tracking-wider">
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-2">
                      {t.cart.promo} ({couponCode})
                      <button onClick={removeCoupon} className="text-[9px] underline">({t.cart.remove})</button>
                    </div>
                    {couponMaxLimit && (
                      <span className="text-[8px] text-green-500 font-normal normal-case">
                        Max cap: <Price amount={couponMaxLimit} />
                      </span>
                    )}
                  </div>
                  <div className="font-black">- <Price amount={discount} /></div>                </div>
              )}

              <div className="flex items-center justify-between font-body text-[10px] md:text-sm text-black/40 font-bold uppercase tracking-wider">
                <div>Delivery</div>
                <div className={freeDelivery ? "text-green-600" : "text-black"}>
                  {freeDelivery ? (
                    <span className="text-green-600 font-black">FREE</span>
                  ) : (
                    <Price amount={shipping} />
                  )}
                </div>
              </div>

              {taxRate > 0 && (
                <div className="flex items-center justify-between font-body text-[10px] md:text-sm text-orange-600 font-bold uppercase tracking-wider">
                  <div>VAT ({(taxRate * 100).toFixed(0)}%)</div>
                  <div className="font-black"><Price amount={taxAmount} /></div>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-black/5">
                <div className="font-black text-xs md:text-sm uppercase tracking-widest">{t.cart.total}</div>
                <Price amount={total} className="text-2xl md:text-3xl font-black text-black" />
              </div>

              {/* Delivery Address Preview Section */}
              <div className="mt-6 pt-4 border-t border-black/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-black/40">Delivery Address</div>
                  <Link 
                    href="/account/address?redirect=/cart"
                    className="text-[10px] md:text-xs font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 decoration-emerald-200"
                  >
                    {address ? "Edit Address" : "Add Address"}
                  </Link>
                </div>
                
                {loadingAddress ? (
                  <div className="h-12 flex items-center justify-center bg-black/[0.02] rounded-xl border border-dashed border-black/10">
                    <Loader2 className="w-4 h-4 animate-spin text-black/10" />
                  </div>
                ) : address ? (
                  <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5 group hover:bg-black/[0.04] transition-colors cursor-pointer" onClick={() => router.push("/account/address?redirect=/cart")}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 bg-white rounded-lg border border-black/5 text-black/40">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] md:text-xs font-black text-black truncate mb-0.5">{address.fullName}</div>
                        <div className="text-[10px] md:text-[11px] text-black/60 truncate leading-tight">
                          {address.address1}{address.address2 ? `, ${address.address2}` : ''}
                        </div>
                        <div className="text-[10px] md:text-[11px] text-black/60 font-medium">
                          {address.city}, {address.country}
                        </div>
                        <div className="text-[10px] md:text-[11px] text-black/40 mt-1 font-bold">{address.phone}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex flex-col items-center text-center gap-2">
                    <div className="p-2 bg-white rounded-full text-red-500 shadow-sm">
                      <Info className="w-4 h-4" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-red-600">Address Required</div>
                    <p className="text-[9px] text-red-500/70 font-medium">Please provide your shipping address to calculate final taxes and enable checkout.</p>
                  </div>
                )}
              </div>



              <div className="mt-6 pt-4 border-t border-black/5">
                <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-black/40 mb-3">Payment Method</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("stripe")}
                    className={`p-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition ${paymentMethod === "stripe"
                        ? "border-black bg-black text-white"
                        : "border-black/20 text-black/60 hover:border-black/40"
                       }`}
                  >
                    💳 Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("tabby")}
                    className={`p-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${paymentMethod === "tabby"
                        ? "border-[#3ECF8E] bg-[#3ECF8E] text-black"
                        : "border-black/20 text-black/60 hover:border-black/40"
                       }`}
                  >
                    <img src="https://cdn.tabby.ai/assets/logo.svg" alt="Tabby" className="h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("tamara")}
                    className={`p-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${paymentMethod === "tamara"
                        ? "border-[#FF4D4D] bg-[#FF4D4D] text-white"
                        : "border-black/20 text-black/60 hover:border-black/40"
                       }`}
                  >
                    <img 
                      src={
                        paymentMethod === "tamara"
                          ? (isArabic ? "/tamara-logo-white-ar.svg" : "/tamara-logo-white.svg")
                          : (isArabic ? "/tamara-logo-gradient-ar.svg" : "/tamara-logo-gradient.svg")
                      } 
                      alt="Tamara" 
                      className="h-[26px] w-auto object-contain" 
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition ${paymentMethod === "cod"
                        ? "border-black bg-black text-white"
                        : "border-black/20 text-black/60 hover:border-black/40"
                       }`}
                  >
                    💵 COD
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="mt-8 md:mt-10 w-full rounded-full bg-black text-white py-4 md:py-5 font-body text-[10px] md:text-xs font-black tracking-[0.2em] transition hover:scale-[1.02] shadow-xl shadow-black/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {t.cart.checkout}
            </button>

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
    couponMaxLimit,
    applyCoupon,
    removeCoupon,
  } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { selectedCountry } = useCountryStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fire begin_checkout when cart loads via DataLayer
  useEffect(() => {
    if (items.length > 0) {
      const total = items.reduce((acc, item) => {
        const { price: itemPrice } = getDisplayPrice(item, selectedCountry);
        return acc + (Number(itemPrice) * item.quantity);
      }, 0);
      
      trackBeginCheckout({
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          price: Number(getDisplayPrice(i, selectedCountry).price) || 0,
          quantity: i.quantity,
          brand: i.brand,
          category: i.category,
        })),
        value: total,
        currency: 'AED',
      });
    }
  }, [items.length, selectedCountry]);

  if (!mounted) return null;

  // Calculate subtotal using selectedCountry - STRICT: only DB prices
  const subtotal = items.reduce(
    (acc, item) => {
      const { price: itemPrice } = getDisplayPrice(item, selectedCountry);
      return acc + (Number(itemPrice) * item.quantity);
    },
    0
  );

  // Apply coupon discount with max limit cap
  const rawDiscount = subtotal * couponDiscount;
  const discount = couponMaxLimit ? Math.min(rawDiscount, couponMaxLimit) : rawDiscount;

  const deliveryConfig = COUNTRY_CONFIG[selectedCountry.toUpperCase()] || COUNTRY_CONFIG['AE'];
  
  // Use raw units for comparison as per user request
  const shipping = subtotal >= deliveryConfig.freeDelivery ? 0 : deliveryConfig.deliveryFee;
  const preTaxTotal = subtotal - discount + shipping;
  const taxRate = deliveryConfig.taxRate || 0;
  const taxAmount = Math.round(preTaxTotal * taxRate * 100) / 100;
  const total = preTaxTotal + taxAmount;

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
      couponMaxLimit={couponMaxLimit}
      removeCoupon={removeCoupon}
      subtotal={subtotal}
      discount={discount}
      total={total}
      shipping={shipping}
      taxRate={taxRate}
      taxAmount={taxAmount}
      freeDelivery={shipping === 0}
      applyCoupon={applyCoupon}
      t={t}
      selectedCountry={selectedCountry}
    />
  );
}
