"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { CheckCircle2, Package, Home, Heart, Sparkles, Gift, ArrowRight, Loader2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { Loader } from "@/components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import { trackPurchase } from "@/lib/datalayer";
import { firePurchaseCAPI } from "@/app/actions/meta-capi";
import Script from "next/script";

const CONFETTI_COLORS = ["#f472b6", "#a78bfa", "#34d399", "#fbbf24", "#60a5fa", "#fb7185"];

type PaymentState = "verifying" | "confirmed" | "timeout" | "expired";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [valid, setValid] = useState(false);
  const [checking, setChecking] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [paymentState, setPaymentState] = useState<PaymentState>("verifying");
  const [isCodOrder, setIsCodOrder] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [orderData, setOrderData] = useState<{
    id: string;
    email: string;
    total: number;
    currency: string;
    deliveryCountry: string;
    estimatedDeliveryDate: string;
    items: Array<{ productId: string; name: string; quantity: number; unitPrice: number | null; gtin?: string }>;
  } | null>(null);
  const purchaseFiredRef = useRef(false);

  const [orderId, setOrderId] = useState<string | null>(
    searchParams?.get("orderId") || searchParams?.get("order_id") || null
  );
  const pendingCheckoutId = searchParams?.get("pcid");
  const sessionId = searchParams?.get("session_id");
  const tabbyPaymentId = searchParams?.get("payment_id");
  const isCOD = searchParams?.get("cod") === "true";
  const clearCart = useCartStore((state) => state.clearCart);

  const redirectUrl = `/account/orders`;

  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.8 + Math.random() * 1.4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 6,
        rotate: 180 + Math.random() * 360,
      })),
    []
  );

  function applyOrderData(data: any) {
    const orderDate = new Date(data.createdAt);
    orderDate.setDate(orderDate.getDate() + 5);
    const estimatedDeliveryDate = orderDate.toISOString().split('T')[0];

    setOrderData({
      id: data.id,
      email: data.email || "",
      total: data.total,
      currency: data.currency ?? "AED",
      deliveryCountry: data.shippingAddress?.country || "KW",
      estimatedDeliveryDate,
      items: data.items?.map((item: any) => ({
        productId: item.productId,
        name: item.product?.name || "Product",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        gtin: (item.product?.sku && /^\d{8,14}$/.test(item.product.sku)) ? item.product.sku : undefined,
      })) ?? [],
    });

    // Celebrate ONLY when the payment is actually complete:
    // - COD: order was confirmed via /api/payments/cod before landing here
    // - Online: server (webhook) has marked the order PAID
    const codOrder = isCOD || data.paymentMethod === "cod";
    setIsCodOrder(codOrder);
    if (codOrder || data.paymentStatus === "PAID") {
      setPaymentState("confirmed");
      setShowCelebration(true);
    } else {
      setPaymentState("verifying");
    }
  }

  useEffect(() => {
    async function validateOrder() {
      if (!orderId && !pendingCheckoutId && !sessionId) {
        router.push("/account/orders");
        return;
      }

      if (orderId) {
        try {
          const res = await fetch(`/api/orders/${orderId}`);
          const data = await res.json();
          if (data.error || !data.id) {
            router.push("/account/orders");
            return;
          }

          // NOTE: We intentionally do NOT capture the Tabby payment here.
          // Per Tabby's spec, capture must be driven by a server-side signal —
          // the registered webhook (payment.authorized) or the 20-minute
          // Retrieve Request cron (/api/cron/tabby-verify) — never the browser
          // success callback, which may be skipped or spoofed. This page only
          // POLLS the order until the server confirms the payment.
          applyOrderData(data);
        } catch {
          router.push("/account/orders");
          return;
        }
      } else if (pendingCheckoutId) {
        // Redirect-back from Stripe/Tabby/Tamara before their webhook has
        // necessarily landed yet — no real Order may exist. Poll by pcid
        // (see the dedicated effect below) rather than fetching /api/orders.
        setPaymentState("verifying");
      } else {
        // Legacy Stripe session_id-only redirect — no order to poll
        setPaymentState("confirmed");
        setShowCelebration(true);
      }

      setValid(true);
      setChecking(false);
    }

    validateOrder();
  }, [orderId, pendingCheckoutId, sessionId, tabbyPaymentId, isCOD, router]);

  // Poll the order until the payment webhook marks it PAID
  useEffect(() => {
    if (!valid || paymentState !== "verifying" || !orderId) return;

    let attempts = 0;
    let cancelled = false;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (cancelled) return;

        if (data.paymentStatus === "PAID") {
          clearInterval(interval);
          setPaymentState("confirmed");
          setShowCelebration(true);
          return;
        }
        if (data.status === "CANCELLED" || attempts >= 30) {
          // ~90s without confirmation — the webhook/cron will confirm it later
          clearInterval(interval);
          setPaymentState("timeout");
        }
      } catch {
        // network hiccup — keep polling until attempts run out
        if (attempts >= 30) {
          clearInterval(interval);
          setPaymentState("timeout");
        }
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [valid, paymentState, orderId]);

  // Poll the PendingCheckout until a webhook promotes it to a real Order
  // (Stripe/Tabby/Tamara redirect-back before the webhook has necessarily
  // landed). Once CONSUMED, switch over to the real order id and render it.
  useEffect(() => {
    if (!valid || paymentState !== "verifying" || orderId || !pendingCheckoutId) return;

    let attempts = 0;
    let cancelled = false;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/pending-checkout/${pendingCheckoutId}/status`);
        const data = await res.json();
        if (cancelled) return;

        if (data.status === "CONSUMED" && data.order) {
          clearInterval(interval);
          setOrderId(data.order.id);
          applyOrderData(data.order);
          return;
        }
        if (data.status === "EXPIRED") {
          clearInterval(interval);
          setPaymentState("expired");
          return;
        }
        if ((attempts === 1 || attempts === 3) && data.status === "OPEN") {
          const paymentParam = searchParams?.get("payment");
          if (paymentParam === "tamara" || !paymentParam) {
            fetch("/api/payments/tamara/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pendingCheckoutId }),
            }).catch(() => {});
          }
        }
        if (attempts >= 30) {
          clearInterval(interval);
          setPaymentState("timeout");
        }
      } catch {
        if (attempts >= 30) {
          clearInterval(interval);
          setPaymentState("timeout");
        }
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [valid, paymentState, orderId, pendingCheckoutId]);

  // Clear the cart only once the payment is genuinely confirmed,
  // so a failed/abandoned payment lets the user retry from the cart.
  useEffect(() => {
    if (valid && paymentState === "confirmed") {
      clearCart();
    }
  }, [valid, paymentState, clearCart]);

  useEffect(() => {
    if (paymentState !== "confirmed" || !orderId || !orderData || purchaseFiredRef.current) return;
    purchaseFiredRef.current = true;

    const eventId = `order_${orderId}_${Date.now()}`;

    // GA4 purchase event via dataLayer (also used by GTM for Meta Pixel tracking)
    trackPurchase({
      id: orderId,
      value: orderData.total,
      currency: orderData.currency.toUpperCase(),
      items: orderData.items.map((item) => ({
        id: item.productId,
        name: item.name,
        price: item.unitPrice ?? 0,
        quantity: item.quantity,
      })),
    }, eventId);

    void firePurchaseCAPI(orderId, eventId);
  }, [paymentState, orderId, orderData]);

  // Countdown starts only after the celebration popup is dismissed
  useEffect(() => {
    if (!valid || paymentState !== "confirmed" || showCelebration) return;
    if (countdown <= 0) {
      router.push(redirectUrl);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [valid, paymentState, showCelebration, countdown, router, redirectUrl]);

  // Google Customer Reviews Opt-In
  useEffect(() => {
    if (paymentState !== "confirmed" || !orderData || !window.gapi) return;

    const renderGoogleOptIn = () => {
      window.gapi.load('surveyoptin', function() {
        window.gapi.surveyoptin.render({
          "merchant_id": 5510071757,
          "order_id": orderData.id,
          "email": orderData.email,
          "delivery_country": orderData.deliveryCountry,
          "estimated_delivery_date": orderData.estimatedDeliveryDate,
          "products": orderData.items
            .filter(item => item.gtin && /^\d{8,14}$/.test(item.gtin))
            .map(item => ({ "gtin": item.gtin })),
        });
      });
    };

    // Ensure the function is called after the script is fully loaded
    if (window.gapi.surveyoptin) {
      renderGoogleOptIn();
    } else {
      // Small delay to ensure gapi is ready
      const timer = setTimeout(renderGoogleOptIn, 1000);
      return () => clearTimeout(timer);
    }
  }, [paymentState, orderData]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-black/30" />
          <p className="text-xs font-bold uppercase tracking-widest text-black/40">Verifying order...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Waiting for the payment provider's server-side confirmation
  if (paymentState === "verifying") {
    return (
      <div className="pt-24 md:pt-32 pb-20 px-4 md:px-6 max-w-lg mx-auto flex flex-col items-center text-center min-h-[70vh] justify-center">
        <div className="glass-panel-heavy rounded-[2rem] p-8 md:p-12 border border-black/5 shadow-2xl bg-white w-full">
          <div className="inline-flex p-5 bg-blue-50 rounded-full mb-6 ring-8 ring-blue-50/60">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-black mb-3 tracking-tight">
            Confirming your payment…
          </h1>
          <p className="text-sm text-black/50 font-medium mb-4">
            Hold on a moment — we&apos;re waiting for your payment provider to confirm.
            This usually takes just a few seconds.
          </p>
          {orderId && (
            <p className="text-[10px] font-black uppercase tracking-widest text-black/20">
              Order Ref: #{orderId.substring(0, 12)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Confirmation is taking longer than usual (webhook/cron will finish it)
  if (paymentState === "timeout") {
    return (
      <div className="pt-24 md:pt-32 pb-20 px-4 md:px-6 max-w-lg mx-auto flex flex-col items-center text-center min-h-[70vh] justify-center">
        <div className="glass-panel-heavy rounded-[2rem] p-8 md:p-12 border border-black/5 shadow-2xl bg-white w-full">
          <div className="inline-flex p-5 bg-amber-50 rounded-full mb-6 ring-8 ring-amber-50/60">
            <Clock className="w-12 h-12 text-amber-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-black mb-3 tracking-tight">
            Payment is being verified
          </h1>
          <p className="text-sm text-black/50 font-medium mb-6">
            We haven&apos;t received the final confirmation from your payment provider yet.
            Your order is saved and will be confirmed automatically — check your orders
            in a couple of minutes.
          </p>
          {orderId && (
            <p className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-6">
              Order Ref: #{orderId.substring(0, 12)}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={redirectUrl}
              className="flex-1 flex items-center justify-center gap-2 bg-black text-white rounded-full px-6 py-4 text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/20 transition hover:scale-[1.02] active:scale-95"
            >
              <Package className="w-4 h-4" />
              View My Orders
            </Link>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 glass-panel border border-black/10 rounded-full px-6 py-4 text-xs font-bold transition hover:bg-black/5"
            >
              <Home className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment definitively did not complete — no order was ever created.
  if (paymentState === "expired") {
    return (
      <div className="pt-24 md:pt-32 pb-20 px-4 md:px-6 max-w-lg mx-auto flex flex-col items-center text-center min-h-[70vh] justify-center">
        <div className="glass-panel-heavy rounded-[2rem] p-8 md:p-12 border border-black/5 shadow-2xl bg-white w-full">
          <div className="inline-flex p-5 bg-red-50 rounded-full mb-6 ring-8 ring-red-50/60">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-black mb-3 tracking-tight">
            Payment Not Completed
          </h1>
          <p className="text-sm text-black/50 font-medium mb-6">
            Your payment could not be completed, so no order was placed. Nothing was
            charged. Please try again or choose a different payment method.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/cart"
              className="flex-1 flex items-center justify-center gap-2 bg-black text-white rounded-full px-6 py-4 text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/20 transition hover:scale-[1.02] active:scale-95"
            >
              <Package className="w-4 h-4" />
              Return to Cart
            </Link>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 glass-panel border border-black/10 rounded-full px-6 py-4 text-xs font-bold transition hover:bg-black/5"
            >
              <Home className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-32 pb-20 px-4 md:px-6 max-w-2xl mx-auto flex flex-col items-center text-center min-h-[80vh] justify-center">
      {/* 🎉 Celebration popup — shown only once payment is fully complete */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCelebration(false)}
            />
            <motion.div
              initial={{ scale: 0.8, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative bg-white rounded-[2rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl overflow-hidden"
            >
              {/* Confetti */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {confetti.map((c, i) => (
                  <motion.span
                    key={i}
                    className="absolute rounded-sm"
                    style={{
                      left: `${c.left}%`,
                      top: -12,
                      width: c.size,
                      height: c.size * 0.6,
                      backgroundColor: c.color,
                    }}
                    initial={{ y: -20, opacity: 1, rotate: 0 }}
                    animate={{ y: 460, opacity: [1, 1, 0.8, 0], rotate: c.rotate }}
                    transition={{ duration: c.duration, delay: c.delay, ease: "easeIn" }}
                  />
                ))}
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 15 }}
                className="relative inline-flex p-5 bg-green-50 rounded-full mb-5 ring-8 ring-green-50/60"
              >
                <CheckCircle2 className="w-14 h-14 text-green-500" />
              </motion.div>

              <h2 className="relative text-2xl font-black text-black mb-2 tracking-tight">
                Order Placed Successfully! 🎉
              </h2>
              <p className="relative text-sm text-black/60 font-medium mb-1">
                {isCodOrder
                  ? "Your order is confirmed — pay with cash when your delivery arrives."
                  : "Payment received! Your order is confirmed and being prepared."}
              </p>
              {orderId && (
                <p className="relative text-[10px] font-black uppercase tracking-widest text-black/25 mt-3 mb-6">
                  Order Ref: #{orderId.substring(0, 12)}
                </p>
              )}
              <button
                onClick={() => setShowCelebration(false)}
                className="relative w-full bg-black text-white rounded-full px-6 py-4 text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/20 transition hover:scale-[1.02] active:scale-95"
              >
                Yay! Got it ✨
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel-heavy rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 border border-black/5 shadow-2xl relative overflow-hidden bg-white w-full"
      >
        {/* Soft glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-400/10 blur-[100px] pointer-events-none" />

        <div className="relative">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
            className="inline-flex p-5 bg-green-50 rounded-full mb-6 ring-8 ring-green-50/60"
          >
            <CheckCircle2 className="w-14 h-14 text-green-500" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-black text-black mb-3 tracking-tight">
            {isCodOrder ? "Order Placed! 🎉" : "Payment Confirmed! ✅"}
          </h1>
          <p className="text-base text-black/60 font-medium mb-2">
            {isCodOrder
              ? "Your order is confirmed. Pay with cash when your delivery arrives."
              : "Your payment was received and your order is being processed."}
          </p>

          {orderId && (
            <p className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-6">
              Order Ref: #{orderId.substring(0, 12)}
            </p>
          )}

          {/* Countdown bar */}
          <div className="mb-6 px-4">
            <p className="text-xs text-black/40 mb-2">
              Taking you to your orders in{" "}
              <span className="font-bold text-black/60">{countdown}s</span>…
            </p>
            <div className="h-1 bg-black/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-400 rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: showCelebration ? "100%" : "0%" }}
                transition={{ duration: showCelebration ? 0 : 5, ease: "linear" }}
              />
            </div>
          </div>

          {/* Thank you card */}
          <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-2xl p-5 mb-8 border border-pink-100/60">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-pink-500" />
              <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">Thank You!</span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-sm text-black/70 font-medium">🎉 Your radiant skin journey begins!</p>
            <p className="text-xs text-black/40 mt-1">
              We wish you glowing skin and confident moments. Enjoy your natural skincare ritual! ✨
            </p>
            <div className="flex items-center justify-center gap-1 mt-3">
              <Gift className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] text-black/30">Your trust means the world to us</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={redirectUrl}
              className="flex-1 flex items-center justify-center gap-2 bg-black text-white rounded-full px-6 py-4 text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/20 transition hover:scale-[1.02] active:scale-95"
            >
              <Package className="w-4 h-4" />
              View My Orders
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 glass-panel border border-black/10 rounded-full px-6 py-4 text-xs font-bold transition hover:bg-black/5"
            >
              <Home className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Order journey tracker */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-10 flex items-center justify-center gap-2 w-full"
      >
        {[
          { label: "Order Placed", active: true },
          { label: "Processing", active: !isCodOrder },
          { label: "Shipping", active: false },
          { label: "Delivered", active: false },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
                  step.active
                    ? "bg-green-500 border-green-500 shadow-sm shadow-green-400"
                    : "bg-transparent border-black/15"
                }`}
              />
              <span
                className={`text-[8px] font-black uppercase tracking-wider whitespace-nowrap ${
                  step.active ? "text-green-600" : "text-black/20"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < 3 && (
              <div className={`w-8 md:w-12 h-px mb-3 ${i === 0 ? "bg-green-300" : "bg-black/10"}`} />
            )}
          </div>
        ))}
      </motion.div>
      <Script
        src="https://apis.google.com/js/platform.js"
        strategy="afterInteractive"
      />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
