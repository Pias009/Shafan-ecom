import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LanguageCode = "en" | "ar";

interface Language {
  code: LanguageCode;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇰🇼" },
];

interface LanguageState {
  currentLanguage: Language;
  setLanguage: (code: LanguageCode) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      currentLanguage: SUPPORTED_LANGUAGES[0],
      setLanguage: (code) => {
        const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
        if (lang) {
          set({ currentLanguage: lang });
          // Only set lang attribute, no RTL
          if (typeof document !== 'undefined') {
            document.documentElement.lang = lang.code;
          }
        }
      },
    }),
    {
      name: "language-storage",
    }
  )
);
