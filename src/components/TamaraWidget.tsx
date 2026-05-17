"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

interface TamaraWidgetProps {
  price: number | string;
  currency: string;
  country?: string;
  widgetType?: "product" | "cart" | "summary";
}

export default function TamaraWidget({ price, currency, country = "AE", widgetType = "summary" }: TamaraWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_TAMARA_PUBLIC_KEY || "561ee41b-e351-4543-ab2d-934866b6b8af";

  useEffect(() => {
    setMounted(true);
    
    // Set global config before script loads
    if (typeof window !== "undefined") {
      (window as any).tamaraWidgetConfig = {
        lang: 'en',
        country: country.toUpperCase(),
        publicKey: publicKey,
        style: {
          fontSize: '14px',
          badgeRatio: 1.0,
        }
      };
    }

    const refreshTamara = () => {
      if ((window as any).TamaraWidgetV2) {
        try {
          (window as any).TamaraWidgetV2.refresh();
        } catch (e) {
          console.warn("Tamara Refresh Error:", e);
        }
      }
    };

    if (mounted) {
      refreshTamara();
      // Periodically try to refresh in case script loads later
      const timer = setTimeout(refreshTamara, 1000);
      const timer2 = setTimeout(refreshTamara, 3000);
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
  }, [mounted, price, currency, country, publicKey]);

  if (!mounted) return null;

  const formattedAmount = Number(price).toFixed(2);

  return (
    <div className="my-4 min-h-[60px] w-full">
      <Script 
        src="https://cdn.tamara.co/widget-v2/tamara-widget.js" 
        strategy="afterInteractive"
        onLoad={() => {
          if ((window as any).TamaraWidgetV2) {
            try {
              (window as any).TamaraWidgetV2.refresh();
            } catch (e) {
              console.error("Tamara OnLoad Error:", e);
            }
          }
        }}
      />
      
      {/* Official Tamara V2 Widget Tag */}
      {widgetType === "product" ? (
        // @ts-ignore
        <tamara-product-widget
          key={`tamara-product-${price}-${currency}-${country}`}
          amount={formattedAmount}
          currency={currency.toUpperCase()}
          country={country.toUpperCase()}
          language="en"
        />
      ) : widgetType === "cart" ? (
        // @ts-ignore
        <tamara-cart-widget
          key={`tamara-cart-${price}-${currency}-${country}`}
          amount={formattedAmount}
          currency={currency.toUpperCase()}
          country={country.toUpperCase()}
          language="en"
        />
      ) : (
        // @ts-ignore
        <tamara-widget
          key={`tamara-v2-${price}-${currency}-${country}`}
          type="tamara-summary"
          amount={formattedAmount}
          currency={currency.toUpperCase()}
          country={country.toUpperCase()}
          language="en"
        />
      )}
    </div>
  );
}
