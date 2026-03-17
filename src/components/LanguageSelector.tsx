"use client";

import { useLanguageStore, SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/language-store";
import { useState, useEffect, useRef } from "react";
import { Languages, ChevronDown, Check } from "lucide-react";

export function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize lang on load
    document.documentElement.lang = currentLanguage.code;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [currentLanguage]);

  if (!mounted) return (
      <div className="glass-panel h-9 w-12 rounded-full animate-pulse bg-black/5" />
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-panel flex h-9 items-center gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-black/5 shadow-sm"
      >
        <Languages size={14} className="text-black/40" />
        <span>{currentLanguage.code.toUpperCase()}</span>
        <ChevronDown size={10} className={`text-black/20 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 glass-panel-heavy rounded-2xl p-2 border border-black/5 shadow-2xl z-[60] bg-white/95 backdrop-blur-xl transition-all animate-in fade-in zoom-in duration-200">
          <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-black/20 border-b border-black/5 mb-1">
            {currentLanguage.code === "ar" ? "اختر اللغة" : "Select Language"}
          </div>
          <div className="space-y-1">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as LanguageCode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  currentLanguage.code === lang.code
                    ? "bg-black/5 text-black border border-black/10 shadow-sm scale-[0.98]"
                    : "text-black/60 hover:bg-black/5 hover:text-black"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
                {currentLanguage.code === lang.code && <Check size={12} className="text-black/40" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
