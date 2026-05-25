"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useLanguageStore } from "@/lib/language-store";

interface TamaraWidgetProps {
  amount: number;
  currency?: string;
}

export default function TamaraWidget({ amount }: TamaraWidgetProps) {
  const { currentLanguage } = useLanguageStore();
  const isArabic = currentLanguage.code === "ar";
  const containerRef = useRef<HTMLDivElement>(null);

  const publicKey = process.env.NEXT_PUBLIC_TAMARA_PUBLIC_KEY || "561ee41b-e351-4543-ab2d-934866b6b8af";
  const lang = isArabic ? "ar" : "en";

  if (typeof window !== "undefined") {
    window.tamaraWidgetConfig = {
      lang,
      country: "AE",
      publicKey,
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

    widget.setAttribute("amount", amount.toFixed(2));

    if (window.TamaraWidgetV2 && typeof window.TamaraWidgetV2.refresh === "function") {
      if (window.tamaraWidgetConfig) {
        window.tamaraWidgetConfig.lang = lang;
      }
      window.TamaraWidgetV2.refresh();
    }
  }, [amount, lang]);

  if (isNaN(amount) || amount <= 0) return null;

  return (
    <div className="my-4 p-3 border border-gray-200 rounded-lg bg-white">
      <script
        dangerouslySetInnerHTML={{
          __html: `window.tamaraWidgetConfig = { lang: "${lang}", country: "AE", publicKey: "${publicKey}" };`,
        }}
      />
      <Script
        id="tamara-widget-script-v2-shared"
        src="https://cdn-sandbox.tamara.co/widget-v2/tamara-widget.js"
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="min-h-[80px]" />
    </div>
  );
}
