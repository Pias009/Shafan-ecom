"use client";

import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      {/* Logo Container */}
      <div className="relative flex items-center">
        {/* Decorative Flower SVG Background */}
        <svg
          className="absolute -left-4 -top-2 w-20 h-20 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer petals */}
          <path
            d="M50 10 C55 25, 70 30, 85 35 C70 40, 55 45, 50 60 C45 45, 30 40, 15 35 C30 30, 45 25, 50 10Z"
            fill="currentColor"
            className="text-rose-200"
          />
          <path
            d="M50 90 C45 75, 30 70, 15 65 C30 60, 45 55, 50 40 C55 55, 70 60, 85 65 C70 70, 55 75, 50 90Z"
            fill="currentColor"
            className="text-rose-200"
          />
          <path
            d="M10 50 C25 45, 30 30, 35 15 C40 30, 45 45, 60 50 C45 55, 40 70, 35 85 C30 70, 25 55, 10 50Z"
            fill="currentColor"
            className="text-rose-200"
          />
          <path
            d="M90 50 C75 55, 70 70, 65 85 C60 70, 55 55, 40 50 C55 45, 60 30, 65 15 C70 30, 75 45, 90 50Z"
            fill="currentColor"
            className="text-rose-200"
          />
          {/* Inner petals */}
          <path
            d="M50 20 C53 32, 62 37, 72 40 C62 43, 53 48, 50 60 C47 48, 38 43, 28 40 C38 37, 47 32, 50 20Z"
            fill="currentColor"
            className="text-emerald-200"
          />
          <path
            d="M50 80 C47 68, 38 63, 28 60 C38 57, 47 52, 50 40 C53 52, 62 57, 72 60 C62 63, 53 68, 50 80Z"
            fill="currentColor"
            className="text-emerald-200"
          />
          <path
            d="M20 50 C32 47, 37 38, 40 28 C43 38, 48 47, 60 50 C48 53, 43 62, 40 72 C37 62, 32 53, 20 50Z"
            fill="currentColor"
            className="text-emerald-200"
          />
          <path
            d="M80 50 C68 53, 63 62, 60 72 C57 62, 52 53, 40 50 C52 47, 57 38, 60 28 C63 38, 68 47, 80 50Z"
            fill="currentColor"
            className="text-emerald-200"
          />
          {/* Center */}
          <circle cx="50" cy="50" r="8" fill="currentColor" className="text-amber-100" />
        </svg>

        {/* Main Logo Text */}
        <div className="relative z-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              SHANFA
            </span>
          </h1>
          {/* Tagline */}
          <p className="text-[10px] md:text-xs font-body tracking-[0.3em] text-emerald-700/70 uppercase mt-0.5">
            Natural Skincare
          </p>
        </div>

        {/* Small decorative leaf */}
        <svg
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/40 group-hover:text-emerald-500/60 transition-colors duration-300"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.58-.5 5.07-1.37-.62-1.07-.97-2.29-.97-3.58 0-3.87 3.13-7 7-7 .34 0 .67.03 1 .08C23.03 4.94 17.97 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      </div>
    </Link>
  );
}
