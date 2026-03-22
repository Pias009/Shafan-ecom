"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

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

  useEffect(() => {
    if (brands.length === 0 || !containerRef.current || !trackRef.current) return;

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    const track = trackRef.current;
    const container = containerRef.current;
    const cards = cardsRef.current.filter(Boolean);

    // Calculate total width needed
    const cardWidth = 400; // Fixed width for each card
    const gap = 40;
    const totalWidth = (cardWidth + gap) * brands.length;

    // Set track width
    track.style.width = `${totalWidth}px`;

    // Create horizontal scroll animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top 80%",
        end: "bottom 20%",
        scrub: 1,
        markers: false, // Set to true for debugging
      },
    });

    // Animate track from right to left
    tl.fromTo(
      track,
      { x: 0 },
      { 
        x: -totalWidth + container.offsetWidth,
        duration: 1,
        ease: "none"
      }
    );

    // Add parallax effect to individual cards
    cards.forEach((card, index) => {
      if (!card) return;
      
      gsap.fromTo(
        card,
        {
          opacity: 0.5,
          scale: 0.9,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            end: "top 60%",
            scrub: true,
          },
        }
      );
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [brands]);

  if (loading) {
    return (
      <section id="brands" className="w-full bg-black py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our Brands
            </h2>
            <p className="text-white/70 text-lg">
              Loading brands...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) {
    return null;
  }

  return (
    <section id="brands" className="w-full  py-8 overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
            OUR PRENTS BRANDS
          </h2>
          <p className="text-black/70 text-xs max-w-2xl mx-auto">
            Discover premium brands curated for exceptional quality
          </p>
        </div>
      </div>

      {/* Horizontal Scrolling Track */}
      <div
        ref={containerRef}
        className="relative h-[180px] overflow-hidden"
      >
        <div
          ref={trackRef}
          className="absolute top-0 left-0 h-full flex items-center gap-6 will-change-transform"
          style={{ paddingLeft: '60px' }}
        >
          {brands.map((brand, index) => (
            <div
              key={brand.id}
              ref={el => { cardsRef.current[index] = el; }}
              className="flex-shrink-0 w-[280px] h-[140px] bg-black border border-white/10 rounded-lg overflow-hidden group hover:border-white/30 transition-all duration-300 hover:scale-[1.02]"
            >
              <Link
                href={`/products?brand=${encodeURIComponent(brand.name)}`}
                className="w-full h-full flex items-center p-4"
              >
                {/* Left side - Brand name and info */}
                <div className="flex-1 pr-4">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-100 transition-colors">
                    {brand.name}
                  </h3>
                  <p className="text-white/70 text-[10px] mb-3">
                    Premium collection
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-[10px] font-bold">
                      {brand._count?.products || 0} products
                    </span>
                    <span className="text-white/50 text-[10px]">•</span>
                    <span className="text-white/50 text-[10px] group-hover:text-white transition-colors">
                      Explore →
                    </span>
                  </div>
                </div>

                {/* Right side - Brand image */}
                <div className="w-20 h-20 flex-shrink-0 relative overflow-hidden rounded">
                  {brand.image ? (
                    <img
                      src={brand.image}
                      alt={brand.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-900/30 to-black flex items-center justify-center">
                      <span className="text-2xl font-bold text-white/30">
                        {brand.name[0]}
                      </span>
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-l from-black/0 via-black/20 to-black/60 group-hover:via-black/40 transition-all duration-500" />
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Gradient overlays for smooth edges */}
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      </div>

      {/* Scroll indicator */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="w-full h-full bg-white animate-[scrollIndicator_3s_ease-in-out_infinite]"
                 style={{ animationDelay: '0.5s' }} />
          </div>
          <span className="text-white/50 text-xs font-medium">
            Scroll horizontally to explore brands
          </span>
          <div className="w-10 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="w-full h-full bg-white animate-[scrollIndicator_3s_ease-in-out_infinite]"
                 style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </div>

      {/* View all brands link */}
      <div className="max-w-7xl mx-auto px-6 mt-8 text-center">
        <Link
          href="/brands"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-amber-100 transition-colors group"
        >
          View All Brands
          <span className="group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>
      </div>

      {/* Add CSS animation for scroll indicator */}
      <style jsx>{`
        @keyframes scrollIndicator {
          0%, 100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </section>
  );
}
