"use client";

import { useEffect } from "react";

interface TamaraPromoProps {
  price: number | string;
  currency: string;
  publicKey: string;
}

export default function TamaraPromo({ price, currency, publicKey }: TamaraPromoProps) {
  useEffect(() => {
    // Load Tamara widget script
    const scriptId = "tamara-widget-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.tamara.co/widget/v2/tamara-widget.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="my-4 min-h-[50px]">
      {/* @ts-ignore */}
      <tamara-widget
        type="pdp"
        amount={price.toString()}
        currency={currency}
        public-key={publicKey}
        language="en"
        color-type="default"
        data-color-type="default"
      />
    </div>
  );
}
