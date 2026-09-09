"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <section className="w-full py-8 sm:py-14 px-2 sm:px-6 select-none overflow-hidden my-4">
      <div className="max-w-[1440px] mx-auto flex flex-col items-center justify-center">
        {/* Radial Interactive Flower / Pinwheel Canvas */}
        <div className="relative w-full max-w-[360px] xs:max-w-[420px] sm:max-w-[530px] md:max-w-[620px] lg:max-w-[680px] aspect-square flex items-center justify-center">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-4 sm:inset-10 rounded-full bg-gradient-to-tr from-[#890754]/8 via-pink-400/5 to-amber-200/10 blur-3xl pointer-events-none" />

          {/* SVG Vector Canvas with Pure Physical 3D Porcelain Cards & Zero Text */}
          <svg
            viewBox="0 0 1000 1000"
            className="w-full h-full drop-shadow-xl overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Luxury Porcelain Alabaster Material Gradient */}
              <linearGradient id="porcelain-grad" x1="0%" y1="0%" x2="40%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="65%" stopColor="#fdfbfa" />
                <stop offset="100%" stopColor="#f3ede6" />
              </linearGradient>

              {/* Hover Highlight Gradient */}
              <linearGradient id="porcelain-grad-hover" x1="0%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#faf6f8" />
                <stop offset="100%" stopColor="#ede2eb" />
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

            {/* ── 6 Outer Radial Petal Cards ── */}
            {petalProducts.map((product, i) => {
              const isHovered = hoveredIdx === i + 1;
              const angle = i * 60;
              const center = PETAL_CENTERS[i];
              const imgSrc = getImgSrc(product);

              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  style={{
                    transformOrigin: `${center.x}px ${center.y}px`,
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={() => setHoveredIdx(i + 1)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => handleProductClick(product)}
                >
                  {/* Physical 3D Porcelain Card Base */}
                  <path
                    d={BASE_PETAL_PATH}
                    transform={`rotate(${angle}, 500, 500)`}
                    fill={isHovered ? "url(#porcelain-grad-hover)" : "url(#porcelain-grad)"}
                    stroke={isHovered ? "#890754" : "rgba(255, 255, 255, 0.95)"}
                    strokeWidth={isHovered ? "2.5" : "1.8"}
                    strokeOpacity={isHovered ? 0.45 : 0.9}
                    filter={isHovered ? "url(#petal-shadow-active)" : "url(#petal-shadow)"}
                    className="transition-colors duration-300"
                  />

                  {/* Clean Upright Product Image (No Text) clipped to Petal */}
                  <g clipPath={`url(#clip-petal-${i})`}>
                    <image
                      href={imgSrc}
                      x={center.x - 110}
                      y={center.y - 110}
                      width={220}
                      height={220}
                      preserveAspectRatio="xMidYMid meet"
                      className="transition-transform duration-500"
                      style={{
                        transformOrigin: `${center.x}px ${center.y}px`,
                        transform: isHovered ? "scale(1.08)" : "scale(1)",
                        transition: "transform 0.4s ease-out",
                      }}
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
                </g>
              );
            })}

            {/* ── Central Hexagon Hero Card ── */}
            {centerProduct && (() => {
              const isCenterHovered = hoveredIdx === 0;
              const centerImg = getImgSrc(centerProduct);

              return (
                <g
                  className="cursor-pointer"
                  style={{
                    transformOrigin: "500px 500px",
                    transform: isCenterHovered ? "scale(1.06)" : "scale(1)",
                    transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={() => setHoveredIdx(0)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => handleProductClick(centerProduct)}
                >
                  {/* Central Hexagon Porcelain 3D Base */}
                  <path
                    d={HEXAGON_PATH}
                    fill={isCenterHovered ? "url(#porcelain-grad-hover)" : "url(#porcelain-grad)"}
                    stroke={isCenterHovered ? "#890754" : "rgba(255, 255, 255, 0.95)"}
                    strokeWidth={isCenterHovered ? "2.5" : "2"}
                    strokeOpacity={isCenterHovered ? 0.5 : 0.9}
                    filter={isCenterHovered ? "url(#petal-shadow-active)" : "url(#petal-shadow)"}
                    className="transition-colors duration-300"
                  />

                  {/* Clean Central Upright Product Image (No Text) clipped to Hexagon */}
                  <g clipPath="url(#center-hex-clip)">
                    <image
                      href={centerImg}
                      x="380"
                      y="380"
                      width="240"
                      height="240"
                      preserveAspectRatio="xMidYMid meet"
                      className="transition-transform duration-500"
                      style={{
                        transformOrigin: "500px 500px",
                        transform: isCenterHovered ? "scale(1.08)" : "scale(1)",
                        transition: "transform 0.4s ease-out",
                      }}
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
                </g>
              );
            })()}
          </svg>
        </div>
      </div>
    </section>
  );
}
