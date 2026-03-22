"use client";

import { demoCategories } from "@/lib/demo-data";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

export function CategorySection({
  onPick,
}: {
  onPick: (category: (typeof demoCategories)[number]["label"]) => void;
}) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 pt-6 md:pt-10 pb-3 md:pb-4">
      <div className="text-center mb-6 md:mb-8">
        <p className="font-body text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] text-black/40 font-black">
          {currentLanguage.code === "ar" ? "تسوق حسب الفئة" : "Shop by category"}
        </p>
        <h2 className="font-display text-2xl md:text-4xl text-black mt-1 md:mt-2 font-black">
          {currentLanguage.code === "ar" ? "تصفح المجموعة" : "Browse Collection"}
        </h2>
      </div>

      <div className="flex items-center justify-start md:justify-center gap-2 md:gap-4 overflow-x-auto pb-4 md:pb-0 md:flex-wrap md:overflow-visible px-4 md:px-0 no-scrollbar">
        {demoCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.label)}
            className="glass-panel flex-shrink-0 px-3 md:px-10 py-1.5 md:py-5 rounded-xl md:rounded-[2.5rem] font-display text-xs md:text-xl text-black font-black tracking-wider transition-all duration-300 hover:bg-black hover:text-white group border border-black/5 hover:scale-105 active:scale-95 shadow-sm hover:shadow-xl min-w-max"
          >
            <span className="block text-[5px] md:text-[8px] font-black uppercase tracking-widest text-black/30 group-hover:text-white/50 mb-0.5 md:mb-1">
              {c.description ?? (currentLanguage.code === "ar" ? "فئة" : "Category")}
            </span>
            {c.label}
          </button>
        ))}
      </div>
    </section>
  );
}
