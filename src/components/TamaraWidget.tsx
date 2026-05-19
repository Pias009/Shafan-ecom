"use client";

import React, { useState } from "react";
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

  const [showModal, setShowModal] = useState(false);

  if (isNaN(currentPrice) || currentPrice <= 0) return null;

  // Strict decimal compliance: exactly 3 for KWD/BHD/OMR, exactly 2 for AED/SAR/QAR.
  const isThreeDecimals = ["KWD", "BHD", "OMR"].includes(currency?.toUpperCase());
  const formattedPrice = isThreeDecimals
    ? (currentPrice / 4).toFixed(3)
    : (currentPrice / 4).toFixed(2);

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
                <span 
                  onClick={() => setShowModal(true)}
                  className="underline font-medium text-[#1A1A1A] cursor-pointer hover:text-black transition-colors"
                >
                  المزيد من الخيارات
                </span>
              </>
            ) : (
              <>
                No late fees.{" "}
                <span 
                  onClick={() => setShowModal(true)}
                  className="underline font-medium text-[#1A1A1A] cursor-pointer hover:text-black transition-colors"
                >
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

      {/* Information Disclosure Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative" dir={isArabic ? "rtl" : "ltr"}>
            <button 
              onClick={() => setShowModal(false)}
              className={`absolute top-4 ${isArabic ? "left-4" : "right-4"} text-gray-500 hover:text-black z-10`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="p-6 bg-[#FFF9F5] border-b border-gray-100 flex items-center justify-between">
              <img 
                src={isArabic ? "/tamara-logo-gradient-ar.svg" : "/tamara-logo-gradient.svg"} 
                alt="Tamara" 
                className="h-[32px] w-auto object-contain block shrink-0"
              />
              <div className={`text-${isArabic ? "left" : "right"}`}>
                <p className="text-sm font-medium text-gray-600">{isArabic ? "المجموع" : "Total"}</p>
                <p className="text-xl font-bold text-black">{currentPrice.toFixed(isThreeDecimals ? 3 : 2)} {currency}</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-gray-900">
                {isArabic ? "كيف تعمل تمارا؟" : "How Tamara works"}
              </h3>
              
              <div className={`relative border-${isArabic ? "r" : "l"}-2 border-amber-300 ${isArabic ? "mr-4 pr-6" : "ml-4 pl-6"} space-y-6`}>
                {[
                  { label: isArabic ? "اليوم" : "Today", active: true },
                  { label: isArabic ? "الشهر ١" : "Month 1", active: false },
                  { label: isArabic ? "الشهر ٢" : "Month 2", active: false },
                  { label: isArabic ? "الشهر ٣" : "Month 3", active: false }
                ].map((step, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute ${isArabic ? "-right-[35px]" : "-left-[35px]"} top-1 w-4 h-4 ${step.active ? "bg-amber-400 border-4 border-white shadow-sm" : "bg-white border-2 border-amber-300"} rounded-full`}></div>
                    <p className="font-bold text-black">{step.label}</p>
                    <p className="text-gray-600 text-sm mt-1">{formattedPrice} {currency}</p>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => setShowModal(false)}
                className="w-full py-3 bg-black text-white font-bold rounded-xl mt-6 hover:bg-gray-800 transition-colors"
              >
                {isArabic ? "حسناً، فهمت" : "Got it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { TamaraWidget };
