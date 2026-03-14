"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function BrandsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const brandsWithCount = useMemo(() => {
    const brandMap: Record<string, number> = {};
    products.forEach((p) => {
      const b = p.brand?.name || "Generic";
      brandMap[b] = (brandMap[b] || 0) + 1;
    });

    return Object.keys(brandMap).sort().map((name, idx) => ({
      id: String(idx),
      name,
      productCount: brandMap[name],
      tagline: name === "Frost & Co" ? "Nature's luxury for your skin" :
               name === "AquaGlass" ? "Hydration redefined" :
               "Premium quality and care"
    }));
  }, [products]);

  return (
    <div className="min-h-screen relative z-0">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl md:text-6xl text-forest font-bold">Our Brands</h1>
          <p className="font-body text-forest/60 mt-4 text-lg font-medium">
            Curated partners in premium skincare
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-black/20" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {brandsWithCount.map((brand) => (
              <Link
                key={brand.id}
                href={`/#products`}
                className="glass-panel-heavy rounded-3xl p-10 transition-all duration-500 hover:scale-[1.01] hover:shadow-xl group flex flex-col justify-center border border-black/5"
              >
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mb-6 shadow-md p-2">
                  <span className="font-display text-3xl text-white font-bold">
                    {brand.name[0]}
                  </span>
                </div>
                <h2 className="font-display text-3xl text-black mb-2 font-bold">
                  {brand.name}
                </h2>
                <p className="font-body text-base text-black/60 italic leading-relaxed font-medium">
                  {brand.tagline}
                </p>
                <p className="font-body text-xs text-black/40 mt-6 font-black uppercase tracking-widest">
                  {brand.productCount} products
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
