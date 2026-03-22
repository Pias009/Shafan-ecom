"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tag, ArrowRight, Sparkles } from "lucide-react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { motion, AnimatePresence } from "framer-motion";

interface EnhancedOfferBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  offerText: string | null;
  ctaText: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  backgroundImage: string | null;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  link: string | null;
  discountId: string | null;
  sortOrder: number;
  priority: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
}

export function OfferBannersSection() {
  const [banners, setBanners] = useState<EnhancedOfferBanner[]>([]);
  const [active, setActive] = useState(0);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  useEffect(() => {
    fetch("/api/promotional/banners?limit=5")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBanners(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 pt-8 md:pt-12 pb-16 md:pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 md:mb-12"
      >
        <motion.div
          className="inline-flex items-center gap-3 glass-panel rounded-full px-6 py-3 md:px-8 md:py-4 mb-6"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Tag size={24} className="text-black/50" />
          <span className="text-base md:text-lg font-bold uppercase tracking-wider text-black/70">
            {t.home.specialOffers}
          </span>
        </motion.div>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-black mb-4 md:mb-6">
          {t.home.featuredDeals}
        </h2>
        <p className="font-body text-black/70 text-lg md:text-xl max-w-3xl mx-auto">
          Exclusive limited-time offers on premium products
        </p>
      </motion.div>

      {/* Banner container with constrained width */}
      <div className="relative w-full px-2 md:px-0">
        <AnimatePresence mode="wait">
          {banners.map((banner, index) => (
            index === active && (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="relative w-full flex justify-center"
              >
                <BannerCard banner={banner} />
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation dots matching hero section style */}
      {banners.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center items-center gap-3 mt-8"
        >
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === active ? "bg-black scale-125" : "bg-gray-300 hover:bg-gray-400"}`}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </motion.div>
      )}
    </section>
  );
}

function BannerCard({ banner }: { banner: EnhancedOfferBanner }) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  return (
    <div className="glass-panel rounded-xl md:rounded-2xl w-full max-w-3xl mx-auto flex flex-row items-stretch overflow-hidden relative shadow-lg border border-black/5 min-h-[160px] md:min-h-[260px] lg:min-h-[280px] group">
      {/* Left side - Compact promotional content */}
      <div
        className="flex-shrink-0 flex flex-col justify-center items-center p-2 md:p-4 lg:p-5 w-[120px] md:w-[200px] lg:w-[240px] z-10"
        style={{
          background: banner.backgroundColor || 'linear-gradient(to bottom, rgba(239, 246, 255, 0.5), rgba(233, 213, 255, 0.5))',
          color: banner.textColor || 'inherit'
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center w-full"
        >
          {/* Priority indicator */}
          <div className="inline-flex items-center gap-1 mb-1.5 md:mb-2.5">
            <Tag size={14} className={banner.priority === 3 ? "text-red-600" : banner.priority === 2 ? "text-orange-600" : "text-blue-600"} />
            <span className={`text-[9px] md:text-xs font-bold uppercase tracking-wide ${
              banner.priority === 3 ? "text-red-700" :
              banner.priority === 2 ? "text-orange-700" :
              "text-blue-700"
            }`}>
              {banner.priority === 3 ? "HOT" : banner.priority === 2 ? "FEATURED" : "OFFER"}
            </span>
          </div>
          
          {/* Offer text (main highlight) */}
          {banner.offerText ? (
            <h3 className="font-display text-xs md:text-lg lg:text-xl font-black leading-tight tracking-tight mb-0.5">
              {banner.offerText}
            </h3>
          ) : banner.title ? (
            <h3 className="font-display text-xs md:text-lg lg:text-xl font-black leading-tight tracking-tight mb-0.5">
              {banner.title}
            </h3>
          ) : (
            <h3 className="font-display text-xs md:text-lg lg:text-xl font-black leading-tight tracking-tight mb-0.5">
              SPECIAL OFFER
            </h3>
          )}
          
          {/* Subtitle or description */}
          {banner.subtitle ? (
            <p className="font-body text-[9px] md:text-xs mt-0.5 italic line-clamp-2 opacity-90">
              {banner.subtitle}
            </p>
          ) : (
            <p className="font-body text-[9px] md:text-xs mt-0.5 italic opacity-90">
              Limited time offer
            </p>
          )}
          
          {/* CTA Button or discount indicator */}
          <div className="mt-1.5 md:mt-2.5">
            <div className={`inline-flex items-center justify-center w-8 h-8 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full font-black text-sm md:text-xl lg:text-2xl shadow-md ${
              banner.priority === 3 ? "bg-gradient-to-br from-red-500 to-pink-600" :
              banner.priority === 2 ? "bg-gradient-to-br from-orange-500 to-red-600" :
              "bg-gradient-to-br from-blue-500 to-purple-600"
            } text-white`}>
              {banner.ctaText ? banner.ctaText.slice(0, 4) : "SALE"}
            </div>
          </div>
          
          {/* Click tracking indicator */}
          <p className="mt-1 md:mt-1.5 text-[9px] opacity-75 max-w-[100px] md:max-w-[130px] mx-auto">
            {banner.clicks > 0 ? `${banner.clicks} clicks` : "Act fast!"}
          </p>
        </motion.div>
      </div>

      {/* Right side - Banner image covering full area */}
      <div className="flex-1 relative overflow-hidden">
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={banner.imageUrl}
            alt={banner.title || "promotional banner"}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
            priority={true}
          />
          {/* Minimal gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        </motion.div>
        
        {/* Compact promotional badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
          className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-1 py-0.5 md:px-2 md:py-1 rounded-full font-bold text-[8px] md:text-[10px] uppercase tracking-wide shadow z-20"
        >
          ⚡ SALE
        </motion.div>
      </div>

      {/* CTA Button inside image area */}
      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-20">
        {banner.link ? (
          <Link
            href={banner.link}
            className="inline-flex items-center gap-1 px-2 py-1 md:px-4 md:py-2 rounded-full bg-white text-black font-bold text-[9px] md:text-sm uppercase tracking-wide hover:bg-gray-100 transition-all shadow hover:shadow-md active:scale-95 border border-white/30"
          >
            {t.common.shopNow} <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
          </Link>
        ) : (
          <button className="inline-flex items-center gap-1 px-2 py-1 md:px-4 md:py-2 rounded-full bg-white/90 text-black font-bold text-[9px] md:text-sm uppercase tracking-wide hover:bg-white transition-all shadow hover:shadow-md active:scale-95">
            VIEW DETAILS <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
