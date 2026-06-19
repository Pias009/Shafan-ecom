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
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const activeBanners = banners.filter(b => b.active);
  const currentBanner = activeBanners[activeBanner] ?? null;

  return (
    <section className="pt-6 md:pt-10 pb-4 md:pb-6 px-1 sm:px-4">
      {/* Section header */}
      <div className="mb-3 md:mb-5 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 glass-panel rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 mb-1.5 sm:mb-2 w-fit">
            <Sparkles className="text-violet-500 w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-black/60">Routine</span>
            <Sparkles className="text-violet-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-violet-600">Routine</h2>
          <div className="mt-2 h-[3px] w-full rounded-full bg-violet-600/10 overflow-hidden">
            <div className="h-full bg-violet-600 rounded-full animate-line-grow" />
          </div>
          <p className="font-body text-black/70 mt-1 text-sm sm:text-lg max-w-xl font-medium">
            Your daily skincare essentials
          </p>
        </div>
        <Link
          href="/products/routine"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          See All
          <ArrowRight className="w-4 h-4" />
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
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-black/10 hover:bg-white transition-all active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-black/10 hover:bg-white transition-all active:scale-95"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-2 sm:px-4 gap-2 sm:gap-3 md:gap-4"
        >
          {products.map((product, idx) => (
            <div key={product.id} className="flex-shrink-0 snap-start w-[150px] sm:w-[180px] md:w-[220px] lg:w-[260px]">
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
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
          >
            See All Routine
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
