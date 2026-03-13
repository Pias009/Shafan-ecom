"use client";

import { demoBrands } from "@/lib/demo-data";

export function BrandMarquee() {
  const items = [...demoBrands, ...demoBrands];

  return (
    <section id="brands" className="mx-auto max-w-7xl px-6 pt-6">
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-10 md:py-16 text-center">
          <div className="font-body text-xs font-bold uppercase tracking-[0.25em] text-black/60">
            Brands
          </div>
          <div className="font-display mt-3 text-4xl md:text-5xl font-bold text-black">
            Our partner brands
          </div>
          <p className="font-body text-black/70 mt-4 max-w-xl mx-auto">
            Curated partners in premium skincare
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-8">
            {demoBrands.slice(0, 4).map((b, idx) => (
              <div
                key={`${b.id}-${idx}`}
                className="glass-panel rounded-2xl p-8 hover:scale-[1.02] transition-transform duration-500 cursor-pointer group text-left"
              >
                <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center mb-5 ring-1 ring-black/10 p-2 shadow-sm">
                  <span className="font-display text-2xl text-white">{b.name[0]}</span>
                </div>
                <h3 className="font-display text-2xl text-black mb-1 font-bold">
                  {b.name}
                </h3>
                <p className="font-body text-sm text-black/70 italic">
                  Premium collection
                </p>
                <p className="font-body text-xs text-black/60 mt-4 font-bold">
                  Explore products →
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
