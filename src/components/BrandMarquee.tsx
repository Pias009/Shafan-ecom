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

  // Sort brands with Color Wow first
  const sortedBrands = [...brands].sort((a, b) => {
    if (a.name === 'Color Wow') return -1;
    if (b.name === 'Color Wow') return 1;
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return null;
  }

  if (brands.length === 0) {
    return null;
  }

  // If few brands, show centered layout
  const isFewBrands = sortedBrands.length <= 4;

  if (isFewBrands) {
    return (
      <section id="brands" className="w-full bg-gradient-to-b from-gray-50 to-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {sortedBrands.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brand=${encodeURIComponent(brand.name)}`}
                className="text-xl md:text-2xl font-bold text-gray-800 hover:text-black transition-colors"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Duplicate brands for seamless infinite scroll
  const duplicatedBrands = [...sortedBrands, ...sortedBrands, ...sortedBrands, ...sortedBrands];

  return (
    <section id="brands" className="w-full bg-gradient-to-b from-gray-50 to-white py-12 md:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-20 md:w-32 h-full bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-20 md:w-32 h-full bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

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
