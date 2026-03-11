"use client";

import { demoCategories } from "@/lib/demo-data";

export function CategorySection({
  onPick,
}: {
  onPick: (category: (typeof demoCategories)[number]["label"]) => void;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-6">
      <div className="grid gap-4 md:grid-cols-3">
        {demoCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.label)}
            className="glass glass-3d ring-icy group relative overflow-hidden rounded-3xl p-6 text-left transition hover:translate-y-[-2px]"
          >
            <div className="text-xs font-medium uppercase tracking-[0.25em] text-white/60">
              Category
            </div>
            <div className="mt-2 text-xl font-semibold tracking-tight text-white">
              {c.label}
            </div>
            <div className="mt-2 text-sm leading-6 text-white/70">{c.description}</div>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/90">
              Quick navigation
              <span className="transition group-hover:translate-x-0.5">→</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

