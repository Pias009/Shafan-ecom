"use client";

import { demoCategories } from "@/lib/demo-data";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Wind, Droplets, Flower2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const categoryIcons: Record<string, any> = {
  "Skin Care": Droplets,
  "Hair Care": Wind,
  "Body Care": Sparkles,
  "Fragrances": Flower2,
};

const categoryImages: Record<string, string> = {
  "Skin Care": "/images/cat-skin.png",
  "Hair Care": "/images/cat-hair.png",
  "Body Care": "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=800&q=80",
  "Fragrances": "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=600&q=80",
};

const categoryDescriptions: Record<string, string> = {
  "Skin Care": "Premium K-Beauty essentials for a radiant, glass-skin finish and deep hydration.",
  "Hair Care": "Professional solutions for silky, strong, and healthy hair from root to tip.",
  "Body Care": "Nourishing rituals that leave your skin soft, supple, and delicately scented.",
  "Fragrances": "Modern, sophisticated notes that define your presence with every spray.",
};

export function CategorySection({
  onPick,
}: {
  onPick: (category: (typeof demoCategories)[number]["label"]) => void;
}) {
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage.code === "ar";

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 pt-6 md:pt-16 pb-6 md:pb-16">
      <div className="flex flex-row items-center justify-between mb-6 md:mb-12">
        <div className="text-left">
          <p className="font-body text-[8px] md:text-xs uppercase tracking-[0.2em] text-black/40 font-black mb-1">
            {isAr ? "تسوق حسب الفئة" : "Curated Selections"}
          </p>
          <h2 className="font-display text-xl md:text-5xl text-black font-black tracking-tight leading-none">
            {isAr ? "تصفح المجموعة" : "Browse Collection"}
          </h2>
        </div>
        
        <Link 
          href="/products" 
          className="group flex items-center gap-2 text-[10px] md:text-sm font-black uppercase tracking-widest text-black/40 hover:text-black transition-all"
        >
          {isAr ? "شاهد الكل" : "All"}
          <ArrowRight size={14} className="text-emerald-500" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {demoCategories.map((c, idx) => {
          const Icon = categoryIcons[c.label] || Droplets;
          const imageSrc = categoryImages[c.label];
          const desc = categoryDescriptions[c.label] || "Discover our exclusive collection.";
          
          return (
            <CategoryCard 
              key={c.id} 
              c={c} 
              idx={idx} 
              Icon={Icon} 
              imageSrc={imageSrc} 
              desc={desc}
              onPick={onPick} 
            />
          );
        })}
      </div>
    </section>
  );
}

function CategoryCard({ c, idx, Icon, imageSrc, desc, onPick }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative h-[80px] sm:h-[120px] md:h-[300px] overflow-hidden rounded-xl md:rounded-[2.5rem] cursor-pointer shadow-sm transition-all"
      onClick={() => onPick(c.label)}
    >
      {/* Background Image */}
      <div className={`absolute inset-0 transition-all duration-700 ${isHovered ? 'scale-110 blur-[2px]' : 'scale-100'}`}>
        <Image
          src={imageSrc}
          alt={c.label}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-500" />
      </div>

      {/* Hover Reveal Layer */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-gradient-to-t from-emerald-600/90 via-emerald-600/80 to-transparent flex flex-col justify-end p-4 md:p-8 z-20"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-[7px] md:text-xs font-black uppercase tracking-[0.2em] text-white/80 mb-1">
                {c.label}
              </p>
              <h4 className="hidden md:block text-sm lg:text-lg font-body font-medium text-white leading-relaxed line-clamp-3">
                {desc}
              </h4>
              <div className="mt-2 md:mt-4 flex items-center gap-2">
                <span className="text-[8px] md:text-xs font-black uppercase tracking-widest text-white">Shop Collection</span>
                <ArrowRight size={12} className="text-white" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static Label (Hidden on hover if needed, or integrated) */}
      <div className={`absolute inset-0 p-3 md:p-10 flex flex-col justify-end transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
        <h3 className="text-[12px] sm:text-lg md:text-3xl font-display font-black text-white leading-tight uppercase tracking-tighter">
          {c.label}
        </h3>
      </div>

      {/* Glossy Reflection Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700 bg-gradient-to-tr from-white/10 via-transparent to-transparent z-30" />
    </motion.div>
  );
}
