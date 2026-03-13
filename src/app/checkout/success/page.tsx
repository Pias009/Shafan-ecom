"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { CheckCircle2, Package, ArrowRight, Loader2, Home } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const clearCart = useCartStore(state => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto flex flex-col items-center text-center min-h-[70vh]">
      <div className="glass-panel-heavy rounded-[3rem] p-12 border border-black/5 shadow-2xl relative overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-400/10 blur-[100px] pointer-events-none" />
        
        <div className="relative">
          <div className="inline-flex p-6 bg-green-50 rounded-full mb-8 ring-8 ring-green-50/50">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>

          <h1 className="text-4xl font-black text-black mb-4 tracking-tight">Payment Successful!</h1>
          <p className="text-lg text-black/60 font-medium mb-1">Your order has been received and is being processed.</p>
          {sessionId && (
            <p className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-8">Ref: {sessionId.slice(0, 20)}...</p>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mt-10">
            <Link 
              href="/account"
              className="flex items-center justify-center gap-2 bg-black text-white rounded-full px-8 py-4 text-sm font-bold shadow-xl shadow-black/20 transition hover:scale-105 active:scale-95"
            >
              <Package className="w-4 h-4" /> Go to Dashboard
            </Link>
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 glass-panel border border-black/10 rounded-full px-8 py-4 text-sm font-bold transition hover:bg-black/5"
            >
              <Home className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-6 text-black/30">
        <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-1 border-t-2 border-dashed border-current" />
            <span className="text-[9px] font-black uppercase tracking-widest">Order Placed</span>
        </div>
        <div className="flex flex-col items-center gap-2 opacity-40">
            <div className="w-12 h-1 border-t-2 border-dashed border-current" />
            <span className="text-[9px] font-black uppercase tracking-widest">Shipping</span>
        </div>
        <div className="flex flex-col items-center gap-2 opacity-40">
            <div className="w-12 h-1 border-t-2 border-dashed border-current" />
            <span className="text-[9px] font-black uppercase tracking-widest">Delivery</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="pt-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-black/20" /></div>}>
        <SuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}
