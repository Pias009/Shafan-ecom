"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/lib/language-store";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface CategoryItem {
  id: string;
  name: string;
  image?: string | null;
  link?: string | null;
  slug?: string | null;
}

const defaultCategories = [
  { id: "c1", name: "SERUMS", link: "/products?category=Skin%20Care", image: "/images/serum.png" },
  { id: "c2", name: "MOISTURIZERS", link: "/products?category=Skin%20Care", image: "/images/cream.png" },
  { id: "c3", name: "CLEANSERS", link: "/products?category=Skin%20Care", image: "/images/hero-radiant.png" },
  { id: "c4", name: "TONERS", link: "/products?category=Hair%20Care", image: "/images/cat-skin.png" },
  { id: "c5", name: "EYE CARE", link: "/products?category=Body%20Care", image: "/images/cat-hair.png" },
  { id: "c6", name: "SUN CARE", link: "/products?category=Fragrances", image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=400&q=80" },
];

export function CategorySection({
  onPick,
}: {
  onPick: (category: string) => void;
}) {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage.code === "ar";
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
          } else {
            setCategories(defaultCategories);
          }
        } else {
          setCategories(defaultCategories);
        }
      } catch (err) {
        console.error("Failed to load homepage categories:", err);
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const itemsToRender = categories.length > 0 ? categories : defaultCategories;

  const handleCategoryClick = (cat: CategoryItem) => {
    if (cat.link) {
      router.push(cat.link);
    } else {
      onPick(cat.name);
    }
  };

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

      {/* Circular Category Thumbnail Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-6 lg:gap-8 justify-items-center">
        {itemsToRender.map((c, idx) => {
          const imageUrl = c.image || defaultCategories[idx % defaultCategories.length].image;
          
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              onClick={() => handleCategoryClick(c)}
              className="group flex flex-col items-center cursor-pointer text-center transform-gpu"
            >
              {/* Mint Backdrop Circle with 3D Depth Elevation */}
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-white/95 border border-white/80 group-hover:border-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] group-hover:shadow-[0_14px_28px_rgba(0,0,0,0.2)] group-hover:-translate-y-2 group-hover:bg-white transition-all duration-300 ease-out flex items-center justify-center p-2.5 sm:p-3 overflow-hidden transform-gpu">
                <div className="relative w-full h-full">
                  <Image
                    src={imageUrl}
                    alt={c.name}
                    fill
                    className="object-contain p-1 group-hover:scale-115 transition-transform duration-500 ease-out"
                    sizes="(max-width: 640px) 25vw, 15vw"
                  />
                </div>
              </div>

              {/* Category Title & Explore Subtitle */}
              <h3 className="mt-3 font-display font-bold text-[11px] sm:text-sm text-white tracking-wider uppercase group-hover:text-white/90 transition-colors drop-shadow-sm line-clamp-1">
                {c.name}
              </h3>
              <span className="text-[10px] sm:text-xs font-semibold text-white/80 mt-0.5 group-hover:underline group-hover:text-white">
                Explore
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
