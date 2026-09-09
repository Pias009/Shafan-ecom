"use client";

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface RoutineBanner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  active: boolean;
}

interface Props {
  products: any[];
  banners?: RoutineBanner[];
  onQuickView: (p: any) => void;
  addToCart: (p: any) => void;
  orderNow: (p: any) => void;
}

export function RoutineSection({ products, banners = [], onQuickView, addToCart, orderNow }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const activeBanners = banners.filter(b => b.active);
  const currentBanner = activeBanners[activeBanner] ?? null;

  return (
    <section className="pt-6 md:pt-10 pb-4 md:pb-6 px-1 sm:px-4">
      {/* Section header */}
      <div className="mb-3 md:mb-5 flex items-center justify-between border-b border-white/30 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 mb-1.5 sm:mb-2 w-fit border border-white/30 shadow-sm">
            <Sparkles className="text-white w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white">Routine Essentials</span>
            <Sparkles className="text-white w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white uppercase drop-shadow-sm">Routine</h2>
          <p className="font-body text-white/90 mt-1 text-sm sm:text-base max-w-xl font-medium">
            Your daily skincare essentials
          </p>
        </div>
        <Link
          href="/products/routine"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-transparent text-xs font-black uppercase tracking-widest transition-all shadow-sm hover:border-white/60 hover:scale-105 active:scale-95"
        >
          <span className="wave-text">See All</span>
          <ArrowRight className="w-4 h-4 wave-icon" />
        </Link>
      </div>

      {/* Admin banner — shown only when one is active */}
      {currentBanner && (
        <div className="mb-4 relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-purple-500">
          {currentBanner.imageUrl && (
            <Image
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              fill
              className="object-cover opacity-30"
            />
          )}
          <div className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-8 sm:py-7">
            <div>
              <p className="font-black text-white text-xl sm:text-3xl tracking-tight">{currentBanner.title}</p>
              {currentBanner.subtitle && (
                <p className="text-white/80 text-sm sm:text-base mt-1 font-medium">{currentBanner.subtitle}</p>
              )}
            </div>
            {currentBanner.linkUrl && (
              <Link
                href={currentBanner.linkUrl}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-violet-600 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-colors"
              >
                Shop Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          {/* Dot nav if multiple banners */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {activeBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBanner(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeBanner ? 'bg-white w-4' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product slider */}
      <div className="relative py-2">
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-[#c5e1d7] text-[#0c433a] hover:bg-[#0c433a] hover:text-white transition-all active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center bg-white shadow-xl rounded-full border border-[#c5e1d7] text-[#0c433a] hover:bg-[#0c433a] hover:text-white transition-all active:scale-95"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-1.5 sm:px-2 gap-2 sm:gap-3 lg:gap-4"
        >
          {products.map((product, idx) => (
            <div key={product.id} className="flex-shrink-0 snap-start w-[calc(38%-6px)] sm:w-[calc(28%-8px)] md:w-[calc(22%-10px)] lg:w-[calc(19%-12px)]">
              <ProductCard
                product={product}
                onQuickView={onQuickView}
                onAddToCart={addToCart}
                onOrderNow={orderNow}
                priority={idx < 4}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-4 sm:hidden">
          <Link
            href="/products/routine"
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 bg-transparent text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
          >
            <span className="wave-text">See All Routine</span>
            <ArrowRight className="w-4 h-4 wave-icon" />
          </Link>
        </div>
      </div>
    </section>
  );
}
