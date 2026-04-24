"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { CheckCircle2, Package, Home, Heart, Sparkles, Gift, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Loader } from "@/components/Loader";
import { motion } from "framer-motion";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [valid, setValid] = useState(false);
  const [checking, setChecking] = useState(true);
  const [countdown, setCountdown] = useState(5);

  // Support both ?order_id= (Stripe) and ?orderId= (COD/manual)
  const orderId = searchParams?.get("orderId") || searchParams?.get("order_id");
  const sessionId = searchParams?.get("session_id");
  const isCOD = searchParams?.get("cod") === "true";
  const clearCart = useCartStore((state) => state.clearCart);

  // The final redirect destination — always to the orders page
  const redirectUrl = `/account/orders`;

  useEffect(() => {
    async function validateOrder() {
      if (!orderId && !sessionId) {
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
        } catch {
          router.push("/account/orders");
          return;
        }
      }

      setValid(true);
      setChecking(false);
    }

    validateOrder();
  }, [orderId, sessionId, router]);

  useEffect(() => {
    if (valid) {
      clearCart();
    }
  }, [valid, clearCart]);

  // Auto-redirect countdown
  useEffect(() => {
    if (!valid) return;
    if (countdown <= 0) {
      router.push(redirectUrl);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [valid, countdown, router, redirectUrl]);

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

  return (
    <div className="pt-24 md:pt-32 pb-20 px-4 md:px-6 max-w-2xl mx-auto flex flex-col items-center text-center min-h-[80vh] justify-center">
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
            {isCOD ? "Order Placed! 🎉" : "Payment Confirmed! ✅"}
          </h1>
          <p className="text-base text-black/60 font-medium mb-2">
            {isCOD
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
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
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
          { label: "Processing", active: !isCOD },
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
