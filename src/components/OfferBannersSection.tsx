"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tag } from "lucide-react";
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
    const controller = new AbortController();
    const signal = controller.signal;
    let timeoutId: NodeJS.Timeout | null = null;
    let aborted = false;
    
    const safeAbort = () => {
      if (!aborted) {
        try {
          controller.abort();
          aborted = true;
        } catch {
          // Ignore errors from aborting already-aborted controller
        }
      }
    };
    
    timeoutId = setTimeout(() => {
      safeAbort();
    }, 10000);
    
    fetch("/api/promotional/banners?limit=5", {
      signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin'
    })
      .then((r) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status} ${r.statusText}`);
        }
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setBanners(data);
        } else {
          setBanners([]);
        }
      })
      .catch((err) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        // Only set empty banners if not aborted (abort is normal during navigation)
        if (err.name !== 'AbortError') {
          setBanners([]);
        }
      });
      
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      safeAbort();
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-8 md:pb-12">
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
          className="hidden md:flex justify-center items-center gap-3 mt-8"
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
    <div className="relative w-full max-w-4xl xl:max-w-6xl mx-auto overflow-hidden rounded-xl md:rounded-3xl min-h-[160px] md:min-h-[320px] lg:min-h-[380px] xl:min-h-[420px] group">
      <Image
        src={banner.imageUrl}
        alt={banner.title || "promotional banner"}
        fill
        className="object-contain"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
        priority={true}
      />
      {banner.link ? (
        <Link
          href={banner.link}
          className="absolute inset-0 z-10"
          aria-label={banner.title || "promotional banner"}
        />
      ) : null}
    </div>
  );
}
