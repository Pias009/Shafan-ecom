"use client";

import { useLanguageStore, SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/language-store";
import { useState } from "react";

export function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguageStore();
  const [open, setOpen] = useState(false);

  const current = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage.code) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/5 hover:bg-black/10 transition"
      >
        <span className="text-lg">{current.flag}</span>
        <span className="text-sm font-semibold uppercase">{current.code}</span>
      </button>
      
      {open && (
        <div className="absolute top-full right-0 mt-2 w-40 glass-panel-heavy rounded-xl p-2 shadow-xl z-50">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as LanguageCode);
                setOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition ${
                currentLanguage.code === lang.code 
                  ? "bg-black text-white" 
                  : "hover:bg-black/5"
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}