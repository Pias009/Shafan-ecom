"use client";

import { useCartStore } from "@/lib/cart-store";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trash2, ChevronDown, Truck, Plus, Minus } from "lucide-react";
import { useSession } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Price } from "@/components/Price";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { useCountryStore } from "@/lib/country-store";
import { getDisplayPrice } from "@/lib/product-utils";
import { COUNTRY_CONFIG } from "@/lib/address-config";
import { useLoadingStore } from "@/lib/loading-store";
import { trackBeginCheckout } from "@/lib/datalayer";
import type { CartItem } from "@/lib/cart-store";
import PaymentSelection from "@/components/checkout/PaymentSelection";
import { getOptimizedUrl } from "@/lib/cloudinary-url";

const COUNTRY_CODES: Record<string, string> = {
  "United Arab Emirates": "+971",
  "Saudi Arabia": "+966",
  Kuwait: "+965",
  Bahrain: "+973",
  Qatar: "+974",
  Oman: "+968",
};

function getCurrencyForCountry(countryCode: string): string {
  const currencies: Record<string, string> = {
    AE: "AED", KW: "KWD", SA: "SAR", BH: "BHD", OM: "OMR", QA: "QAR",
  };
  return currencies[countryCode?.toUpperCase()] || "AED";
}

function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("/") || url.startsWith("http");
}

function getCountryName(code: string): string {
  const names: Record<string, string> = {
    AE: "United Arab Emirates", KW: "Kuwait", SA: "Saudi Arabia",
    BH: "Bahrain", OM: "Oman", QA: "Qatar",
  };
  return names[code?.toUpperCase()] || "United Arab Emirates";
}

function getCountryCode(name: string): string {
  const codes: Record<string, string> = {
    "United Arab Emirates": "AE", Kuwait: "KW", "Saudi Arabia": "SA",
    Bahrain: "BH", Oman: "OM", Qatar: "QA",
  };
  return codes[name] || "AE";
}

const ACTIVE_COUNTRIES = Object.values(COUNTRY_CONFIG)
  .filter((c) => c.active)
  .map((c) => c.name);

function CartPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { currentLanguage } = useLanguageStore();
  const isArabic = currentLanguage.code === "ar";
  const t = translations[currentLanguage.code as keyof typeof translations];
  const { selectedCountry } = useCountryStore();
  const {
    items,
    removeItem,
    updateQuantity,
    couponCode,
    couponDiscount,
    couponMaxLimit,
    applyCoupon,
    removeCoupon,
    setHasAddress,
    clearCart,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [notifyMe, setNotifyMe] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [emirate, setEmirate] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryCountry, setDeliveryCountry] = useState(getCountryName(selectedCountry));
  const [saveInfo, setSaveInfo] = useState(false);
  const [shipMethod, setShipMethod] = useState<"ship" | "pickup">("ship");

  const [activePayment, setActivePayment] = useState<string | null>(null);
  const [useBillingAddress, setUseBillingAddress] = useState(true);

  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [, setLoadingAddress] = useState(true);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showEmirateDropdown, setShowEmirateDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const tamaraStatus = searchParams?.get("tamara_status");
  const tamaraRef = searchParams?.get("ref");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (tamaraStatus === "success") {
      clearCart();
    }
  }, [tamaraStatus, clearCart]);

  useEffect(() => {
    if (tamaraStatus === "cancel" || tamaraStatus === "failure") {
      toast.error(
        tamaraStatus === "cancel"
          ? "Tamara payment was canceled. Please try again or choose a different payment method."
          : "Tamara payment did not complete. Please try again or choose a different payment method.",
        { id: "tamara-status", duration: 6000 }
      );
    }
  }, [tamaraStatus]);

  useEffect(() => {
    let isMounted = true;
    async function fetchAddress() {
      try {
        let addr = null;
        if (session) {
          const res = await fetch("/api/account/address");
          if (res.ok) {
            addr = await res.json();
          }
        } else {
          const guestStr = localStorage.getItem("guest_address");
          if (guestStr) {
            addr = JSON.parse(guestStr);
          }
        }

        if (addr && isMounted) {
          const nameParts = (addr.fullName || "").split(" ");
          setFirstName(nameParts[0] || "");
          setLastName(nameParts.slice(1).join(" ") || "");
          setEmail(addr.email || "");
          setStreetAddress(addr.address1 || "");
          setCity(addr.city || "");
          setPhone(addr.phone || "");
          const countryName = getCountryName(addr.country);
          setDeliveryCountry(countryName);
          if (addr.region || addr.emirate) {
            setEmirate(addr.region || addr.emirate);
          }
          setHasAddress(true);
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

  useEffect(() => {
    if (items.length > 0) {
      const total = items.reduce((acc, item) => {
        const { price: itemPrice } = getDisplayPrice(item, selectedCountry);
        return acc + (Number(itemPrice) * item.quantity);
      }, 0);
      trackBeginCheckout({
        items: items.map((i: CartItem) => ({
          id: i.id,
          name: i.name,
          price: Number(getDisplayPrice(i, selectedCountry).price) || 0,
          quantity: i.quantity,
          brand: i.brand,
          category: i.category,
        })),
        value: total,
        currency: "AED",
      });
    }
  }, [items, selectedCountry]);

  if (!mounted) return null;

  const subtotal = items.reduce((acc, item) => {
    const { price: itemPrice } = getDisplayPrice(item, selectedCountry);
    return acc + (Number(itemPrice) * item.quantity);
  }, 0);

  const rawDiscount = subtotal * couponDiscount;
  const discount = couponMaxLimit ? Math.min(rawDiscount, couponMaxLimit) : rawDiscount;

  const deliveryConfig = COUNTRY_CONFIG[selectedCountry.toUpperCase()] || COUNTRY_CONFIG["AE"];
  const shipping = subtotal >= deliveryConfig.freeDelivery ? 0 : deliveryConfig.deliveryFee;
  const preTaxTotal = subtotal - discount + shipping;
  const taxRate = deliveryConfig.taxRate || 0;
  const taxAmount = Math.round(preTaxTotal * taxRate * 100) / 100;
  const total = preTaxTotal + taxAmount;

  const regions = deliveryConfig.regions || [];

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

  function buildAddressFromForm() {
    const countryCode = getCountryCode(deliveryCountry);
    return {
      fullName: `${firstName} ${lastName}`.trim(),
      phone,
      email,
      country: countryCode,
      city,
      address1: streetAddress,
      address2: emirate || "",
      postalCode: "",
      region: emirate || "",
    };
  }

  async function saveAddressToBackend(addr: ReturnType<typeof buildAddressFromForm>) {
    if (session) {
      const res = await fetch("/api/account/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: addr.fullName,
          phone: addr.phone,
          email: addr.email,
          country: addr.country,
          city: addr.city,
          address1: addr.address1,
          address2: addr.address2,
          postalCode: addr.postalCode || "",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save address");
      }
    } else {
      localStorage.setItem("guest_address", JSON.stringify(addr));
      if (email) {
        localStorage.setItem("guest_email", email);
      }
    }
    setHasAddress(true);
  }

  async function handleCheckout(methodOverride?: string) {
    if (submitting) return;

    const errors: Record<string, string> = {};
    if (!firstName.trim() || !lastName.trim()) {
      errors.name = "Please enter your first and last name";
    }
    if (!streetAddress.trim()) {
      errors.street = "Please enter your street address (building, street, area)";
    }
    if (!city.trim()) {
      errors.city = "Please enter your city";
    }
    const countryCode = COUNTRY_CODES[deliveryCountry] || "+971";
    let rawPhone = phone;
    if (rawPhone.startsWith(countryCode)) {
      rawPhone = rawPhone.slice(countryCode.length).trim();
    }
    const phoneDigits = rawPhone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 7 || phoneDigits.length > 10) {
      errors.phone = "Please enter a valid phone number (8-10 digits)";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(msg => toast.error(msg));
      return;
    }

    setSubmitting(true);

    const addr = buildAddressFromForm();

    toast.loading(t.cart.creatingOrder, { id: "checkout" });

    try {
      await saveAddressToBackend(addr);

      const orderItems = items.map((i: CartItem) => {
        const { price: itemPrice } = getDisplayPrice(i, selectedCountry);
        return {
          productId: i.id,
          quantity: Number(i.quantity) || 1,
          price: Number(itemPrice) || 0,
        };
      });

      const calculatedSubtotal = Number(orderItems.reduce((sum: number, i: { productId: string; quantity: number; price: number }) => sum + (i.price * i.quantity), 0));

      const deliveryConfigLocal = COUNTRY_CONFIG[selectedCountry.toUpperCase()];
      const freeDeliveryThreshold = deliveryConfigLocal?.freeDelivery || 150;
      const shippingFee = calculatedSubtotal >= freeDeliveryThreshold ? 0 : (deliveryConfigLocal?.deliveryFee || 10);

      const discountAmount = Math.min(calculatedSubtotal * couponDiscount, couponMaxLimit ?? Infinity);

      const preTaxTotalLocal = calculatedSubtotal - discountAmount + shippingFee;
      const taxRateLocal = deliveryConfigLocal?.taxRate || 0;
      const taxAmountLocal = Math.round(preTaxTotalLocal * taxRateLocal * 100) / 100;
      const totalLocal = Number((preTaxTotalLocal + taxAmountLocal).toFixed(2));

      const minOrderValue = deliveryConfigLocal?.minOrder || 80;
      if (calculatedSubtotal < minOrderValue) {
        toast.error(`Minimum order is ${getCurrencyForCountry(selectedCountry)} ${minOrderValue}. Add more items!`, { id: "checkout" });
        return;
      }

      const activeMethod = methodOverride || activePayment || "stripe";

      // Tamara: direct checkout session instead of order creation
      if (activeMethod === "tamara") {
        const tamaraRes = await fetch("/api/checkout/tamara", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems: items.map((i: CartItem) => {
              const { price: itemPrice } = getDisplayPrice(i, selectedCountry);
              return {
                id: i.id,
                name: i.name,
                price: Number(itemPrice) || 0,
                quantity: i.quantity,
                imageUrl: i.imageUrl,
                brand: i.brand,
              };
            }),
            totalAmount: total,
            currency: getCurrencyForCountry(selectedCountry),
            customerDetails: {
              firstName,
              lastName,
              email,
              phone,
              addressLine1: streetAddress,
              city,
              region: emirate,
            },
            lang: currentLanguage.code,
          }),
        });

        const tamaraData = await tamaraRes.json();

        if (tamaraRes.ok && tamaraData.checkoutUrl) {
          toast.success("Redirecting to Tamara...", { id: "checkout" });
          useLoadingStore.getState().setRedirecting(true, "Redirecting to Tamara...");
          window.location.href = tamaraData.checkoutUrl;
          return;
        } else {
          toast.error(tamaraData.error || "Tamara checkout failed", { id: "checkout" });
          setSubmitting(false);
          return;
        }
      }

      let paymentMethodData = { payment_method: "stripe", payment_method_title: "Credit Card (Stripe)" };
      if (activeMethod === "cod") {
        paymentMethodData = { payment_method: "cod", payment_method_title: "Cash on Delivery" };
      } else if (activeMethod === "tabby") {
        paymentMethodData = { payment_method: "tabby", payment_method_title: "Tabby Pay-in-4" };
      }

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          subtotal: calculatedSubtotal,
          shippingFee: Number(shippingFee),
          discountAmount: Number(discountAmount),
          taxAmount: taxAmountLocal,
          taxRate: taxRateLocal,
          total: totalLocal,
          ...(couponCode && { couponCode }),
          billing: addr,
          shipping: addr,
          country: selectedCountry,
          ...paymentMethodData,
        }),
      });

      const data = await orderRes.json();

      if (orderRes.ok && data.orderId) {
        if (typeof window !== "undefined") {
          localStorage.setItem("recent_order", data.orderId);
        }

        trackBeginCheckout({
          value: totalLocal,
          currency: getCurrencyForCountry(selectedCountry),
          items: items.map((i: CartItem) => {
            const { price: itemPrice } = getDisplayPrice(i, selectedCountry);
            return {
              id: i.id,
              name: i.name || "Product",
              price: Number(itemPrice) || 0,
              quantity: Number(i.quantity) || 1,
              category: i.category,
              brand: i.brand,
            };
          }),
        });

        toast.success("Order created! Redirecting...", { id: "checkout" });
        useLoadingStore.getState().setRedirecting(true, "Redirecting to secure payment...");
        router.push(`/checkout/payment/${data.orderId}?method=${activeMethod}`);
      } else if (!orderRes.ok) {
        toast.error(data?.error || `Server error (${orderRes.status})`, { id: "checkout" });
        console.error("Order failed:", orderRes.status, data);
      } else if (data.minOrderRequired) {
        const currencySymbol = data.currency || "AED";
        toast.error(`Minimum order is ${currencySymbol} ${data.minOrder}. Add more items!`, { id: "checkout" });
      } else if (data.error) {
        toast.error(data.error, { id: "checkout" });
        console.error("Order error:", data.error);
      } else {
        toast.error(data.error || "Checkout failed", { id: "checkout" });
      }
      setSubmitting(false);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout failed", { id: "checkout" });
      setSubmitting(false);
    }
  }

  const isEmpty = items.length === 0;

  if (tamaraStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50/50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg mx-auto pt-20 md:pt-28 pb-16 text-center">
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-8 md:p-12 space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-black tracking-tight">
              Thank You for Your Order!
            </h1>
            <p className="text-sm text-black/50 font-medium">
              Your order has been submitted successfully via Tamara.
              You will receive a confirmation shortly.
            </p>
            {tamaraRef && (
              <div className="bg-black/[0.03] rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-1">
                  Order Reference
                </p>
                <p className="font-mono font-bold text-lg text-black tracking-wider">
                  {tamaraRef}
                </p>
              </div>
            )}
            <Link
              href="/"
              className="inline-block w-full rounded-full bg-black text-white py-4 font-body text-xs font-black tracking-[0.25em] uppercase hover:bg-black/80 transition-all hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-28 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-body text-[10px] md:text-xs font-black uppercase tracking-widest text-black/30 hover:text-black transition-colors mb-5 md:mb-8 cursor-pointer active:text-black/60"
        >
          <ArrowLeft size={14} className="md:w-4 md:h-4" /> {t.cart.continueShopping}
        </Link>

        {(tamaraStatus === "cancel" || tamaraStatus === "failure") && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-amber-700 text-xs font-black">!</span>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-amber-800">
                {tamaraStatus === "cancel" ? "Payment Canceled" : "Payment Failed"}
              </p>
              <p className="text-xs text-amber-700 font-medium mt-1">
                {tamaraStatus === "cancel"
                  ? "Your Tamara payment was canceled. You can try again or choose a different payment method below."
                  : "Your Tamara payment did not complete. Please try again or select another payment option."}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-baseline justify-between mb-6 md:mb-10">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-black text-black tracking-tight">{t.cart.title}</h1>
            {!isEmpty && (
              <p className="font-body text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-black/30 mt-1">
                {items.reduce((acc: number, i: CartItem) => acc + i.quantity, 0)} {t.cart.itemsInBag}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
          <div className="lg:col-span-6 space-y-5 lg:space-y-6 order-2 lg:order-1">
            <div className="rounded-2xl lg:rounded-3xl border border-black/5 bg-white shadow-sm p-5 md:p-7">
              <h2 className="font-black text-sm md:text-base uppercase tracking-widest text-black mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black inline-block shrink-0" />
                Contact
              </h2>
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-xl lg:rounded-2xl px-4 py-3.5 text-sm font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white cursor-text active:border-black/30"
                />
                <label className="flex items-center gap-2 cursor-pointer group py-1">
                  <input
                    type="checkbox"
                    checked={notifyMe}
                    onChange={(e) => setNotifyMe(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-black/20 accent-black cursor-pointer"
                  />
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-black/40 group-hover:text-black/60 transition select-none">
                    Notify me about new products &amp; offers
                  </span>
                </label>
              </div>
            </div>

            <div className="rounded-2xl lg:rounded-3xl border border-black/5 bg-white shadow-sm p-5 md:p-7">
              <h2 className="font-black text-sm md:text-base uppercase tracking-widest text-black mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black inline-block shrink-0" />
                Delivery
              </h2>

              <div className="flex rounded-xl lg:rounded-2xl border-2 border-black/10 p-1 mb-5 bg-black/[0.02]">
                <button
                  type="button"
                  onClick={() => setShipMethod("ship")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition cursor-pointer active:scale-[0.98] ${
                    shipMethod === "ship"
                      ? "bg-black text-white shadow-sm"
                      : "text-black/40 hover:text-black/70"
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Ship
                </button>
                <button
                  type="button"
                  onClick={() => setShipMethod("pickup")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition cursor-pointer active:scale-[0.98] ${
                    shipMethod === "pickup"
                      ? "bg-black text-white shadow-sm"
                      : "text-black/40 hover:text-black/70"
                  }`}
                >
                  Pickup
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">
                    Country
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowCountryDropdown(!showCountryDropdown); setShowEmirateDropdown(false); }}
                    className="w-full rounded-xl lg:rounded-2xl px-4 py-3.5 text-left text-sm font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white flex items-center justify-between cursor-pointer active:border-black/30"
                  >
                    <span>{deliveryCountry}</span>
                    <ChevronDown className={`w-4 h-4 text-black/30 transition shrink-0 ${showCountryDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showCountryDropdown && (
                    <div className="absolute z-[100] w-full mt-1.5 bg-white border-2 border-black/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                      {ACTIVE_COUNTRIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setDeliveryCountry(c); setShowCountryDropdown(false); setEmirate(""); }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-black/5 transition cursor-pointer active:bg-black/10 ${
                            deliveryCountry === c ? "bg-black text-white hover:bg-black" : "text-black"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden md:block" />

                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">
                    First Name *
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setFieldErrors(prev => ({...prev, name: ''})); }}
                    placeholder="First name"
                    className={`w-full rounded-xl lg:rounded-2xl px-4 py-3.5 text-sm font-semibold border-2 ${fieldErrors.name ? 'border-red-500' : 'border-black/10'} focus:border-black transition outline-none bg-white cursor-text active:border-black/30`}
                  />
                </div>

                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">
                    Last Name *
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); setFieldErrors(prev => ({...prev, name: ''})); }}
                    placeholder="Last name"
                    className={`w-full rounded-xl lg:rounded-2xl px-4 py-3.5 text-sm font-semibold border-2 ${fieldErrors.name ? 'border-red-500' : 'border-black/10'} focus:border-black transition outline-none bg-white cursor-text active:border-black/30`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">
                    Street Address *
                  </label>
                  <input
                    value={streetAddress}
                    onChange={(e) => { setStreetAddress(e.target.value); setFieldErrors(prev => ({...prev, street: ''})); }}
                    placeholder="Building, street, area"
                    className={`w-full rounded-xl lg:rounded-2xl px-4 py-3.5 text-sm font-semibold border-2 ${fieldErrors.street ? 'border-red-500' : 'border-black/10'} focus:border-black transition outline-none bg-white cursor-text active:border-black/30`}
                  />
                </div>

                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">
                    City *
                  </label>
                  <input
                    value={city}
                    onChange={(e) => { setCity(e.target.value); setFieldErrors(prev => ({...prev, city: ''})); }}
                    placeholder="City"
                    className={`w-full rounded-xl lg:rounded-2xl px-4 py-3.5 text-sm font-semibold border-2 ${fieldErrors.city ? 'border-red-500' : 'border-black/10'} focus:border-black transition outline-none bg-white cursor-text active:border-black/30`}
                  />
                </div>

                <div className="relative">
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">
                    {getCountryCode(deliveryCountry) === "AE" ? "Emirate" : "Region"}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowEmirateDropdown(!showEmirateDropdown); setShowCountryDropdown(false); }}
                    className="w-full rounded-xl lg:rounded-2xl px-4 py-3.5 text-left text-sm font-semibold border-2 border-black/10 focus:border-black transition outline-none bg-white flex items-center justify-between cursor-pointer active:border-black/30"
                  >
                    <span className={emirate ? "" : "text-black/30"}>{emirate || `Select ${getCountryCode(deliveryCountry) === "AE" ? "Emirate" : "Region"}`}</span>
                    <ChevronDown className={`w-4 h-4 text-black/30 transition shrink-0 ${showEmirateDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showEmirateDropdown && (
                    <div className="absolute z-[100] w-full mt-1.5 bg-white border-2 border-black/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                      {regions.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => { setEmirate(r); setShowEmirateDropdown(false); }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-black/5 transition cursor-pointer active:bg-black/10 ${
                            emirate === r ? "bg-black text-white hover:bg-black" : "text-black"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">
                    Phone *
                  </label>
                  <div className="flex gap-2">
                    <div className="w-20 shrink-0 flex items-center justify-center rounded-xl lg:rounded-2xl bg-black/5 border-2 border-transparent text-xs font-bold text-black/60">
                      {COUNTRY_CODES[deliveryCountry] || "+971"}
                    </div>
                    <input
                      type="tel"
                      value={phone.replace(COUNTRY_CODES[deliveryCountry] || "+971", "").trim()}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, "");
                        setPhone(`${COUNTRY_CODES[deliveryCountry] || "+971"} ${val}`);
                        setFieldErrors(prev => ({...prev, phone: ''}));
                      }}
                      placeholder="5XX XXX XXXX"
                      maxLength={10}
                      className={`flex-1 rounded-xl lg:rounded-2xl px-4 py-3.5 text-sm font-semibold border-2 ${fieldErrors.phone ? 'border-red-500' : 'border-black/10'} focus:border-black transition outline-none bg-white cursor-text active:border-black/30`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer group px-1 py-1 active:opacity-70">
              <input
                type="checkbox"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-black/20 accent-black cursor-pointer"
              />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-black/40 group-hover:text-black/60 transition select-none">
                Save my information for my next purchase
              </span>
            </label>

            <div className="rounded-2xl lg:rounded-3xl border border-black/5 bg-white shadow-sm p-5 md:p-7">
              <h2 className="font-black text-sm md:text-base uppercase tracking-widest text-black mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black inline-block shrink-0" />
                Payment
              </h2>

              <PaymentSelection
                currentCurrency={getCurrencyForCountry(selectedCountry)}
                totalCartAmount={total}
                activePayment={activePayment}
                onPaymentSelect={(method) =>
                  setActivePayment(activePayment === method ? null : method)
                }
                useBillingAddress={useBillingAddress}
                onBillingToggle={() => setUseBillingAddress(!useBillingAddress)}
                lang={currentLanguage.code}
              />
            </div>

            {!isEmpty && (
              <button
                onClick={() => handleCheckout()}
                disabled={submitting}
                className={`w-full rounded-full py-5 md:py-6 font-body text-xs md:text-sm font-black tracking-[0.25em] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100 ${
                  submitting
                    ? "bg-gray-400 text-white shadow-none"
                    : "bg-red-600 hover:bg-red-700 text-white hover:scale-[1.03] active:scale-[0.97] shadow-2xl shadow-red-600/30"
                }`}
              >
                {submitting ? "Processing..." : "Place Order"}
              </button>
            )}
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="lg:sticky lg:top-28 space-y-4 lg:space-y-6">
              <div className="rounded-2xl lg:rounded-3xl border border-black/5 bg-white shadow-sm p-5 md:p-7">
                <h3 className="font-black text-base md:text-lg uppercase tracking-widest text-black mb-5">
                  {items.length} {items.length === 1 ? "Item" : "Items"}
                </h3>
                {isEmpty ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="mb-3 text-4xl">&#x1F6D2;</div>
                    <p className="font-body text-black/40 font-bold uppercase tracking-widest text-xs">{t.cart.emptyCart}</p>
                    <Link
                      href="/"
                      className="mt-5 inline-block bg-black text-white rounded-full px-6 py-2.5 font-body text-xs font-bold tracking-widest transition hover:scale-105 cursor-pointer active:scale-95"
                    >
                      {t.cart.shopNow}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[360px] md:max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                    {items.map((item: CartItem, idx: number) => {
                      const { price: itemDisplayPrice } = getDisplayPrice(item, selectedCountry);
                      const itemKey = item.id || `item-${idx}`;
                      return (
                        <div key={itemKey} className="flex gap-4 items-center group bg-black/[0.02] rounded-2xl p-3 hover:bg-black/[0.04] transition">
                          <div className="relative h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-2xl bg-white border border-black/10 shadow-sm">
                            <Image
                              src={isValidImageUrl(item.imageUrl) ? getOptimizedUrl(item.imageUrl, 150) : "/placeholder-product.png"}
                              alt={item.name || "Product"}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs md:text-sm font-bold text-black leading-tight line-clamp-2">{item.name}</div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="inline-flex items-center justify-center bg-red-500/10 text-red-600 rounded-full px-2.5 py-0.5 text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                                Qty {item.quantity}
                              </span>
                              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-black/30">{item.brand}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-center gap-1 rounded-full border border-black/10 px-1 py-0.5">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-7 h-7 md:w-6 md:h-6 rounded-full text-black/40 hover:text-black hover:bg-black/5 transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:bg-black/10"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-[11px] font-black text-black">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 md:w-6 md:h-6 rounded-full text-black/40 hover:text-black hover:bg-black/5 transition flex items-center justify-center cursor-pointer active:bg-black/10"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <Price
                              amount={Number(itemDisplayPrice) * item.quantity}
                              className="font-black text-sm md:text-base text-black"
                            />
                          </div>
                          <button
                            onClick={() => {
                              removeItem(item.id);
                              toast.success(`Removed ${item.name}`);
                            }}
                            className="text-red-400 hover:text-red-600 transition p-1.5 hover:bg-red-50 rounded-lg self-start mt-1 cursor-pointer active:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {!isEmpty && (
                <>
              <div className="rounded-2xl lg:rounded-3xl border border-black/5 bg-white/50 backdrop-blur-md shadow-sm p-5 md:p-6">
                {!couponCode ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder={t.cart.enterCoupon || "Enter coupon code"}
                      className="flex-1 rounded-xl px-3.5 py-3 text-xs font-bold uppercase tracking-wider border-2 border-black/10 focus:border-black transition outline-none bg-white cursor-text active:border-black/30"
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponInput.trim()}
                      className="px-5 py-3 bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-black/80 disabled:opacity-50 transition shrink-0 cursor-pointer active:scale-95"
                    >
                      {applyingCoupon ? "..." : t.cart.apply || "Apply"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-green-600">
                        {t.cart.promo} ({couponCode})
                      </span>
                      {couponMaxLimit && (
                        <span className="text-[8px] text-green-500 font-normal">
                          Max cap: <Price amount={couponMaxLimit} />
                        </span>
                      )}
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-[9px] text-black/30 hover:text-red-500 underline font-bold uppercase tracking-wider transition cursor-pointer active:text-red-700"
                    >
                      ({t.cart.remove})
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl lg:rounded-3xl border border-black/5 bg-white/50 backdrop-blur-md shadow-sm p-5 md:p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-black/40">{t.cart.subtotal}</span>
                    <Price amount={subtotal} className="font-black text-sm md:text-base text-black" />
                  </div>

                  {couponCode && discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-green-600">
                        {t.cart.promo} ({couponCode})
                      </span>
                      <Price amount={discount} className="font-black text-sm md:text-base text-green-600" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-black/40">Delivery</span>
                    <span className={`font-black text-sm md:text-base ${shipping === 0 ? "text-green-600" : "text-black"}`}>
                      {shipping === 0 ? "FREE" : <Price amount={shipping} />}
                    </span>
                  </div>

                  {taxRate > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-orange-600">
                        VAT ({(taxRate * 100).toFixed(0)}%)
                      </span>
                      <Price amount={taxAmount} className="font-black text-sm md:text-base text-orange-600" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-black/10">
                    <span className="font-black text-xs md:text-sm uppercase tracking-widest">{t.cart.total}</span>
                    <Price amount={total} className="font-black text-xl md:text-2xl text-black" />
                  </div>
                </div>
              </div>

                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartPageContent />
    </Suspense>
  );
}

