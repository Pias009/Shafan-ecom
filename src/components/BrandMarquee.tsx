"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

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
      <section id="brands" className="w-full bg-gradient-to-b from-gray-50 to-white py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-gray-800">Premium Partners</h2>
          </div>
          <div className="flex gap-12 justify-center">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="text-lg font-bold text-gray-300 animate-pulse">
                Loading...
              </div>
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
    <section id="brands" className="w-full bg-gradient-to-b from-gray-50 to-white py-12 md:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Bold and prominent */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-gray-900">
            Premium Partners
          </h2>
          <div className="w-16 h-1 bg-black mx-auto mt-3 rounded-full" />
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
            className="flex gap-12 md:gap-16"
          >
            {duplicatedBrands.map((brand, index) => (
              <motion.div
                key={`${brand.id}-${index}`}
                whileHover={{ scale: 1.05 }}
                className="flex-shrink-0"
              >
                <Link
                  href={`/products?brand=${encodeURIComponent(brand.name)}`}
                  className="block"
                >
                  {/* Brand Name - Bold and brand-like */}
                  <span className="text-lg md:text-xl font-bold text-gray-800 whitespace-nowrap hover:text-black transition-colors">
                    {brand.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
