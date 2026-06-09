"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { CreditCard, ShieldCheck } from "lucide-react";

interface PaymentSelectionProps {
  currentCurrency: string;
  totalCartAmount: number;
  activePayment: string | null;
  onPaymentSelect: (method: string) => void;
  useBillingAddress?: boolean;
  onBillingToggle?: () => void;
  lang: string;
  currentCountry?: string;
}

const TAMARA_SCRIPT_SRC =
  "https://cdn.tamara.co/widget-v2/tamara-widget.js";
const TAMARA_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_TAMARA_PUBLIC_KEY || "a5e7eb67-561b-479c-84f1-a5a44d5fce1d";

function TabbySnippet({
  currentCurrency,
  totalCartAmount,
  lang,
}: {
  currentCurrency: string;
  totalCartAmount: number;
  lang: string;
}) {
  useEffect(() => {
    const scriptId = "tabby-promo-script";

    function initCheckoutSnippet() {
      const TabbyPromo = (
        window as unknown as { TabbyPromo?: new (config: Record<string, string>) => void }
      ).TabbyPromo;
      if (!TabbyPromo) return;

      try {
        new TabbyPromo({
          selector: "#tabby-checkout-snippet",
          currency: currentCurrency,
          price: totalCartAmount.toString(),
          install_snippet: "checkout",
          lang,
        });
      } catch (e) {
        console.warn("[Tabby Checkout] Init error:", e);
      }
    }

    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      const TabbyPromo = (
        window as unknown as { TabbyPromo?: new (config: Record<string, string>) => void }
      ).TabbyPromo;
      if (TabbyPromo) {
        initCheckoutSnippet();
      } else {
        existingScript.addEventListener("load", initCheckoutSnippet);
        return () =>
          existingScript.removeEventListener("load", initCheckoutSnippet);
      }
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.tabby.ai/tabby-promo.js";
      script.async = true;
      script.onload = initCheckoutSnippet;
      document.body.appendChild(script);
    }
  }, [currentCurrency, totalCartAmount]);

  return <div id="tabby-checkout-snippet" />;
}

export default function PaymentSelection({
  currentCurrency,
  totalCartAmount,
  activePayment,
  onPaymentSelect,
  useBillingAddress,
  onBillingToggle,
  lang,
  currentCountry,
}: PaymentSelectionProps) {
  const showInstallments = currentCountry === "AE" || currentCountry === "SA";
  const tamaraSummaryRef = useRef<HTMLDivElement>(null);
  const tamaraLogoRef = useRef<HTMLDivElement>(null);

  function handleTamaraScriptLoad() {
    window.tamaraWidgetConfig = {
      lang,
      country: currentCurrency === "KWD" ? "KW" : "AE",
      publicKey: TAMARA_PUBLIC_KEY,
    };
  }

  // Mount tamara-logo widget
  useEffect(() => {
    if (!tamaraLogoRef.current) return;
    let logo = tamaraLogoRef.current.querySelector(
      "tamara-widget"
    ) as HTMLElement | null;
    if (!logo) {
      logo = document.createElement("tamara-widget");
      logo.setAttribute("type", "tamara-logo");
      tamaraLogoRef.current.appendChild(logo);
    }
  }, []);

  // Mount or update tamara-summary with lang='en' enforced
  useEffect(() => {
    if (activePayment !== "tamara" || !tamaraSummaryRef.current) return;

    let widget = tamaraSummaryRef.current.querySelector(
      "tamara-widget"
    ) as HTMLElement | null;
    if (!widget) {
      widget = document.createElement("tamara-widget");
      widget.setAttribute("type", "tamara-summary");
      widget.setAttribute("inline-type", "2");
      widget.setAttribute("currency", currentCurrency);
      widget.setAttribute("theme", "light");
      widget.setAttribute("lang", lang);
      tamaraSummaryRef.current.appendChild(widget);
    }
    widget.setAttribute("amount", String(totalCartAmount));
    widget.setAttribute("lang", lang);

    if (window.TamaraWidgetV2?.refresh) {
      window.TamaraWidgetV2.refresh();
    }
  }, [activePayment, totalCartAmount, currentCurrency, lang]);

  return (
    <div className="space-y-3">
      <Script
        src={TAMARA_SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={handleTamaraScriptLoad}
      />

      {/* Card Payment */}
      <div>
        <button
          type="button"
          onClick={() => onPaymentSelect("stripe")}
          className={`w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50/50 transition-all shadow-sm ${
            activePayment === "stripe" ? "ring-2 ring-black" : ""
          }`}
        >
          <div className="flex items-center flex-1 min-w-0">
            <div className="w-12 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <CreditCard className="w-5 h-5 text-gray-700" />
            </div>
            <span className="flex-1 pl-4 text-left text-sm font-medium text-gray-900">
              Card Payment
            </span>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 transition-colors ${
              activePayment === "stripe" ? "border-black" : "border-gray-300"
            }`}
          >
            {activePayment === "stripe" && (
              <div className="w-2.5 h-2.5 rounded-full bg-black" />
            )}
          </div>
        </button>

        {activePayment === "stripe" && (
          <div className="mt-3 px-4 pb-2 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Card number"
                readOnly
                value="4242 4242 4242 4242"
                className="col-span-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-500 cursor-default"
              />
              <input
                placeholder="MM / YY"
                readOnly
                value="12 / 28"
                className="rounded-xl px-3.5 py-2.5 text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-500 cursor-default"
              />
              <input
                placeholder="CVC"
                readOnly
                value="123"
                className="rounded-xl px-3.5 py-2.5 text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-500 cursor-default"
              />
            </div>
            {onBillingToggle && (
              <label className="flex items-center gap-2 cursor-pointer group py-1">
                <input
                  type="checkbox"
                  checked={!!useBillingAddress}
                  onChange={onBillingToggle}
                  className="w-3.5 h-3.5 rounded border-2 border-gray-300 accent-black cursor-pointer"
                />
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-gray-700 select-none">
                  Use shipping address as my billing address
                </span>
              </label>
            )}
            <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-wider pt-1">
              <ShieldCheck className="w-3 h-3" />
              Secured by Stripe
            </div>
          </div>
        )}
      </div>

      {/* Tabby — UAE & SA only */}
      {showInstallments && <div>
        <button
          type="button"
          onClick={() => onPaymentSelect("tabby")}
          className={`w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50/50 transition-all shadow-sm ${
            activePayment === "tabby" ? "ring-2 ring-black" : ""
          }`}
        >
          <div className="flex items-center flex-1 min-w-0">
            <div className="w-12 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center p-1.5 shadow-sm shrink-0">
              <img
                src="/tabby-logo.svg"
                alt="Tabby"
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="flex-1 pl-4 text-left">
              <span className="block text-sm font-medium text-gray-900">
                Pay later with Tabby
              </span>
              <span className="block text-[10px] text-gray-500 font-medium mt-0.5">
                Use any card
              </span>
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 transition-colors ${
              activePayment === "tabby" ? "border-black" : "border-gray-300"
            }`}
          >
            {activePayment === "tabby" && (
              <div className="w-2.5 h-2.5 rounded-full bg-black" />
            )}
          </div>
        </button>

        {activePayment === "tabby" && (
          <div className="mt-3 px-4 pb-2">
            <TabbySnippet
              currentCurrency={currentCurrency}
              totalCartAmount={totalCartAmount}
              lang={lang}
            />
          </div>
        )}
      </div>}

      {/* Tamara — UAE & SA only */}
      {showInstallments && <div>
        <button
          type="button"
          onClick={() => onPaymentSelect("tamara")}
          className={`w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50/50 transition-all shadow-sm ${
            activePayment === "tamara" ? "ring-2 ring-black" : ""
          }`}
        >
          <div className="flex items-center flex-1 min-w-0">
            <div className="bg-white border border-gray-100 rounded-xl flex items-center justify-center px-3 py-2 shadow-sm shrink-0">
              <img
                src="https://cdn.tamara.co/assets/png/tamara-logo-badge-en.png"
                alt="Tamara Payment Option"
                className="h-6 w-auto object-contain"
              />
            </div>
            <span className="flex-1 pl-4 text-left text-sm font-medium text-gray-900">
              Tamara
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <div ref={tamaraLogoRef} />
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                activePayment === "tamara" ? "border-black" : "border-gray-300"
              }`}
            >
              {activePayment === "tamara" && (
                <div className="w-2.5 h-2.5 rounded-full bg-black" />
              )}
            </div>
          </div>
        </button>

        {activePayment === "tamara" && (
          <div className="mt-3 px-4 pb-2">
            <div ref={tamaraSummaryRef} />
          </div>
        )}
      </div>}

      {/* Cash on Delivery */}
      <div>
        <button
          type="button"
          onClick={() => onPaymentSelect("cod")}
          className={`w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50/50 transition-all shadow-sm ${
            activePayment === "cod" ? "ring-2 ring-black" : ""
          }`}
        >
          <div className="flex items-center flex-1 min-w-0">
            <div className="w-12 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <span className="text-lg font-bold text-gray-400">$</span>
            </div>
            <span className="flex-1 pl-4 text-left text-sm font-medium text-gray-900">
              Cash on Delivery
            </span>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 transition-colors ${
              activePayment === "cod" ? "border-black" : "border-gray-300"
            }`}
          >
            {activePayment === "cod" && (
              <div className="w-2.5 h-2.5 rounded-full bg-black" />
            )}
          </div>
        </button>

        {activePayment === "cod" && (
          <div className="mt-3 px-4 pb-2">
            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
              Pay with cash or card when your order arrives at your doorstep.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
