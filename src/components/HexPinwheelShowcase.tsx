"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguageStore } from "@/lib/language-store";

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
    <section className="w-full py-6 sm:py-10 md:py-12 px-2 sm:px-6 select-none overflow-hidden my-2 sm:my-4">
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

      <div className="w-full max-w-[1536px] mx-auto flex flex-col items-center justify-center">
        {/* Header: Clean Modern Sans-Serif */}
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-slate-900 select-none">
            {isAr ? "المنتجات الأكثر بحثاً" : "Most Searched Formulas"}
          </h2>
        </div>

        {/* Compact Radial Flower / Pinwheel Canvas — Scaled Down for Clean Proportions */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative w-full max-w-[280px] sm:max-w-[360px] md:max-w-[430px] lg:max-w-[480px] xl:max-w-[520px] aspect-square flex items-center justify-center will-change-transform pinwheel-drift"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-2 sm:inset-4 rounded-full bg-gradient-to-tr from-[#890754]/8 via-pink-400/5 to-amber-200/8 blur-2xl pointer-events-none" />

          {/* SVG Vector Canvas with Tightly Framed 760x760 ViewBox */}
          <svg
            viewBox="120 120 760 760"
            className="w-full h-full drop-shadow-md overflow-visible"
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
                <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="rgba(40, 15, 30, 0.12)" />
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0, 0, 0, 0.05)" />
              </filter>

              <filter id="petal-shadow-active" x="-40%" y="-40%" width="190%" height="190%">
                <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="rgba(137, 7, 84, 0.22)" />
                <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(30, 10, 20, 0.08)" />
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

            {/* ── Render Elements: Center Hexagon + 6 Outer Petals ── */}
            {[0, 1, 2, 3, 4, 5, 6].map((itemIdx) => {
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
                      transform: isHovered ? "scale(1.03)" : "scale(1)",
                      transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
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
                      strokeWidth={isHovered ? "2.8" : "1.8"}
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

                    {/* Always Clipped Cleanly Inside Hexagon */}
                    <g clipPath="url(#center-hex-clip)">
                      <image
                        href={centerImg}
                        x="392"
                        y="392"
                        width="216"
                        height="216"
                        preserveAspectRatio="xMidYMid meet"
                        className="transition-transform duration-500"
                      />
                      {/* Specular Inner Glaze Ring */}
                      <path
                        d={HEXAGON_PATH}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.7)"
                        strokeWidth="2"
                        className="pointer-events-none"
                      />
                    </g>

                    {/* Flowing Laser Color-Border on Outside Contour */}
                    <path
                      d={HEXAGON_PATH}
                      fill="none"
                      stroke="url(#laser-flow-grad)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      filter="url(#laser-glow-filter)"
                      className="pointer-events-none shape-color-flow-hex"
                    />
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
                      transform: isHovered ? "scale(1.03)" : "scale(1)",
                      transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
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
                      strokeWidth={isHovered ? "2.8" : "1.8"}
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

                    {/* Always Clipped Cleanly Inside Petal */}
                    <g clipPath={`url(#clip-petal-${i})`}>
                      <image
                        href={imgSrc}
                        x={center.x - 102}
                        y={center.y - 102}
                        width={204}
                        height={204}
                        preserveAspectRatio="xMidYMid meet"
                        className="transition-transform duration-500"
                      />

                      {/* Specular Rim Light */}
                      <path
                        d={BASE_PETAL_PATH}
                        transform={`rotate(${angle}, 500, 500)`}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.7)"
                        strokeWidth="2"
                        className="pointer-events-none"
                      />
                    </g>

                    {/* Flowing Animated Color Border on Outside Contour */}
                    <path
                      d={BASE_PETAL_PATH}
                      transform={`rotate(${angle}, 500, 500)`}
                      fill="none"
                      stroke="url(#laser-flow-grad)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      filter="url(#laser-glow-filter)"
                      className="pointer-events-none shape-color-flow-beam"
                      style={{ animationDelay: `${i * 1.6}s` }}
                    />
                  </g>
                );
              }
            })}
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
