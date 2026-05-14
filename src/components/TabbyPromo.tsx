"use client";

import { useEffect, useRef } from "react";

interface TabbyPromoProps {
  price: number | string;
  currency: string;
  publicKey: string;
  merchantCode: string;
}

export default function TabbyPromo({ price, currency, publicKey, merchantCode }: TabbyPromoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    const scriptId = "tabby-promo-script";

    function initPromo() {
      if (!(window as any).TabbyPromo || !containerRef.current) return;
      // Clear previous widget before re-rendering
      if (containerRef.current) containerRef.current.innerHTML = "";
      try {
        new (window as any).TabbyPromo({
          selector: "#TabbyPromo",
          currency: currency,
          price: price.toString(),
          installmentsCount: 4,
          lang: "en",
          source: "product",
          publicKey: publicKey,
          merchantCode: merchantCode,
        });
      } catch (e) {
        console.warn("[TabbyPromo] Init error:", e);
      }
    }

    if (document.getElementById(scriptId)) {
      // Script already loaded — just re-init
      initPromo();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://checkout.tabby.ai/tabby-promo.js";
    script.async = true;
    script.onload = initPromo;
    document.body.appendChild(script);

    // Cleanup: only remove if this is the unmount of the LAST consumer
    // We intentionally leave the script tag for performance (re-used globally)
  }, [price, currency, publicKey, merchantCode]);

  return (
    <div id="TabbyPromo" ref={containerRef} className="my-4 min-h-[50px]" />
  );
}
