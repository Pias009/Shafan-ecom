"use client";

import { useEffect, useRef } from "react";

interface TabbyPromoProps {
  price: number | string;
  currency: string;
  publicKey: string;
  merchantCode: string;
  id?: string;
}

export default function TabbyPromo({ price, currency, publicKey, merchantCode, id = "TabbyPromo" }: TabbyPromoProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = "tabby-promo-script";

    function initPromo() {
      if (!(window as any).TabbyPromo || !containerRef.current) return;
      // Clear previous widget before re-rendering
      if (containerRef.current) containerRef.current.innerHTML = "";
      try {
        new (window as any).TabbyPromo({
          selector: `#${id}`,
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
      initPromo();
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.tabby.ai/tabby-promo.js";
      script.async = true;
      script.onload = initPromo;
      document.body.appendChild(script);
    }
  }, [price, currency, publicKey, merchantCode, id]);

  return (
    <div id={id} ref={containerRef} className="my-4 min-h-[50px]" />
  );
}
