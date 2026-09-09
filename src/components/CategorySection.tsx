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
  { id: "c1", name: "SERUMS", link: "/products?category=Skin%20Care", image: "/images/categories/serums.jpg" },
  { id: "c2", name: "MOISTURIZERS", link: "/products?category=Skin%20Care", image: "/images/categories/moisturizers.jpg" },
  { id: "c3", name: "CLEANSERS", link: "/products?category=Skin%20Care", image: "/images/categories/cleansers.jpg" },
  { id: "c4", name: "TONERS", link: "/products?category=Hair%20Care", image: "/images/categories/toners.jpg" },
  { id: "c5", name: "EYE CARE", link: "/products?category=Body%20Care", image: "/images/categories/eyecare.jpg" },
  { id: "c6", name: "SUN CARE", link: "/products?category=Fragrances", image: "/images/categories/suncare.jpg" },
];

function CategoryCard({
  category,
  index,
  fallbackImage,
  onClick,
}: {
  category: CategoryItem;
  index: number;
  fallbackImage: string;
  onClick: () => void;
}) {
  const initialImage =
    category.image && category.image.trim() !== "" ? category.image : fallbackImage;
  const [imgSrc, setImgSrc] = useState(initialImage);

  // Sync if category.image changes
  useEffect(() => {
    if (category.image && category.image.trim() !== "") {
      setImgSrc(category.image);
    } else {
      setImgSrc(fallbackImage);
    }
  }, [category.image, fallbackImage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      className="group flex flex-col items-center cursor-pointer text-center transform-gpu"
    >
      {/* Clean White Circle with Brand Shimmer Elevation */}
      <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-white border border-pink-100/90 group-hover:border-[#890754]/40 shadow-[0_4px_16px_rgba(137,7,84,0.06)] group-hover:shadow-[0_12px_28px_rgba(137,7,84,0.14)] group-hover:-translate-y-1.5 transition-all duration-300 ease-out flex items-center justify-center overflow-hidden transform-gpu ring-2 ring-transparent group-hover:ring-pink-200/40">
        <div className="relative w-full h-full">
          <Image
            src={imgSrc}
            alt={category.name}
            fill
            unoptimized
            onError={() => setImgSrc(fallbackImage)}
            className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 25vw, 15vw"
          />
        </div>
      </div>

      {/* Category Title & Explore Subtitle */}
      <h3 className="mt-3 font-display font-bold text-[11px] sm:text-sm text-gray-800 tracking-wider uppercase group-hover:text-[#890754] transition-colors line-clamp-1">
        {category.name}
      </h3>
      <span className="text-[10px] sm:text-xs font-semibold text-[#890754]/80 mt-0.5 group-hover:underline group-hover:text-[#890754]">
        Explore
      </span>
    </motion.div>
  );
}

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
        <div className="inline-flex items-center justify-center gap-3 text-xs sm:text-sm font-black uppercase tracking-widest text-gray-900">
          <span className="h-px w-8 sm:w-12 bg-[#890754]/30" />
          <span className="text-[#890754]">{isAr ? "تسوق حسب الفئة" : "SHOP BY CATEGORY"}</span>
          <span className="h-px w-8 sm:w-12 bg-[#890754]/30" />
        </div>
      </div>

      {/* Circular Category Thumbnail Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-6 lg:gap-8 justify-items-center">
        {itemsToRender.map((c, idx) => {
          const fallbackImage =
            defaultCategories[idx % defaultCategories.length]?.image ||
            "/images/categories/serums.jpg";

          return (
            <CategoryCard
              key={c.id}
              category={c}
              index={idx}
              fallbackImage={fallbackImage}
              onClick={() => handleCategoryClick(c)}
            />
          );
        })}
      </div>
    </section>
  );
}
