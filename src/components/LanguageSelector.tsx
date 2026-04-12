"use client";

import { useLanguageStore, SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/language-store";

export function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguageStore();

  return (
    <div className="flex flex-col items-center">
      <span style={{ 
        fontSize: '10px', 
        fontWeight: 900, 
        color: '#000', 
        opacity: 0.5,
        textTransform: 'uppercase', 
        letterSpacing: '0.15em',
        marginBottom: '8px'
      }}>
        Language
      </span>
      <div className="flex gap-2">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code as LanguageCode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              background: currentLanguage.code === lang.code ? '#000' : '#f0f0f0',
              color: currentLanguage.code === lang.code ? '#fff' : '#000',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>{lang.flag}</span>
            <span className="uppercase">{lang.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
