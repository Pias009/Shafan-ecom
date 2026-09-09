"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight } from "lucide-react";

export function SkincareDiagnosticBanner() {
  return (
    <section className="pt-4 sm:pt-6 pb-4 sm:pb-6 px-1 sm:px-2">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#400327] via-[#540434] to-[#260117] border border-pink-500/20 p-4 sm:p-6 md:p-8 shadow-[0_12px_36px_rgba(84,4,52,0.25)]">
        {/* Subtle ambient light bursts */}
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-48 h-48 bg-[#890754]/25 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-row items-center justify-between gap-3 sm:gap-6">
          {/* Left: Punchy concise copy */}
          <div className="flex-1 min-w-0 pr-1 sm:pr-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-pink-200 text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-2">
              <Sparkles size={11} className="text-pink-300" />
              <span>Clinical Diagnostic</span>
            </div>

            <h2 className="font-serif text-base sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
              Build Your Custom Routine in <span className="wave-text">60s</span>
            </h2>

            <p className="font-sans text-[11px] sm:text-xs md:text-sm text-white/75 mt-1.5 leading-relaxed line-clamp-2 max-w-md">
              Certified dermatologist formulas matched to your skin type and GCC climate.
            </p>

            {/* Action CTA Row */}
            <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
              <Link
                href="/routines"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#890754] hover:bg-white text-white hover:text-[#890754] border border-pink-400/40 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <span>Start Assessment</span>
                <ArrowRight size={12} />
              </Link>
              <Link
                href="/products?sort=best-selling"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-pink-200 hover:text-white transition-colors"
              >
                <span>Browse Sets</span>
                <ArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* Right: High-resolution visual cosmetic photography */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-52 md:h-52 lg:w-60 lg:h-60 rounded-2xl overflow-hidden shadow-xl border border-white/20 shrink-0 transform-gpu group">
            <Image
              src="/images/routine-diagnostic-visual.jpg"
              alt="Clinical Skincare Diagnostic Routine"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 112px, (max-width: 1024px) 210px, 260px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-bold tracking-wider uppercase border border-white/10">
              3-Step Plan
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
