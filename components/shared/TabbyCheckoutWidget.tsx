"use client";

import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface TabbyCheckoutWidgetProps {
  price: number;
  currency: string;
  publicKey: string;
  merchantCode: string;
  loading: boolean;
  onPay: () => void;
}

export default function TabbyCheckoutWidget({
  price,
  currency,
  publicKey,
  merchantCode,
  loading,
  onPay,
}: TabbyCheckoutWidgetProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  // Dynamic merchant code: map currency suffix to correct country code
  const resolvedMerchantCode = (() => {
    const cleanCurrency = (currency || "AED").toUpperCase();
    const base = merchantCode || "SGAE";
    const map: Record<string, string> = {
      AED: "AE", SAR: "SA", KWD: "KW", BHD: "BH", OMR: "OM", QAR: "QA",
    };
    const country = map[cleanCurrency];
    if (!country) return base;
    if (base.length >= 4 && base.endsWith("AE")) return base.slice(0, -2) + country;
    return `SG${country}`;
  })();

  useEffect(() => {
    const scriptId = "tabby-card-widget-script";

    function initCard() {
      const TabbyCard = (window as any).TabbyCard;
      if (!TabbyCard || !cardRef.current) return;
      // Clear any previous render before reinitialising
      cardRef.current.innerHTML = "";
      try {
        new TabbyCard({
          selector: "#tabby-card-widget",
          currency: (currency || "AED").toUpperCase(),
          price: String(price),
          installmentsCount: 4,
          lang: "en",
          publicKey,
          merchantCode: resolvedMerchantCode,
        });
      } catch (e) {
        console.warn("[TabbyWidget] Card init error:", e);
      }
    }

    const existing = document.getElementById(scriptId);
    if (existing) {
      if ((window as any).TabbyCard) {
        initCard();
      } else {
        existing.addEventListener("load", initCard);
        return () => existing.removeEventListener("load", initCard);
      }
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.tabby.ai/tabby-card.js";
      script.async = true;
      script.onload = initCard;
      document.body.appendChild(script);
    }
  }, [price, currency, publicKey, resolvedMerchantCode]);

  return (
    <div className="py-8 text-center space-y-6 max-w-md mx-auto">
      {/* Official Tabby logo — brand name only, no custom promotional copy */}
      <div className="flex justify-center">
        <img src="https://cdn.tabby.ai/assets/logo.svg" alt="Tabby" className="h-10" />
      </div>
      <p className="font-bold text-lg">Tabby</p>

      {/*
       * Official Tabby on-site checkout snippet.
       * The TabbyCard script renders the installment plan widget natively —
       * no manual math, no hardcoded monthly calculations.
       */}
      <div className="my-4 border-t border-black/5 pt-4">
        <div
          id="tabby-card-widget"
          ref={cardRef}
          className="min-h-[40px] w-full"
        />
      </div>

      <button
        id="tabby-pay-button"
        onClick={onPay}
        disabled={loading}
        className="w-full h-14 md:h-16 rounded-full bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-xl shadow-[#3ECF8E]/20 disabled:opacity-50 flex items-center justify-center gap-3"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pay with Tabby"}
      </button>
    </div>
  );
}

