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
      lang: string;
      language?: string;
      country?: string;
      currency?: string;
    };
    TamaraWidgetV2?: {
      refresh: () => void;
    };
  }
}

export default function TamaraWidget({ price, currency, country }: TamaraWidgetProps) {
  const currentPrice = Number(price);
  const { currentLanguage } = useLanguageStore();
  const isArabic = currentLanguage.code === "ar";
  const containerRef = useRef<HTMLDivElement>(null);

  const publicKey = process.env.NEXT_PUBLIC_TAMARA_PUBLIC_KEY || "561ee41b-e351-4543-ab2d-934866b6b8af";
  const lang = isArabic ? "ar" : "en";

  // Set the configuration synchronously so the script always has it when it evaluates
  if (typeof window !== "undefined") {
    window.tamaraWidgetConfig = {
      lang: lang,
      country: "AE",
      publicKey: "561ee41b-e351-4543-ab2d-934866b6b8af",
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
      widget.setAttribute(
        "config",
        '{"theme":"light","badgePosition":"","showExtraContent":"","hidePayInX":false}'
      );
      container.appendChild(widget);
    }

    widget.setAttribute("amount", currentPrice.toFixed(2));

    // Force a refresh of the Tamara widget whenever the amount or language changes
    if (window.TamaraWidgetV2 && typeof window.TamaraWidgetV2.refresh === "function") {
      if (window.tamaraWidgetConfig) {
        window.tamaraWidgetConfig.lang = lang;
      }
      window.TamaraWidgetV2.refresh();
    }
  }, [currentPrice, lang]);

  if (isNaN(currentPrice) || currentPrice <= 0) return null;

  const scriptSrc = "https://cdn-sandbox.tamara.co/widget-v2/tamara-widget.js";

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.tamaraWidgetConfig = { lang: "${lang}", country: "AE", publicKey: "561ee41b-e351-4543-ab2d-934866b6b8af" };`,
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
