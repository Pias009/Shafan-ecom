"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguageStore } from "@/lib/language-store";
import { Price } from "./Price";

interface HexPinwheelShowcaseProps {
  products: any[];
  onQuickView: (product: any) => void;
  onAddToCart?: (product: any) => void;
  onOrderNow?: (product: any) => void;
}

// ── Exact Geometric Path Definitions (1000x1000 Coordinate System) ──

// 1. Central Flat-Top Regular Hexagon with smoothly rounded corners
const HEXAGON_PATH = `
  M 452 388
  L 548 388
  Q 565 388 573 401
  L 622 486
  Q 630 500 622 514
  L 573 599
  Q 565 612 548 612
  L 452 612
  Q 435 612 427 599
  L 378 514
  Q 370 500 378 486
  L 427 401
  Q 435 388 452 388
  Z
`;

// 2. Base Isometric Parallelogram Petal with smoothly rounded corners (Petal 01 at 0°)
const BASE_PETAL_PATH = `
  M 482 372
  L 676 372
  Q 700 372 706 361.6
  L 766 257.9
  Q 770 251 758 251
  L 564 251
  Q 540 251 534 261.4
  L 474 365
  Q 470 372 482 372
  Z
`;

// Calculated 2D centers of the 6 rotated petals around (500, 500)
// Ensures product images inside remain 100% upright and perfectly centered
const PETAL_CENTERS = [
  { x: 620, y: 312 }, // 0° (Top-Right)
  { x: 723, y: 510 }, // 60° (Right)
  { x: 603, y: 698 }, // 120° (Bottom-Right vertical diamond)
  { x: 380, y: 689 }, // 180° (Bottom-Left)
  { x: 277, y: 490 }, // 240° (Left)
  { x: 397, y: 302 }, // 300° (Top-Left vertical diamond)
];

export function HexPinwheelShowcase({
  products,
  onQuickView,
}: HexPinwheelShowcaseProps) {
  const router = useRouter();
  const { currentLanguage } = useLanguageStore();
  const isAr = currentLanguage?.code === "ar";
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!products || products.length === 0) return null;

  // 7 products: index 0 is center hexagon, indices 1-6 are the 6 radial petals
  const displayProducts = Array.from({ length: 7 }, (_, i) => {
    return products[i % products.length];
  });

  const centerProduct = displayProducts[0];
  const petalProducts = displayProducts.slice(1, 7);

  const handleProductClick = (product: any) => {
    if (onQuickView) {
      onQuickView(product);
    } else if (product?.slug || product?.id) {
      router.push(`/products/${product.slug || product.id}`);
    }
  };

  const getImgSrc = (p: any) =>
    p?.imageUrl || p?.mainImage || "/placeholder-product.png";

  return (
    <section className="w-full py-8 sm:py-14 md:py-20 lg:py-24 px-2 sm:px-6 select-none overflow-hidden my-4 sm:my-6">
      {/* Embedded 60FPS Hardware-Accelerated Glass Edge Light & Slow Render Keyframes */}
      <style jsx global>{`
        @keyframes glass-rim-travel {
          0% {
            stroke-dashoffset: 720;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes glass-specular-shimmer {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.95;
          }
        }
        @keyframes glass-rim-glow {
          0%, 100% {
            stroke-opacity: 0.45;
            filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.6));
          }
          50% {
            stroke-opacity: 0.95;
            filter: drop-shadow(0 0 9px rgba(255, 215, 235, 0.9));
          }
        }
        @keyframes pinwheel-ambient-drift {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.018) rotate(1.5deg);
          }
        }
        .glass-edge-beam {
          stroke-dasharray: 140 540;
          animation: glass-rim-travel 8s linear infinite;
        }
        .glass-edge-beam-hex {
          stroke-dasharray: 160 590;
          animation: glass-rim-travel 9s linear infinite;
        }
        .glass-edge-glaze {
          animation: glass-specular-shimmer 4s ease-in-out infinite;
        }
        .glass-rim-pulsing {
          animation: glass-rim-glow 3.5s ease-in-out infinite;
        }
        .pinwheel-drift {
          animation: pinwheel-ambient-drift 18s ease-in-out infinite;
        }
        @keyframes border-flow-travel {
          0% {
            stroke-dashoffset: 680;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes border-flow-travel-hex {
          0% {
            stroke-dashoffset: 600;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .shape-color-flow-beam {
          stroke-dasharray: 230 450;
          animation: border-flow-travel 10s linear infinite;
        }
        .shape-color-flow-hex {
          stroke-dasharray: 200 400;
          animation: border-flow-travel-hex 10s linear infinite;
        }
      `}</style>

      <div className="w-full max-w-[1600px] mx-auto flex flex-col items-center justify-center">
        {/* Header: Unified Luxury Editorial Architecture */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#890754] tracking-tight">
            {isAr ? "المنتجات الأكثر بحثاً" : "Most Searched Formulas"}
          </h2>
        </div>

        {/* Radial Interactive Flower / Pinwheel Canvas — Luxury Unfolding Every Time on Screen */}
        <motion.div
          initial={{ scale: 0.35, rotate: -25, opacity: 0 }}
          whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{
            duration: 2.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative w-full max-w-[98vw] sm:max-w-[760px] md:max-w-[960px] lg:max-w-[1200px] xl:max-w-[1400px] 2xl:max-w-[1550px] aspect-square flex items-center justify-center will-change-transform pinwheel-drift"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-2 sm:inset-6 rounded-full bg-gradient-to-tr from-[#890754]/10 via-pink-400/8 to-amber-200/12 blur-3xl pointer-events-none" />

          {/* SVG Vector Canvas with Tightly Framed 760x760 ViewBox */}
          <svg
            viewBox="120 120 760 760"
            className="w-full h-full drop-shadow-xl overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Luxury Porcelain Alabaster Material Gradient */}
              <linearGradient id="porcelain-grad" x1="0%" y1="0%" x2="40%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="65%" stopColor="#fcfbfb" />
                <stop offset="100%" stopColor="#f7edf3" />
              </linearGradient>

              {/* Luxury Frosted Crystal Glass Material Gradient */}
              <linearGradient id="glass-card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.97" />
                <stop offset="35%" stopColor="#fefafc" stopOpacity="0.93" />
                <stop offset="70%" stopColor="#fbf0f6" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.98" />
              </linearGradient>

              {/* Glossy Diagonal Specular Surface Glaze */}
              <linearGradient id="glass-specular-glaze" x1="15%" y1="0%" x2="85%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="28%" stopColor="#ffffff" stopOpacity="0.35" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0.04" />
                <stop offset="80%" stopColor="#ffffff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.65" />
              </linearGradient>

              {/* Ultra-Vibrant Multi-Color Flow Gradient — Slow Luxury Chromatic Shift */}
              <linearGradient id="laser-flow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#890754">
                  <animate attributeName="stop-color" values="#890754;#d92982;#ff2a85;#9333ea;#890754" dur="12s" repeatCount="indefinite" />
                </stop>
                <stop offset="25%" stopColor="#d92982">
                  <animate attributeName="stop-color" values="#d92982;#ff2a85;#ff758c;#890754;#d92982" dur="12s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#ff2a85">
                  <animate attributeName="stop-color" values="#ff2a85;#ff758c;#f43f5e;#ff4081;#ff2a85" dur="12s" repeatCount="indefinite" />
                </stop>
                <stop offset="75%" stopColor="#ff758c">
                  <animate attributeName="stop-color" values="#ff758c;#d92982;#890754;#ff758c;#ff758c" dur="12s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#890754">
                  <animate attributeName="stop-color" values="#890754;#9333ea;#d92982;#ff2a85;#890754" dur="12s" repeatCount="indefinite" />
                </stop>
              </linearGradient>

              {/* Glowing Laser Rim Filter */}
              <filter id="laser-glow-filter" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Hover Highlight Gradient */}
              <linearGradient id="porcelain-grad-hover" x1="0%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#fcf4f8" />
                <stop offset="100%" stopColor="#f0dfea" />
              </linearGradient>

              {/* Multi-Layered 3D Ambient Occlusion Drop Shadows */}
              <filter id="petal-shadow" x="-30%" y="-30%" width="170%" height="170%">
                <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="rgba(40, 15, 30, 0.16)" />
                <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(0, 0, 0, 0.07)" />
              </filter>

              <filter id="petal-shadow-active" x="-40%" y="-40%" width="190%" height="190%">
                <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="rgba(137, 7, 84, 0.28)" />
                <feDropShadow dx="0" dy="4" stdDeviation="7" floodColor="rgba(30, 10, 20, 0.12)" />
              </filter>

              {/* Central Hexagon Clip Path */}
              <clipPath id="center-hex-clip">
                <path d={HEXAGON_PATH} />
              </clipPath>

              {/* 6 Rotated Petal Clip Paths */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <clipPath key={`clip-petal-${i}`} id={`clip-petal-${i}`}>
                  <path
                    d={BASE_PETAL_PATH}
                    transform={`rotate(${i * 60}, 500, 500)`}
                  />
                </clipPath>
              ))}
            </defs>

            {/* ── Dynamic 3D Layer Ordering: Non-hovered elements fade back, hovered element scales up on top layer ── */}
            {(() => {
              const isAnyHovered = hoveredIdx !== null;
              // Render hovered item last so it naturally renders on top of all neighbors in SVG
              const renderOrder = [1, 2, 3, 4, 5, 6, 0].sort((a, b) => {
                if (a === hoveredIdx) return 1;
                if (b === hoveredIdx) return -1;
                return 0;
              });

              return renderOrder.map((itemIdx) => {
                if (itemIdx === 0) {
                  // Central Hexagon Hero Card
                  if (!centerProduct) return null;
                  const isHovered = hoveredIdx === 0;
                  const centerImg = getImgSrc(centerProduct);

                  return (
                    <g
                      key="center-hex"
                      className="cursor-pointer select-none"
                      style={{
                        transformOrigin: "500px 500px",
                        transform: isHovered
                          ? "scale(1.24)"
                          : isAnyHovered
                          ? "scale(0.95)"
                          : "scale(1)",
                        opacity: isHovered ? 1 : isAnyHovered ? 0.32 : 1,
                        filter: !isHovered && isAnyHovered ? "grayscale(20%)" : "none",
                        transition: "transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.42s cubic-bezier(0.16, 1, 0.3, 1), filter 0.42s ease",
                      }}
                      onMouseEnter={() => setHoveredIdx(0)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => handleProductClick(centerProduct)}
                    >
                      {/* Central Hexagon Glass 3D Base */}
                      <path
                        d={HEXAGON_PATH}
                        fill={isHovered ? "url(#porcelain-grad-hover)" : "url(#glass-card-grad)"}
                        stroke={isHovered ? "#890754" : "rgba(137, 7, 84, 0.25)"}
                        strokeWidth={isHovered ? "3.2" : "2"}
                        strokeOpacity={isHovered ? 0.9 : 0.65}
                        filter={isHovered ? "url(#petal-shadow-active)" : "url(#petal-shadow)"}
                        className="transition-colors duration-300"
                      />

                      {/* Glossy Specular Glass Surface Glaze */}
                      <path
                        d={HEXAGON_PATH}
                        fill="url(#glass-specular-glaze)"
                        className="pointer-events-none glass-edge-glaze"
                      />

                      {/* Regular Clipped View (Active when not hovered) */}
                      {!isHovered && (
                        <g clipPath="url(#center-hex-clip)">
                          <image
                            href={centerImg}
                            x="402"
                            y="402"
                            width="196"
                            height="196"
                            preserveAspectRatio="xMidYMid meet"
                            className="transition-transform duration-500"
                          />
                          {/* Specular Inner Glaze Ring */}
                          <path
                            d={HEXAGON_PATH}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.7)"
                            strokeWidth="2.5"
                            className="pointer-events-none"
                          />
                        </g>
                      )}

                      {/* Flowing Laser Color-Border on Outside Contour */}
                      <path
                        d={HEXAGON_PATH}
                        fill="none"
                        stroke="url(#laser-flow-grad)"
                        strokeWidth="3.6"
                        strokeLinecap="round"
                        filter="url(#laser-glow-filter)"
                        className="pointer-events-none shape-color-flow-hex"
                      />

                      {/* 3D Pop-out Unclipped View on Hover */}
                      {isHovered && (
                        <g className="pointer-events-none">
                          {/* Soft Ambient Aura */}
                          <circle
                            cx="500"
                            cy="500"
                            r="105"
                            fill="rgba(255, 255, 255, 0.92)"
                            filter="blur(10px)"
                          />
                          <image
                            href={centerImg}
                            x="385"
                            y="385"
                            width="230"
                            height="230"
                            preserveAspectRatio="xMidYMid meet"
                            style={{
                              filter: "drop-shadow(0 16px 26px rgba(0,0,0,0.22))",
                              transformOrigin: "500px 500px",
                              transform: "scale(1.12) translateY(-4px)",
                              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                          />
                        </g>
                      )}
                    </g>
                  );
                } else {
                  // Outer Radial Petal (1 to 6)
                  const i = itemIdx - 1;
                  const product = petalProducts[i];
                  if (!product) return null;
                  const isHovered = hoveredIdx === itemIdx;
                  const angle = i * 60;
                  const center = PETAL_CENTERS[i];
                  const imgSrc = getImgSrc(product);

                  return (
                    <g
                      key={`petal-${i}`}
                      className="cursor-pointer select-none"
                      style={{
                        transformOrigin: `${center.x}px ${center.y}px`,
                        transform: isHovered
                          ? "scale(1.28)"
                          : isAnyHovered
                          ? "scale(0.95)"
                          : "scale(1)",
                        opacity: isHovered ? 1 : isAnyHovered ? 0.32 : 1,
                        filter: !isHovered && isAnyHovered ? "grayscale(20%)" : "none",
                        transition: "transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.42s cubic-bezier(0.16, 1, 0.3, 1), filter 0.42s ease",
                      }}
                      onMouseEnter={() => setHoveredIdx(itemIdx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => handleProductClick(product)}
                    >
                      {/* Physical 3D Glass Card Base */}
                      <path
                        d={BASE_PETAL_PATH}
                        transform={`rotate(${angle}, 500, 500)`}
                        fill={isHovered ? "url(#porcelain-grad-hover)" : "url(#glass-card-grad)"}
                        stroke={isHovered ? "#890754" : "rgba(137, 7, 84, 0.25)"}
                        strokeWidth={isHovered ? "3.2" : "2"}
                        strokeOpacity={isHovered ? 0.9 : 0.65}
                        filter={isHovered ? "url(#petal-shadow-active)" : "url(#petal-shadow)"}
                        className="transition-colors duration-300"
                      />

                      {/* Glossy Specular Glass Surface Glaze */}
                      <path
                        d={BASE_PETAL_PATH}
                        transform={`rotate(${angle}, 500, 500)`}
                        fill="url(#glass-specular-glaze)"
                        className="pointer-events-none glass-edge-glaze"
                      />

                      {/* Regular Clipped View (Active when not hovered) */}
                      {!isHovered && (
                        <g clipPath={`url(#clip-petal-${i})`}>
                          <image
                            href={imgSrc}
                            x={center.x - 85}
                            y={center.y - 85}
                            width={170}
                            height={170}
                            preserveAspectRatio="xMidYMid meet"
                            className="transition-transform duration-500"
                          />

                          {/* Specular Rim Light */}
                          <path
                            d={BASE_PETAL_PATH}
                            transform={`rotate(${angle}, 500, 500)`}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.7)"
                            strokeWidth="2.5"
                            className="pointer-events-none"
                          />
                        </g>
                      )}

                      {/* Flowing Animated Color Border on Outside Contour */}
                      <path
                        d={BASE_PETAL_PATH}
                        transform={`rotate(${angle}, 500, 500)`}
                        fill="none"
                        stroke="url(#laser-flow-grad)"
                        strokeWidth="3.6"
                        strokeLinecap="round"
                        filter="url(#laser-glow-filter)"
                        className="pointer-events-none shape-color-flow-beam"
                        style={{ animationDelay: `${i * 1.6}s` }}
                      />

                      {/* 3D Pop-out Unclipped View on Hover */}
                      {isHovered && (
                        <g className="pointer-events-none">
                          {/* Soft Ambient Aura */}
                          <circle
                            cx={center.x}
                            cy={center.y}
                            r="82"
                            fill="rgba(255, 255, 255, 0.92)"
                            filter="blur(10px)"
                          />
                          <image
                            href={imgSrc}
                            x={center.x - 95}
                            y={center.y - 95}
                            width={190}
                            height={190}
                            preserveAspectRatio="xMidYMid meet"
                            style={{
                              filter: "drop-shadow(0 16px 26px rgba(0,0,0,0.22))",
                              transformOrigin: `${center.x}px ${center.y}px`,
                              transform: "scale(1.15) translateY(-5px)",
                              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                          />
                        </g>
                      )}
                    </g>
                  );
                }
              });
            })()}
          </svg>

          {/* Interactive Floating Product Preview Pill on Hover */}
          <AnimatePresence>
            {hoveredIdx !== null && displayProducts[hoveredIdx] && (
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.92 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-white/95 backdrop-blur-xl px-4 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-[0_16px_36px_rgba(137,7,84,0.18)] border border-pink-100/90 pointer-events-auto cursor-pointer hover:scale-105 active:scale-95 transition-transform select-none"
                onClick={() => handleProductClick(displayProducts[hoveredIdx])}
                title="Click to view product details"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-pink-50 relative shrink-0 border border-pink-100">
                  <Image
                    src={getImgSrc(displayProducts[hoveredIdx])}
                    alt={displayProducts[hoveredIdx].name || "Product"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#890754]">
                    {displayProducts[hoveredIdx].brand?.name || displayProducts[hoveredIdx].brand || "Shafan Beauty"}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-gray-900 line-clamp-1 max-w-[160px] sm:max-w-[260px]">
                    {displayProducts[hoveredIdx].name}
                  </span>
                </div>
                <span className="shrink-0 text-xs sm:text-sm font-black text-gray-900 bg-pink-50/80 px-2.5 py-1 rounded-full border border-pink-100">
                  <Price
                    amount={displayProducts[hoveredIdx].salePrice || displayProducts[hoveredIdx].discountPrice || displayProducts[hoveredIdx].price}
                    countryPrices={displayProducts[hoveredIdx].countryPrices}
                  />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
