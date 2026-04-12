"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { CheckCircle2, Package, ArrowRight, Home, AlertCircle, Heart, Sparkles, Gift } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Loader } from "@/components/Loader";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [valid, setValid] = useState(false);
  const [checking, setChecking] = useState(true);
  
  const sessionId = searchParams?.get("session_id");
  const orderId = searchParams?.get("order_id");
  const isCOD = searchParams?.get("cod") === "true";
  const clearCart = useCartStore(state => state.clearCart);

  useEffect(() => {
    async function validateOrder() {
      if (!orderId && !sessionId) {
        router.push("/");
        return;
      }

      if (orderId) {
        try {
          const res = await fetch(`/api/orders/${orderId}`);
          const data = await res.json();
          if (data.error || !data.id) {
            router.push("/");
            return;
          }
        } catch (e) {
          router.push("/");
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

  if (checking) {
    return (
      <div className="pt-40 text-center">
        <Loader />
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="pt-40 text-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-32 pb-20 px-4 md:px-6 max-w-3xl mx-auto flex flex-col items-center text-center min-h-[70vh]">
      <div className="glass-panel-heavy rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 border border-black/5 shadow-2xl relative overflow-hidden bg-white w-full">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 md:w-64 h-48 md:h-64 bg-green-400/10 blur-[80px] md:blur-[100px] pointer-events-none" />
        
        <div className="relative">
          <div className="inline-flex p-4 md:p-6 bg-green-50 rounded-full mb-6 md:mb-8 ring-8 ring-green-50/50">
            <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-green-500" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-black mb-3 md:mb-4 tracking-tight">Order Confirmed!</h1>
          <p className="text-base md:text-lg text-black/60 font-medium mb-1">
            {isCOD 
              ? "Your order has been placed. Pay with cash when delivered." 
              : "Your order has been received and is being processed."}
          </p>
          {(orderId || sessionId) && (
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black/20 mb-6 md:mb-8">Ref: {orderId ? `#${orderId}` : sessionId?.slice(0, 20)}</p>
          )}

          {/* Celebration wishes */}
          <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border border-pink-100">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-pink-500" />
              <span className="text-[10px] md:text-xs font-bold text-pink-600 uppercase tracking-widest">Thank You!</span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-sm md:text-base text-black/80 font-medium">
              🎉 Your radiant skin journey begins!
            </p>
            <p className="text-xs md:text-sm text-black/50 mt-2">
              We wish you glowing skin and confident moments. Enjoy your natural skincare ritual! ✨
            </p>
            <div className="flex items-center justify-center gap-1 mt-3">
              <Gift className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] text-black/30">Your trust means the world to us</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 md:gap-4 mt-8 md:mt-10">
            <Link 
              href="/account"
              className="flex items-center justify-center gap-2 bg-black text-white rounded-full px-6 py-4 text-xs md:text-sm font-bold shadow-xl shadow-black/20 transition hover:scale-[1.02] active:scale-95"
            >
              <Package className="w-4 h-4" /> Go to Dashboard
            </Link>
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 glass-panel border border-black/10 rounded-full px-6 py-4 text-xs md:text-sm font-bold transition hover:bg-black/5"
            >
              <Home className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-10 md:mt-12 flex items-center justify-center gap-4 md:gap-6 text-black/30 w-full overflow-hidden">
        <div className="flex flex-col items-center gap-2 min-w-0">
            <div className="w-10 md:w-12 h-1 border-t-2 border-dashed border-current" />
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest truncate">Placed</span>
        </div>
        <div className="flex flex-col items-center gap-2 opacity-40 min-w-0">
            <div className="w-10 md:w-12 h-1 border-t-2 border-dashed border-current" />
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest truncate">Shipping</span>
        </div>
        <div className="flex flex-col items-center gap-2 opacity-40 min-w-0">
            <div className="w-10 md:w-12 h-1 border-t-2 border-dashed border-current" />
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest truncate">Delivery</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="pt-40 text-center">
        <Loader />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
