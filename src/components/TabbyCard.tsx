"use client";

import { useEffect, useRef } from "react";

interface TabbyCardProps {
  price: number | string;
  currency: string;
  publicKey: string;
  merchantCode: string;
  id?: string;
}

export default function TabbyCard({ price, currency, publicKey, merchantCode, id = "tabbyCard" }: TabbyCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = "tabby-card-script";

    function initCard() {
      if (!(window as any).TabbyCard || !containerRef.current) return;
      
      // Clear previous widget before re-rendering
      containerRef.current.innerHTML = "";
      
      try {
        new (window as any).TabbyCard({
          selector: `#${id}`,
          currency: currency,
          price: price.toString(),
          installmentsCount: 4,
          lang: "en",
          publicKey: publicKey,
          merchantCode: merchantCode,
        });
        console.log(`[TabbyCard] Initialized widget for selector: #${id}`);
      } catch (e) {
        console.warn("[TabbyCard] Init error:", e);
      }
    }

    // Check if script is already loading or loaded
    const existingScript = document.getElementById(scriptId);
    
    if (existingScript) {
      if ((window as any).TabbyCard) {
        initCard();
      } else {
        // Script is added but not yet loaded
        existingScript.addEventListener('load', initCard);
        return () => existingScript.removeEventListener('load', initCard);
      }
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.tabby.ai/tabby-card.js";
      script.async = true;
      script.onload = initCard;
      document.body.appendChild(script);
    }
  }, [price, currency, publicKey, merchantCode, id]);

  return (
    <div 
      key={`${id}-${price}`} // Force fresh mount if price changes
      id={id} 
      ref={containerRef} 
      className="my-2 min-h-[40px] w-full" 
    />
  );
}
