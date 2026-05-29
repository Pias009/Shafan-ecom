"use client";

import { useEffect } from "react";

interface TabbyPromoInstance {
  new (config: {
    selector: string;
    currency: string;
    price: string;
    install_snippet: string;
    lang: string;
  }): void;
}

interface PaymentSelectionProps {
  currentCurrency: string;
  totalCartAmount: number;
}

export default function PaymentSelection({ currentCurrency, totalCartAmount }: PaymentSelectionProps) {
  useEffect(() => {
    const scriptId = "tabby-promo-script";

    function initCheckoutSnippet() {
      const TabbyPromo = (window as unknown as { TabbyPromo?: TabbyPromoInstance }).TabbyPromo;
      if (!TabbyPromo) return;

      try {
        new TabbyPromo({
          selector: "#tabby-checkout-snippet",
          currency: currentCurrency,
          price: totalCartAmount.toString(),
          install_snippet: "checkout",
          lang: "en",
        });
      } catch (e) {
        console.warn("[Tabby Checkout] Init error:", e);
      }
    }

    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      const TabbyPromo = (window as unknown as { TabbyPromo?: TabbyPromoInstance }).TabbyPromo;
      if (TabbyPromo) {
        initCheckoutSnippet();
      } else {
        existingScript.addEventListener("load", initCheckoutSnippet);
        return () => existingScript.removeEventListener("load", initCheckoutSnippet);
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
