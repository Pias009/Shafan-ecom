"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch("/api/brands");
        const data = await res.json();
        setBrands(data);
      } catch (err) {
        console.error("Failed to fetch brands:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBrands();
  }, []);

  const brandsWithCount = useMemo(() => {
    return brands.map((brand, idx) => ({
      id: brand.id,
      name: brand.name,
      image: brand.image,
      productCount: brand._count?.products || 0,
      tagline: brand.name === "Frost & Co" ? (currentLanguage.code === "ar" ? "فخامة الطبيعة لبشرتك" : "Nature's luxury for your skin") :
               brand.name === "AquaGlass" ? (currentLanguage.code === "ar" ? "إعادة تعريف الترطيب" : "Hydration redefined") :
               t.brands.taglineDefault
    }));
  }, [brands, t.brands.taglineDefault, currentLanguage.code]);

  return (
    <div className="min-h-screen relative z-0 flex flex-col">
      {/* Navbar handled globally */}
      
      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto flex-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {brandsWithCount.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brand=${encodeURIComponent(brand.name)}`}
                className="group glass-panel-heavy rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex flex-col items-center text-center border border-black/5"
              >
                <div className="w-24 h-24 rounded-full bg-black/5 flex items-center justify-center mb-4 shadow-lg p-2 group-hover:scale-105 transition-transform overflow-hidden">
                  {brand.image ? (
                    <img
                      src={brand.image}
                      alt={brand.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="font-display text-3xl text-black font-black italic">
                      {brand.name[0]}
                    </span>
                  )}
                </div>
                <h2 className="font-display text-xl text-black mb-1 font-bold">
                  {brand.name}
                </h2>
                <p className="font-body text-sm text-black/40 italic leading-relaxed font-medium mb-3 line-clamp-2">
                  {brand.tagline}
                </p>
                <div className="mt-auto w-full pt-4 border-t border-black/5">
                  <span className="font-body text-[10px] font-black uppercase tracking-[0.2em] text-black/60">
                    {brand.productCount} {t.brands.products}
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
