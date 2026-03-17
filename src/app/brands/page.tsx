"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

export default function BrandsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

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
      tagline: name === "Frost & Co" ? (currentLanguage.code === "ar" ? "فخامة الطبيعة لبشرتك" : "Nature's luxury for your skin") :
               name === "AquaGlass" ? (currentLanguage.code === "ar" ? "إعادة تعريف الترطيب" : "Hydration redefined") :
               t.brands.taglineDefault
    }));
  }, [products, t.brands.taglineDefault, currentLanguage.code]);

  return (
    <div className="min-h-screen relative z-0">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl md:text-6xl text-black font-black italic tracking-tighter">{t.brands.title}</h1>
          <p className="font-body text-black/40 mt-4 text-lg font-bold uppercase tracking-widest">
            {t.brands.subtitle}
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
                className="group glass-panel-heavy rounded-[2.5rem] p-10 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl flex flex-col justify-center border border-black/5"
              >
                <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center mb-6 shadow-xl p-2 group-hover:scale-110 transition-transform">
                  <span className="font-display text-4xl text-white font-black italic">
                    {brand.name[0]}
                  </span>
                </div>
                <h2 className="font-display text-3xl text-black mb-2 font-black italic">
                  {brand.name}
                </h2>
                <p className="font-body text-base text-black/40 italic leading-relaxed font-bold">
                  {brand.tagline}
                </p>
                <div className="mt-8 flex items-center justify-between border-t border-black/5 pt-6">
                  <span className="font-body text-[10px] font-black uppercase tracking-[0.2em] text-black">
                    {brand.productCount} {t.brands.products}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/20 group-hover:text-black transition-colors">
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
