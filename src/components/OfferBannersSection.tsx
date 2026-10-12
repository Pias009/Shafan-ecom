"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        } catch {}
      }
    };
    
    timeoutId = setTimeout(() => {
      safeAbort();
    }, 10000);
    
    fetch("/api/promotional/banners?limit=5&placement=HOME_MID", {
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
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data);
        } else {
          setBanners([]);
        }
      })
      .catch(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        setBanners([]);
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

  // Admin-managed only (Home Banner page). No banner → render nothing.
  if (banners.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1536px] px-1 sm:px-3 pt-4 sm:pt-6 pb-6 sm:pb-8">
      <div className="relative w-full px-1 md:px-0">
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
    </section>
  );
}

function BannerCard({ banner }: { banner: EnhancedOfferBanner }) {
  return (
    <div className="relative w-full max-w-4xl xl:max-w-6xl mx-auto group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.imageUrl}
        alt={banner.title || "promotional banner"}
        className="w-full h-auto object-contain"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
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


