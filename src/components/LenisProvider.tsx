"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";

/**
 * LenisProvider — Wires Lenis smooth scroll to the GSAP ticker.
 * Disabled on mobile (<768px) to preserve native momentum scrolling.
 * Safe to mount once in ClientLayout.
 */
export function LenisProvider() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Skip on touch/mobile devices
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (isMobile || prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    // Sync Lenis RAF with GSAP ticker for frame-perfect 120fps animations
    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return null;
}
