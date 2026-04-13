"use client";

import { useState } from "react";
import { X, Globe, Languages } from "lucide-react";
import { useCountryStore } from "@/lib/country-store";
import { useLanguageStore, LanguageCode } from "@/lib/language-store";
import { motion, AnimatePresence } from "framer-motion";

const CURRENCY_LIST = [
  { code: "KWD", name: "Kuwait", flag: "🇰🇼" },
  { code: "AED", name: "UAE", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "BHD", name: "Bahrain", flag: "🇧🇭" },
  { code: "QAR", name: "Qatar", flag: "🇶🇦" },
  { code: "OMR", name: "Oman", flag: "🇴🇲" },
];

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

interface CountryLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CountryLanguageModal({ isOpen, onClose }: CountryLanguageModalProps) {
  const { selectedCurrency, setCurrency } = useCountryStore();
  const { currentLanguage, setLanguage } = useLanguageStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999]"
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
            onClick={onClose}
          />
          
          {/* Modal - Fixed Center */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed z-[10000]"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              maxWidth: "320px",
              height: "auto",
              maxHeight: "50vh",
              background: "#FFFFFF",
              borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              zIndex: 100001,
              padding: "20px",
              color: "#000000",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Currency Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={18} />
                <h3 style={{ 
                  fontSize: '12px', 
                  fontWeight: 900, 
                  color: '#000', 
                  opacity: 0.5,
                  textTransform: 'uppercase', 
                  letterSpacing: '0.15em',
                }}>
                  Select Country
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {CURRENCY_LIST.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => setCurrency(currency.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: selectedCurrency === currency.code ? '#000' : '#f5f5f5',
                      color: selectedCurrency === currency.code ? '#fff' : '#000',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span>{currency.flag}</span>
                    <span>{currency.code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-black/10 mb-6" />

            {/* Language Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Languages size={18} />
                <h3 style={{ 
                  fontSize: '12px', 
                  fontWeight: 900, 
                  color: '#000', 
                  opacity: 0.5,
                  textTransform: 'uppercase', 
                  letterSpacing: '0.15em',
                }}>
                  Select Language
                </h3>
              </div>
              <div className="flex gap-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as LanguageCode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: currentLanguage.code === lang.code ? '#000' : '#f5f5f5',
                      color: currentLanguage.code === lang.code ? '#fff' : '#000',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      flex: 1,
                    }}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}