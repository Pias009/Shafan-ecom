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

  useEffect(() => {
    // Tabby snippet initialization
    const script = document.createElement("script");
    script.src = "https://checkout.tabby.ai/tabby-promo.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if ((window as any).TabbyPromo) {
        new (window as any).TabbyPromo({
          selector: '#TabbyPromo',
          currency: currency,
          price: price.toString(),
          installmentsCount: 4,
          lang: "en",
          source: "product",
          publicKey: publicKey,
          merchantCode: merchantCode,
        });
      }
    };

    return () => {
      // Clean up if needed
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [price, currency, publicKey, merchantCode]);

  return (
    <div id="TabbyPromo" ref={containerRef} className="my-4 min-h-[50px]"></div>
  );
}
