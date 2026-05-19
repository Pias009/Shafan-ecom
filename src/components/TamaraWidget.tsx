"use client";

import React from "react";
import { useLanguageStore } from "@/lib/language-store";

interface TamaraWidgetProps {
  price: number | string;
  currency: string;
  country?: string;
  widgetType?: "product" | "cart" | "summary";
}

export default function TamaraWidget({ price, currency }: TamaraWidgetProps) {
  const currentPrice = Number(price);
  const { currentLanguage } = useLanguageStore();
  const isArabic = currentLanguage.code === "ar";

  if (isNaN(currentPrice) || currentPrice <= 0) return null;

  // Strict decimal compliance and official UAE manual rounding rules:
  // "Accurate Rounding: Apply standard rounding rules to the monthly payment shown. AED 208.33 -> AED 208."
  const isThreeDecimals = currency === "KWD" || currency === "BHD";
  const formattedPrice = isThreeDecimals
    ? (currentPrice / 4).toFixed(3)
    : Math.round(currentPrice / 4).toString();

  return (
    <div 
      className="w-full bg-white border border-[#EAEAEA] rounded-[16px] p-4 box-border shadow-sm m-0"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between w-full gap-4">
        
        {/* Left Side: Dynamic Messaging & Typographical Hierarchy */}
        <div className={`flex flex-col space-y-1 ${isArabic ? "items-start text-right" : "items-start text-left"}`}>
          <p className="text-[14px] md:text-[15px] text-[#1A1A1A] font-medium tracking-tight leading-snug m-0">
            {isArabic ? (
              <>
                قسّمها على 4 دفعات بقيمة <span className="font-bold text-black">{formattedPrice} {currency}</span>/الشهر.
              </>
            ) : (
              <>
                Pay <span className="font-bold text-black">{currency} {formattedPrice}/mo</span> or in 4 payments.
              </>
            )}
          </p>
          <p className="text-[12px] md:text-[13px] text-[#707070] font-normal leading-normal m-0">
            {isArabic ? (
              <>
                بدون رسوم تأخير.{" "}
                <span className="underline font-medium text-[#1A1A1A] cursor-pointer hover:text-black transition-colors">
                  المزيد من الخيارات
                </span>
              </>
            ) : (
              <>
                No late fees.{" "}
                <span className="underline font-medium text-[#1A1A1A] cursor-pointer hover:text-black transition-colors">
                  More options
                </span>
              </>
            )}
          </p>
        </div>

        {/* Right Side: Official Multi-Color Gradient Tamara Logo */}
        <div className="flex-shrink-0 flex items-center">
          <img 
            src={isArabic ? "/tamara-logo-gradient-ar.svg" : "/tamara-logo-gradient.svg"} 
            alt="Tamara" 
            className="h-[28px] w-auto object-contain block shrink-0"
          />
        </div>

      </div>
    </div>
  );
}

export { TamaraWidget };
