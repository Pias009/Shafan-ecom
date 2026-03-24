"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  image?: string | null;
  _count?: {
    products: number;
  };
}

export function BrandMarquee() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch("/api/brands");
        if (res.ok) {
          const data = await res.json();
          setBrands(data);
        }
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBrands();
  }, []);

  if (loading) {
    return (
      <section id="brands" className="w-full bg-gradient-to-b from-gray-50 to-white py-8 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Premium Partners</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex gap-8 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) {
    return null;
  }

  // Duplicate brands for seamless infinite scroll
  const duplicatedBrands = [...brands, ...brands, ...brands, ...brands];

  return (
    <section id="brands" className="w-full bg-gradient-to-b from-gray-50 to-white py-8 md:py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-6 md:mb-8"
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Premium Partners</span>
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
        </motion.div>

        {/* Auto-scrolling Marquee Container */}
        <div className="relative overflow-hidden">
          {/* Gradient overlays for smooth edges */}
          <div className="absolute top-0 left-0 w-20 md:w-32 h-full bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-20 md:w-32 h-full bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

          {/* Animated Marquee Track */}
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
            className="flex gap-8 md:gap-12"
          >
            {duplicatedBrands.map((brand, index) => (
              <motion.div
                key={`${brand.id}-${index}`}
                whileHover={{ scale: 1.1 }}
                className="flex-shrink-0 flex flex-col items-center gap-2 group"
              >
                <Link
                  href={`/products?brand=${encodeURIComponent(brand.name)}`}
                  className="flex flex-col items-center gap-2"
                >
                  {/* Brand Logo - Main Focus */}
                  <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                    {brand.image ? (
                      <img
                        src={brand.image}
                        alt={brand.name}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xl md:text-2xl font-bold text-gray-500">
                          {brand.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Brand Name */}
                  <h3 className="text-xs md:text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors text-center whitespace-nowrap">
                    {brand.name}
                  </h3>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
