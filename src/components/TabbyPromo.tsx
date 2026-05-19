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

  // Dynamic merchant code mapping based on currency
  const resolvedMerchantCode = (() => {
    const cleanCurrency = currency?.toUpperCase() || "AED";
    const baseCode = merchantCode || "SGAE";
    
    const currencyToCountry: Record<string, string> = {
      AED: "AE",
      SAR: "SA",
      KWD: "KW",
      BHD: "BH",
      OMR: "OM",
      QAR: "QA"
    };
    
    const targetCountry = currencyToCountry[cleanCurrency];
    if (!targetCountry) return baseCode;
    
    if (baseCode.endsWith("AE") && baseCode.length >= 4) {
      return baseCode.slice(0, -2) + targetCountry;
    }
    
    return `SG${targetCountry}`;
  })();

  useEffect(() => {
    const scriptId = "tabby-promo-script";

    function initPromo() {
      if (!(window as any).TabbyPromo || !containerRef.current) return;
      
      // Clear previous widget before re-rendering
      containerRef.current.innerHTML = "";
      
      try {
        new (window as any).TabbyPromo({
          selector: `#${id}`,
          currency: currency,
          price: price.toString(),
          installmentsCount: 4,
          lang: "en",
          source: "product",
          publicKey: publicKey,
          merchantCode: resolvedMerchantCode,
        });
      } catch (e) {
        console.warn("[TabbyPromo] Init error:", e);
      }
    }

    // Check if script is already loading or loaded
    const existingScript = document.getElementById(scriptId);
    
    if (existingScript) {
      if ((window as any).TabbyPromo) {
        initPromo();
      } else {
        existingScript.addEventListener('load', initPromo);
        return () => existingScript.removeEventListener('load', initPromo);
      }
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.tabby.ai/tabby-promo.js";
      script.async = true;
      script.onload = initPromo;
      document.body.appendChild(script);
    }
  }, [price, currency, publicKey, resolvedMerchantCode, id]);

  return (
    <div 
      key={`${id}-${price}-${currency}-${resolvedMerchantCode}`} // Force fresh mount on configuration change
      id={id} 
      ref={containerRef} 
      className="my-4 min-h-[50px] w-full" 
    />
  );
}
