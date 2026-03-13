"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { demoBrands, demoProducts } from "@/lib/demo-data";
import Link from "next/link";
import { useMemo } from "react";

export default function BrandsPage() {
  const brandsWithCount = useMemo(() => {
    return demoBrands.map(b => ({
      ...b,
      productCount: demoProducts.filter(p => p.brand === b.name).length,
      tagline: b.name === "Frost & Co" ? "Nature's luxury for your skin" :
               b.name === "AquaGlass" ? "Hydration redefined" :
               b.name === "NoirMint" ? "Purity in every petal" :
               b.name === "SkyPearl" ? "Sun protection, perfected" :
               "Grounded in nature"
    }));
  }, []);

  return (
    <div className="min-h-screen relative z-0">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl md:text-6xl text-forest">Our Brands</h1>
          <p className="font-body text-forest/60 mt-4 text-lg">
            Curated partners in premium skincare
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {brandsWithCount.map((brand) => (
            <Link
              key={brand.id}
              href={`/#products`}
              className="glass-panel rounded-3xl p-10 transition-all duration-500 hover:scale-[1.01] hover:shadow-xl group flex flex-col justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-forest flex items-center justify-center mb-6 shadow-md ring-1 ring-forest/10 p-2">
                <span className="font-display text-3xl text-cream">
                  {brand.name[0]}
                </span>
              </div>
              <h2 className="font-display text-3xl text-forest mb-2">
                {brand.name}
              </h2>
              <p className="font-body text-base text-forest/60 italic leading-relaxed">
                {brand.tagline}
              </p>
              <p className="font-body text-xs text-forest/40 mt-6 font-medium uppercase tracking-widest">
                {brand.productCount} products
              </p>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
