"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface TamaraPaymentRowProps {
  isSelected: boolean;
  onSelect: () => void;
  cartTotal: number;
  currency: string;
  lang: string;
}

export default function TamaraPaymentRow({
  isSelected,
  onSelect,
  cartTotal,
  currency,
  lang,
}: TamaraPaymentRowProps) {
  const isArabic = lang === "ar";
  const logoRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const SCRIPT_SRC = "https://cdn.tamara.co/widget-v2/tamara-widget.js";
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_TAMARA_PUBLIC_KEY || "a5e7eb67-561b-479c-84f1-a5a44d5fce1d";

  function handleScriptLoad() {
    window.tamaraWidgetConfig = {
      lang,
      country: currency === "KWD" ? "KW" : "AE",
      publicKey: PUBLIC_KEY,
    };
  }

  // Mount tamara-logo into the right-aligned container
  useEffect(() => {
    if (!logoRef.current) return;
    let logo = logoRef.current.querySelector("tamara-widget") as HTMLElement | null;
    if (!logo) {
      logo = document.createElement("tamara-widget");
      logo.setAttribute("type", "tamara-logo");
      logoRef.current.appendChild(logo);
    }
  }, []);

  // Mount or update tamara-summary when accordion opens or cartTotal changes
  useEffect(() => {
    if (!isSelected || !summaryRef.current) return;

    let widget = summaryRef.current.querySelector("tamara-widget") as HTMLElement | null;
    if (!widget) {
      widget = document.createElement("tamara-widget");
      widget.setAttribute("type", "tamara-summary");
      widget.setAttribute("inline-type", "2");
      widget.setAttribute("currency", currency);
      widget.setAttribute("theme", "light");
      widget.setAttribute("lang", lang);
      summaryRef.current.appendChild(widget);
    }
    widget.setAttribute("amount", String(cartTotal));
    widget.setAttribute("lang", lang);
  }, [isSelected, cartTotal, currency, lang]);

  // Asynchronous rehydration: invoke native refresh when cartTotal or language scales
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.tamaraWidgetConfig) {
      window.tamaraWidgetConfig.lang = lang;
    }

    if (isSelected && window.TamaraWidgetV2?.refresh) {
      window.TamaraWidgetV2.refresh();
    }
  }, [cartTotal, isSelected, lang]);

  return (
    <div className="w-full">
      <Script
        src={SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />

      <button
        type="button"
        onClick={onSelect}
        className="flex items-center justify-between w-full p-4 cursor-pointer select-none border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              isSelected ? "border-black" : "border-gray-300"
            }`}
          >
            {isSelected && (
              <div className="w-2.5 h-2.5 rounded-full bg-black" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-900 select-none">
            {isArabic
              ? "تمارا - دفعات شهرية. متوافقة مع الشريعة"
              : "Tamara - Monthly payments. Sharia compliant"}
          </span>
        </div>

        <div ref={logoRef} />
      </button>

      {isSelected && <div ref={summaryRef} className="mt-4 px-4 pb-4" />}
    </div>
  );
}
