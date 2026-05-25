"use client";

import { useEffect, useRef } from "react";

interface TamaraPromoProps {
  price: number | string;
  currency: string;
  publicKey: string;
}

export default function TamaraPromo({ price }: TamaraPromoProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Tamara widget script
    const scriptId = "tamara-widget-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn-sandbox.tamara.co/widget-v2/tamara-widget.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // Imperatively create the custom element so TypeScript doesn't complain
    const container = containerRef.current;
    if (!container) return;

    if (!container.querySelector("tamara-widget")) {
      const widget = document.createElement("tamara-widget");
      widget.setAttribute("type", "tamara-summary");
      widget.setAttribute("amount", Number(price).toFixed(2));
      widget.setAttribute("inline-type", "2");
      widget.setAttribute(
        "config",
        '{"theme":"light","badgePosition":"","showExtraContent":"","hidePayInX":false}'
      );
      container.appendChild(widget);
    } else {
      const widget = container.querySelector("tamara-widget") as HTMLElement;
      widget.setAttribute("amount", Number(price).toFixed(2));
    }
  }, [price]);

  return <div ref={containerRef} className="my-4 min-h-[50px]" />;
}
