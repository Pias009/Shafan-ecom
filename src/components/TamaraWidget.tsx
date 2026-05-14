"use client";

import { useEffect, useState } from "react";

interface TamaraWidgetProps {
  price: number | string;
  currency: string;
}

export default function TamaraWidget({ price, currency }: TamaraWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_TAMARA_PUBLIC_KEY || "";

  useEffect(() => {
    setMounted(true);
    // Load Tamara widget script
    const scriptId = "tamara-widget-script";
    
    function initTamara() {
      if ((window as any).TamaraWidget) {
        (window as any).TamaraWidget.init({ lang: 'en' });
        (window as any).TamaraWidget.render();
      }
    }

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.tamara.co/widget/v2/tamara-widget.js";
      script.async = true;
      script.onload = initTamara;
      document.body.appendChild(script);
    } else {
      initTamara();
    }
  }, [price, currency]);

  if (!mounted) return null;

  return (
    <div className="my-4 min-h-[50px]">
      {/* @ts-ignore */}
      <tamara-widget
        type="pdp"
        amount={price.toString()}
        currency={currency}
        public-key={publicKey}
        language="en"
      />
    </div>
  );
}
