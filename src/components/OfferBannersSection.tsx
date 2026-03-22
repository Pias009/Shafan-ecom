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
  console.log("DEBUG: OfferBannersSection component rendering");
  const [banners, setBanners] = useState<EnhancedOfferBanner[]>([]);
  const [active, setActive] = useState(0);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  
  console.log("DEBUG: Current banners state:", banners);

  useEffect(() => {
    console.log("DEBUG: OfferBannersSection useEffect running");
    console.log("DEBUG: Fetching banners from /api/promotional/banners?limit=5");
    
    // Add timeout to detect stalled requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error("DEBUG: Fetch timeout - request taking too long");
      controller.abort();
    }, 10000);
    
    fetch("/api/promotional/banners?limit=5", {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin'
    })
      .then((r) => {
        clearTimeout(timeoutId);
        console.log("DEBUG: Fetch response status:", r.status);
        console.log("DEBUG: Response ok?", r.ok);
        console.log("DEBUG: Response headers:", Object.fromEntries(r.headers.entries()));
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status} ${r.statusText}`);
        }
        return r.json();
      })
      .then((data) => {
        console.log("DEBUG: Banners data received:", data);
        console.log("DEBUG: Data type:", typeof data);
        console.log("DEBUG: Is array?", Array.isArray(data));
        
        if (Array.isArray(data)) {
          console.log(`DEBUG: Setting ${data.length} banners`);
          console.log("DEBUG: Banner IDs:", data.map(b => b.id));
          console.log("DEBUG: Banner titles:", data.map(b => b.title));
          setBanners(data);
        } else {
          console.log("DEBUG: Data is not an array:", data);
          setBanners([]);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("DEBUG: Error fetching banners:", err);
        console.error("DEBUG: Error name:", err.name);
        console.error("DEBUG: Error message:", err.message);
        if (err.name === 'AbortError') {
          console.error("DEBUG: Request was aborted due to timeout");
        }
        setBanners([]);
      });
      
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
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
        className="text-center mb-6 md:mb-12"
      >
        <motion.div
          className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-2 md:px-8 md:py-4 mb-4"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Tag size={18} className="text-black/50 md:size-6" />
          <span className="text-xs md:text-lg font-bold uppercase tracking-wider text-black/70">
            {t.home.specialOffers}
          </span>
        </motion.div>
        <h2 className="font-display text-2xl md:text-5xl lg:text-6xl font-black text-black mb-2 md:mb-6">
          {t.home.featuredDeals}
        </h2>
        <p className="font-body text-black/70 text-sm md:text-xl max-w-3xl mx-auto">
          Exclusive limited-time offers on premium products
        </p>
      </motion.div>

      {/* Banner container with larger width on desktop */}
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
    <div className="glass-panel rounded-xl md:rounded-3xl w-full max-w-4xl xl:max-w-6xl mx-auto flex flex-col md:flex-row items-stretch overflow-hidden relative shadow-xl border border-black/5 min-h-[200px] md:min-h-[320px] lg:min-h-[380px] xl:min-h-[420px] group">
      {/* Left side - Promotional content with responsive sizing */}
      <div
        className="flex-shrink-0 flex flex-col justify-center items-center p-4 md:p-6 lg:p-8 xl:p-10 w-full md:w-[200px] lg:w-[250px] xl:w-[300px] z-10"
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
          <div className="inline-flex items-center gap-1 mb-2 md:mb-4 lg:mb-5">
            <Tag size={12} className={`md:size-5 lg:size-6 ${banner.priority === 3 ? "text-red-600" : banner.priority === 2 ? "text-orange-600" : "text-blue-600"}`} />
            <span className={`text-[9px] md:text-sm lg:text-base font-bold uppercase tracking-wide ${
              banner.priority === 3 ? "text-red-700" :
              banner.priority === 2 ? "text-orange-700" :
              "text-blue-700"
            }`}>
              {banner.priority === 3 ? "HOT" : banner.priority === 2 ? "FEATURED" : "OFFER"}
            </span>
          </div>
          
          {/* Offer text (main highlight) */}
          {banner.offerText ? (
            <h3 className="font-display text-lg md:text-2xl lg:text-3xl xl:text-4xl font-black leading-tight tracking-tight mb-1 md:mb-2 text-balance">
              {banner.offerText}
            </h3>
          ) : banner.title ? (
            <h3 className="font-display text-lg md:text-2xl lg:text-3xl xl:text-4xl font-black leading-tight tracking-tight mb-1 md:mb-2 text-balance">
              {banner.title}
            </h3>
          ) : (
            <h3 className="font-display text-lg md:text-2xl lg:text-3xl xl:text-4xl font-black leading-tight tracking-tight mb-1 md:mb-2">
              SPECIAL OFFER
            </h3>
          )}
          
          {/* Subtitle or description */}
          {banner.subtitle ? (
            <p className="font-body text-[10px] md:text-base lg:text-lg mt-1 md:mt-2 italic line-clamp-2 opacity-90 text-pretty">
              {banner.subtitle}
            </p>
          ) : (
            <p className="font-body text-[10px] md:text-base lg:text-lg mt-1 md:mt-2 italic opacity-90">
              Limited time offer
            </p>
          )}
          
          {/* CTA Button or discount indicator */}
          <div className="mt-3 md:mt-4 lg:mt-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded-full font-black text-sm md:text-3xl lg:text-4xl xl:text-5xl shadow-lg ${
              banner.priority === 3 ? "bg-gradient-to-br from-red-500 to-pink-600" :
              banner.priority === 2 ? "bg-gradient-to-br from-orange-500 to-red-600" :
              "bg-gradient-to-br from-blue-500 to-purple-600"
            } text-white`}>
              {banner.ctaText ? banner.ctaText.slice(0, 4) : "SALE"}
            </div>
          </div>
          
          {/* Click tracking indicator */}
          <p className="mt-2 md:mt-3 text-[10px] md:text-sm opacity-75 max-w-[100px] md:max-w-[180px] lg:max-w-[200px] mx-auto">
            {banner.clicks > 0 ? `${banner.clicks} clicks` : "Act fast!"}
          </p>
        </motion.div>
      </div>

      {/* Image side - Banner image occupying remaining space */}
      <div className="flex-1 min-h-[160px] md:min-h-0 relative overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 to-transparent" />
        </motion.div>
        
        {/* Promotional badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
          className="absolute bottom-2 right-2 md:bottom-4 md:right-4 lg:bottom-6 lg:right-6 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 rounded-full font-bold text-[10px] md:text-sm lg:text-base uppercase tracking-wide shadow-lg z-20"
        >
          ⚡ SALE
        </motion.div>
      </div>

      {/* CTA Button inside image area - larger on desktop */}
      <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6 lg:bottom-8 lg:left-8 z-20">
        {banner.link ? (
          <Link
            href={banner.link}
            className="inline-flex items-center gap-1 px-3 py-1.5 md:px-5 md:py-2.5 lg:px-6 lg:py-3 rounded-full bg-white text-black font-bold text-xs md:text-base lg:text-lg uppercase tracking-wide hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl active:scale-95 border border-white/30"
          >
            {t.common.shopNow} <ArrowRight className="w-3 h-3 md:w-5 md:h-5 lg:w-6 lg:h-6" />
          </Link>
        ) : (
          <button className="inline-flex items-center gap-1 px-3 py-1.5 md:px-5 md:py-2.5 lg:px-6 lg:py-3 rounded-full bg-white/90 text-black font-bold text-xs md:text-base lg:text-lg uppercase tracking-wide hover:bg-white transition-all shadow-lg hover:shadow-xl active:scale-95">
            VIEW DETAILS <ArrowRight className="w-3 h-3 md:w-5 md:h-5 lg:w-6 lg:h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
