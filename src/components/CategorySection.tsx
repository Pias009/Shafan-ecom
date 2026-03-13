"use client";

import { demoCategories } from "@/lib/demo-data";

export function CategorySection({
  onPick,
}: {
  onPick: (category: (typeof demoCategories)[number]["label"]) => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-10">
      <div className="text-center mb-8">
        <p className="font-body text-xs uppercase tracking-[0.25em] text-black/60 font-bold">Shop by category</p>
        <h2 className="font-display text-3xl text-black mt-2 font-bold">Browse Collection</h2>
      </div>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        {demoCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.label)}
            className="glass-panel px-8 py-4 rounded-full font-display text-lg text-black font-bold tracking-wider transition-all duration-300 hover:bg-black hover:text-white group"
          >
            <span className="block text-xs font-body font-bold uppercase tracking-widest text-black/50 group-hover:text-white/70 mb-0.5">
              {c.description ?? "Category"}
            </span>
            {c.label}
          </button>
        ))}
      </div>
    </section>
  );
}
