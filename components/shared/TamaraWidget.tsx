"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useLanguageStore } from "@/lib/language-store";

interface TamaraWidgetProps {
  amount: number;
  currency?: string;
}

declare global {
  interface Window {
    tamaraWidgetConfig?: {
      publicKey: string;
      locale: string;
    };
    TamaraWidgetV2?: {
      refresh: () => void;
    };
  }
}

export default function TamaraWidget({ amount, currency = "AE" }: TamaraWidgetProps) {
  const { currentLanguage } = useLanguageStore();
  const isArabic = currentLanguage.code === "ar";
  const containerRef = useRef<HTMLDivElement>(null);

  const publicKey = process.env.NEXT_PUBLIC_TAMARA_PUBLIC_KEY || "561ee41b-e351-4543-ab2d-934866b6b8af";
  const locale = isArabic ? "ar" : "en";

  if (typeof window !== "undefined") {
    window.tamaraWidgetConfig = {
      publicKey,
      locale,
    };
  }

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
    widget.setAttribute(
      "config",
      JSON.stringify({ theme: "light", badgePosition: "", showExtraContent: "", hidePayInX: false })
    );
    if (currency) {
      widget.setAttribute("currency", currency.toUpperCase());
    }

    if (window.TamaraWidgetV2 && typeof window.TamaraWidgetV2.refresh === "function") {
      window.TamaraWidgetV2.refresh();
    }
  }, [amount, currency]);

  if (isNaN(amount) || amount <= 0) return null;

  const isSandbox =
    !process.env.NEXT_PUBLIC_TAMARA_API_URL ||
    process.env.NEXT_PUBLIC_TAMARA_API_URL.includes("sandbox") ||
    !process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "development";

  const scriptSrc = isSandbox
    ? "https://cdn-sandbox.tamara.co/widget-v2/tamara-widget.js"
    : "https://cdn.tamara.co/widget-v2/tamara-widget.js";

  return (
    <div className="my-4 p-3 border border-gray-200 rounded-lg bg-white">
      <script
        dangerouslySetInnerHTML={{
          __html: `window.tamaraWidgetConfig = { publicKey: "${publicKey}", locale: "${locale}" };`,
        }}
      />
      <Script
        id="tamara-widget-script-v2-shared"
        src={scriptSrc}
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="min-h-[80px]" />
    </div>
  );
}
