"use client";

import { demoBrands } from "@/lib/demo-data";

export function BrandMarquee() {
  const items = [...demoBrands, ...demoBrands];

  return (
    <section id="brands" className="mx-auto max-w-6xl px-4 pt-6">
      <div className="glass glass-3d ring-icy overflow-hidden rounded-3xl">
        <div className="px-6 py-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.25em] text-white/60">
                Brands
              </div>
              <div className="mt-2 text-xl font-semibold tracking-tight text-white">
                A layer of icons that moves right-to-left
              </div>
            </div>
            <div className="hidden text-xs text-white/55 md:block">Live marquee</div>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-white/5 py-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/35 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/35 to-transparent" />

          <div className="overflow-hidden">
            <div className="marquee gap-3 px-6">
              {items.map((b, idx) => (
                <div
                  key={`${b.id}-${idx}`}
                  className="glass glass-3d ring-icy inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-white/85"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-lg ring-1 ring-white/15">
                    {b.icon}
                  </div>
                  <div className="text-sm font-semibold">{b.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

