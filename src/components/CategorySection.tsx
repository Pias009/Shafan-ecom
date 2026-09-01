"use client";

import { useLanguageStore } from "@/lib/language-store";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const demoCategories = [
  { id: "c1", label: "SERUMS", categoryQuery: "Skin Care", image: "/images/serum.png" },
  { id: "c2", label: "MOISTURIZERS", categoryQuery: "Skin Care", image: "/images/cream.png" },
  { id: "c3", label: "CLEANSERS", categoryQuery: "Skin Care", image: "/images/hero-radiant.png" },
  { id: "c4", label: "TONERS", categoryQuery: "Hair Care", image: "/images/cat-skin.png" },
  { id: "c5", label: "EYE CARE", categoryQuery: "Body Care", image: "/images/cat-hair.png" },
  { id: "c6", label: "SUN CARE", categoryQuery: "Fragrances", image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=400&q=80" },
];

export function CategorySection({
  onPick,
}: {
  onPick: (category: string) => void;
}) {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage.code === "ar";

  return (
    <section className="mx-auto max-w-[1536px] px-2 sm:px-4 pt-8 sm:pt-12 pb-8 sm:pb-12">
      
      {/* Header Accent Line: --> SHOP BY CATEGORY <-- */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center justify-center gap-3 text-xs sm:text-sm font-black uppercase tracking-widest text-white drop-shadow-sm">
          <span className="h-px w-8 sm:w-12 bg-white/40" />
          <span>{isAr ? "تسوق حسب الفئة" : "SHOP BY CATEGORY"}</span>
          <span className="h-px w-8 sm:w-12 bg-white/40" />
        </div>
      </div>

      {/* 6 Circular Category Thumbnail Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-6 lg:gap-8 justify-items-center">
        {demoCategories.map((c, idx) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            onClick={() => onPick(c.categoryQuery)}
            className="group flex flex-col items-center cursor-pointer text-center transform-gpu"
          >
            {/* Mint Backdrop Circle with 3D Depth Elevation */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-white/95 border border-white/80 group-hover:border-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] group-hover:shadow-[0_14px_28px_rgba(0,0,0,0.2)] group-hover:-translate-y-2 group-hover:bg-white transition-all duration-300 ease-out flex items-center justify-center p-2.5 sm:p-3 overflow-hidden transform-gpu">
              <div className="relative w-full h-full">
                <Image
                  src={c.image}
                  alt={c.label}
                  fill
                  className="object-contain p-1 group-hover:scale-115 transition-transform duration-500 ease-out"
                  sizes="(max-width: 640px) 25vw, 15vw"
                />
              </div>
            </div>

            {/* Category Title & Explore Subtitle */}
            <h3 className="mt-3 font-display font-bold text-[11px] sm:text-sm text-white tracking-wider uppercase group-hover:text-white/90 transition-colors drop-shadow-sm">
              {c.label}
            </h3>
            <span className="text-[10px] sm:text-xs font-semibold text-white/80 mt-0.5 group-hover:underline group-hover:text-white">
              Explore
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

