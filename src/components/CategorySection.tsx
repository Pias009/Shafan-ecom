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
    <section className="mx-auto max-w-7xl px-6 pt-10 pb-4">
      <div className="text-center mb-8">
        <p className="font-body text-[10px] uppercase tracking-[0.25em] text-black/40 font-black">
          {currentLanguage.code === "ar" ? "تسوق حسب الفئة" : "Shop by category"}
        </p>
        <h2 className="font-display text-4xl text-black mt-2 font-black">
          {currentLanguage.code === "ar" ? "تصفح المجموعة" : "Browse Collection"}
        </h2>
      </div>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        {demoCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.label)}
            className="glass-panel px-10 py-5 rounded-[2.5rem] font-display text-xl text-black font-black tracking-wider transition-all duration-300 hover:bg-black hover:text-white group border border-black/5 hover:scale-105 active:scale-95 shadow-sm hover:shadow-xl"
          >
            <span className="block text-[8px] font-black uppercase tracking-widest text-black/30 group-hover:text-white/50 mb-1">
              {c.description ?? (currentLanguage.code === "ar" ? "فئة" : "Category")}
            </span>
            {c.label}
          </button>
        ))}
      </div>
    </section>
  );
}
