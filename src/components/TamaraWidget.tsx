"use client";

import React from "react";

interface TamaraWidgetProps {
  price: number | string;
  currency: string;
  country?: string;
  widgetType?: "product" | "cart" | "summary";
}

export default function TamaraWidget({ price, currency }: TamaraWidgetProps) {
  const currentPrice = Number(price);
  if (isNaN(currentPrice) || currentPrice <= 0) return null;

  // Strict decimal compliance and official UAE manual rounding rules:
  // "Accurate Rounding: Apply standard rounding rules to the monthly payment shown. AED 208.33 -> AED 208."
  const isThreeDecimals = currency === "KWD" || currency === "BHD";
  const formattedPrice = isThreeDecimals
    ? (currentPrice / 4).toFixed(3)
    : Math.round(currentPrice / 4).toString();

  return (
    <div className="w-full bg-white border border-[#EAEAEA] rounded-[16px] p-4 my-3 box-border shadow-sm">
      <div className="flex items-center justify-between w-full gap-4">
        
        {/* Left Side: Dynamic Messaging & Typographical Hierarchy */}
        <div className="flex flex-col items-start space-y-1 text-left">
          <p className="text-[14px] md:text-[15px] text-[#1A1A1A] font-medium tracking-tight leading-snug m-0">
            Pay <span className="font-bold text-black">{currency} {formattedPrice}/mo</span> or in 4 payments.
          </p>
          <p className="text-[12px] md:text-[13px] text-[#707070] font-normal leading-normal m-0">
            No late fees.{" "}
            <span className="underline font-medium text-[#1A1A1A] cursor-pointer hover:text-black transition-colors">
              More options
            </span>
          </p>
        </div>

        {/* Right Side: Official Multi-Color Gradient Tamara Logo */}
        <div className="flex-shrink-0 ml-4 flex items-center">
          <img 
            src="/tamara-logo-gradient.svg" 
            alt="Tamara" 
            className="h-[22px] w-auto object-contain block shrink-0"
          />
        </div>

      </div>
    </div>
  );
}

export { TamaraWidget };
