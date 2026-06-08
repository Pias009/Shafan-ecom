"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguageStore } from "@/lib/language-store";

interface TamaraCheckoutRowProps {
  price: number | string;
  currency: string;
  country?: string;
  active?: boolean;
  onToggle?: () => void;
}

export default function TamaraCheckoutRow({
  price,
  active = false,
  onToggle,
}: TamaraCheckoutRowProps) {
  const currentPrice = Number(price);
  const { currentLanguage } = useLanguageStore();
  const isArabic = currentLanguage.code === "ar";
  const summaryRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const publicKey =
    process.env.NEXT_PUBLIC_TAMARA_PUBLIC_KEY ||
    "a5e7eb67-561b-479c-84f1-a5a44d5fce1d";
  const lang = isArabic ? "ar" : "en";

  // Async global script loader engine
  useEffect(() => {
    if (typeof window === "undefined") return;

    const scriptId = "tamara-widget-script-v2";
    const existing = document.getElementById(scriptId);

    if (existing) {
      setReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src =
      "https://cdn.tamara.co/widget-v2/tamara-widget.js";
    script.async = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, []);

  // Mount/dismount tamara-logo widget into logoRef
  useEffect(() => {
    if (!ready || !logoRef.current) return;

    let logo = logoRef.current.querySelector("tamara-widget") as HTMLElement | null;
    if (!logo) {
      logo = document.createElement("tamara-widget");
      logo.setAttribute("type", "tamara-logo");
      logoRef.current.appendChild(logo);
    }
  }, [ready]);

  // Mount/dismount tamara-summary widget into summaryRef when active
  useEffect(() => {
    if (!ready || !summaryRef.current) return;

    // Clear existing widgets to avoid duplicates
    const existing = summaryRef.current.querySelector("tamara-widget");
    if (existing) {
      existing.setAttribute("amount", currentPrice.toFixed(2));
    } else {
      const widget = document.createElement("tamara-widget");
      widget.setAttribute("type", "tamara-summary");
      widget.setAttribute("inline-type", "2");
      widget.setAttribute(
        "config",
        '{"theme":"light","badgePosition":"","showExtraContent":"","hidePayInX":false}'
      );
      widget.setAttribute("amount", currentPrice.toFixed(2));
      summaryRef.current.appendChild(widget);
    }
  }, [active, ready, currentPrice]);

  // Dynamic lifecycle: invoke native global rehydration on price change
  useEffect(() => {
    if (!ready) return;

    if (window.tamaraWidgetConfig) {
      window.tamaraWidgetConfig.lang = lang;
    }

    if (window.TamaraWidgetV2?.refresh) {
      window.TamaraWidgetV2.refresh();
    }
  }, [currentPrice, ready, lang]);

  if (isNaN(currentPrice) || currentPrice <= 0) return null;

  return (
    <div className="w-full">
      <script
        dangerouslySetInnerHTML={{
          __html: `window.tamaraWidgetConfig = window.tamaraWidgetConfig || { lang: "${lang}", country: "AE", publicKey: "${publicKey}" };`,
        }}
      />
      <div
        className="flex items-center justify-between w-full cursor-pointer select-none"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle?.();
          }
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              active ? "border-black" : "border-gray-300"
            }`}
          >
            {active && (
              <div className="w-2.5 h-2.5 rounded-full bg-black" />
            )}
          </div>
          <span className="text-xs md:text-sm font-semibold text-gray-900">
            {isArabic
              ? "تمارا - دفعات شهرية. متوافق مع الشريعة"
              : "Tamara - Monthly payments. Sharia compliant"}
          </span>
        </div>
        <div ref={logoRef} className="shrink-0" />
      </div>

      {active && <div ref={summaryRef} className="mt-3" />}
    </div>
  );
}
