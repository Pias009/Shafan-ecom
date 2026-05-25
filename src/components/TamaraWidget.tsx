"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useLanguageStore } from "@/lib/language-store";

interface TamaraWidgetProps {
  price: number | string;
  currency: string;
  country?: string;
  widgetType?: "product" | "cart" | "summary";
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

export default function TamaraWidget({ price, currency }: TamaraWidgetProps) {
  const currentPrice = Number(price);
  const { currentLanguage } = useLanguageStore();
  const isArabic = currentLanguage.code === "ar";
  const containerRef = useRef<HTMLDivElement>(null);

  const publicKey = process.env.NEXT_PUBLIC_TAMARA_PUBLIC_KEY || "561ee41b-e351-4543-ab2d-934866b6b8af";
  const locale = isArabic ? "ar" : "en";

  // Set the configuration synchronously so the script always has it when it evaluates
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
      widget.setAttribute("theme", "light");
      container.appendChild(widget);
    }

    widget.setAttribute("amount", currentPrice.toFixed(2));
    if (currency) {
      widget.setAttribute("currency", currency.toUpperCase());
    }

    // Force a refresh of the Tamara widget whenever the amount changes
    if (window.TamaraWidgetV2 && typeof window.TamaraWidgetV2.refresh === "function") {
      window.TamaraWidgetV2.refresh();
    }
  }, [currentPrice, currency]);

  if (isNaN(currentPrice) || currentPrice <= 0) return null;

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
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.tamaraWidgetConfig = { publicKey: "${publicKey}", locale: "${locale}" };`,
        }}
      />
      <Script
        id="tamara-widget-script-v2"
        src={scriptSrc}
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="w-full" />
    </>
  );
}

export { TamaraWidget };
