"use client";

import { useEffect, useRef } from "react";
import { useLanguageStore } from "@/lib/language-store";

interface TamaraWidgetProps {
  amount: number;
  currency?: string;
}

declare global {
  interface Window {
    TamaraWidgetV2?: {
      refresh: () => void;
    };
  }
}

export default function TamaraWidget({ amount, currency = "AE" }: TamaraWidgetProps) {
  const { currentLanguage } = useLanguageStore();
  const isArabic = currentLanguage.code === "ar";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_TAMARA_PUBLIC_KEY || "";
    window.tamaraWidgetConfig = {
      publicKey,
      locale: isArabic ? "ar" : "en",
    };

    const scriptId = "tamara-widget-script-v2";
    if (!document.getElementById(scriptId)) {
      const isSandbox =
        !process.env.NEXT_PUBLIC_TAMARA_API_URL ||
        process.env.NEXT_PUBLIC_TAMARA_API_URL.includes("sandbox") ||
        !process.env.NEXT_PUBLIC_VERCEL_ENV ||
        process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
        process.env.NEXT_PUBLIC_VERCEL_ENV === "development";
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = isSandbox
        ? "https://cdn-sandbox.tamara.co/widget-v2/tamara-widget.js"
        : "https://cdn.tamara.co/widget-v2/tamara-widget.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isArabic]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let widget = container.querySelector("tamara-widget") as HTMLElement | null;
    if (!widget) {
      widget = document.createElement("tamara-widget");
      widget.setAttribute("type", "tamara-summary");
      widget.setAttribute("inline-type", "2");
      container.appendChild(widget);
    }

    widget.setAttribute("amount", amount.toFixed(2));
    if (currency) {
      widget.setAttribute("currency", currency.toUpperCase());
    }

    if (window.TamaraWidgetV2) {
      window.TamaraWidgetV2.refresh();
    }
  }, [amount, currency]);

  if (isNaN(amount) || amount <= 0) return null;

  return (
    <div className="my-4 p-3 border border-gray-200 rounded-lg bg-white">
      <div ref={containerRef} className="min-h-[80px]" />
    </div>
  );
}
