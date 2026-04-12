import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  link?: string;
}

export default function HomeBannerSlider({ banners }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full aspect-[4/5] md:aspect-[16/9] lg:aspect-[21/9] overflow-hidden rounded-xl mb-8 bg-[#f3f3f3]">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full"
        >
          <a href={banners[currentIndex].link || '#'} className="block w-full h-full">
            <Image
              src={banners[currentIndex].imageUrl}
              alt={banners[currentIndex].title || 'Featured Deal'}
              fill
              priority={currentIndex === 0}
              className="object-contain"
              sizes="100vw"
            />
            {banners[currentIndex].title && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-3 md:p-4">
                <h3 className="text-[clamp(0.875rem,4vw,1.5rem)] font-bold text-white">{banners[currentIndex].title}</h3>
              </div>
            )}
          </a>
        </motion.div>
      </AnimatePresence>

      </div>
  );
}