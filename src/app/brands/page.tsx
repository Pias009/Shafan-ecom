"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";
import { ChevronRight, Sparkles, Search } from "lucide-react";

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
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

  const filteredBrands = useMemo(() => {
    return brands
      .filter((brand) => {
        const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLetter = !selectedLetter || brand.name.toUpperCase().startsWith(selectedLetter);
        return matchesSearch && matchesLetter;
      })
      .map((brand) => ({
        id: brand.id,
        name: brand.name,
        image: brand.image,
        productCount: brand._count?.products || 0,
        tagline: brand.name === "Frost & Co" ? (currentLanguage.code === "ar" ? "فخامة الطبيعة لبشرتك" : "Nature's luxury for your skin") :
                 brand.name === "AquaGlass" ? (currentLanguage.code === "ar" ? "إعادة تعريف الترطيب" : "Hydration redefined") :
                 t.brands.taglineDefault
      }));
  }, [brands, searchQuery, selectedLetter, t.brands.taglineDefault, currentLanguage.code]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="min-h-screen relative flex flex-col bg-[#fafaf9]">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-100/40 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-100/30 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto flex-1 w-full">
        {/* Dynamic Hero Section */}
        <div className="text-center mb-12 sm:mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/5 mb-4 animate-fade-in">
            <Sparkles size={14} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black/60">
              {currentLanguage.code === "ar" ? "شركاؤنا المميزون" : "Our Premier Partners"}
            </span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-black font-black italic tracking-tighter leading-[0.9] sm:leading-tight">
            {t.brands.title}
          </h1>
          <p className="font-body text-black/40 text-sm sm:text-lg font-bold uppercase tracking-[0.2em] max-w-2xl mx-auto">
            {t.brands.subtitle}
          </p>
        </div>

        {/* Search and Alphabet Filter */}
        <div className="mb-12 space-y-6">
          <div className="max-w-md mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-colors" size={18} />
            <input
              type="text"
              placeholder={t.brands.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-black/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all placeholder:text-black/20"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
            <button
              onClick={() => setSelectedLetter(null)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedLetter === null ? "bg-black text-white" : "bg-black/5 text-black/40 hover:bg-black/10"
              }`}
            >
              {t.brands.all}
            </button>
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                  selectedLetter === letter ? "bg-black text-white scale-110" : "bg-black/5 text-black/40 hover:bg-black/10"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          /* Skeleton Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="glass-panel-heavy rounded-[2.5rem] p-8 aspect-square flex flex-col items-center animate-pulse">
                <div className="w-24 h-24 rounded-full bg-black/5 mb-6" />
                <div className="h-4 w-20 bg-black/5 rounded-full mb-2" />
                <div className="h-3 w-32 bg-black/5 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-[3rem] border border-dashed border-black/10">
            <p className="font-display text-2xl text-black/20 font-black italic">
              {t.brands.noResults}
            </p>
          </div>
        ) : (
          /* Dynamic Brands Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8">
            {filteredBrands.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brand=${encodeURIComponent(brand.name)}`}
                className="group relative glass-panel-heavy rounded-[2.5rem] p-6 sm:p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] flex flex-col items-center text-center border border-black/5 overflow-hidden"
              >
                {/* Decorative overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 mb-4 sm:mb-8">
                   {/* Animated ring */}
                  <div className="absolute inset-[-4px] rounded-full border border-black/[0.05] group-hover:scale-110 group-hover:rotate-180 transition-all duration-700" />
                  
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-sm p-1 sm:p-2 group-hover:shadow-md transition-all duration-300 overflow-hidden relative z-10">
                    {brand.image ? (
                      <img
                        src={brand.image}
                        alt={brand.name}
                        className="w-full h-full object-cover rounded-full grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <span className="font-display text-2xl sm:text-4xl text-black font-black italic">
                        {brand.name[0]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative z-10 space-y-1 sm:space-y-2 mb-4 sm:mb-8">
                  <h2 className="font-display text-sm sm:text-2xl text-black font-black italic tracking-tight group-hover:text-black transition-colors">
                    {brand.name}
                  </h2>
                  <p className="hidden sm:block font-body text-[11px] text-black/40 italic leading-relaxed font-bold uppercase tracking-wider line-clamp-2 px-2">
                    {brand.tagline}
                  </p>
                </div>

                <div className="mt-auto w-full pt-4 sm:pt-6 border-t border-black/[0.03] flex items-center justify-center gap-2 relative z-10">
                  <span className="font-body text-[10px] font-black uppercase tracking-[0.2em] text-black/50 group-hover:text-black/80 transition-colors">
                    {brand.productCount} {t.brands.products}
                  </span>
                  <ChevronRight size={12} className="text-black/20 group-hover:translate-x-1 group-hover:text-black transition-all" />
                </div>

                {/* Mobile small view optimized */}
                <div className="sm:hidden absolute top-2 right-4">
                   <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center">
                      <ChevronRight size={10} className="text-black/40" />
                   </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

