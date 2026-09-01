"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register plugins once
gsap.registerPlugin(ScrollTrigger);

type RevealVariant = "fade-up" | "fade-left" | "fade-right" | "clip-reveal";

interface UseGSAPRevealOptions {
  variant?: RevealVariant;
  stagger?: number;
  duration?: number;
  delay?: number;
  /** CSS selector for children to stagger. If omitted, animates the container itself. */
  selector?: string;
  threshold?: number;
}

/**
 * useGSAPReveal — scroll-triggered stagger reveal hook.
 * Uses clip-path masks for headings and fade+translate for blocks.
 *
 * Usage:
 *   const containerRef = useGSAPReveal({ variant: "clip-reveal", selector: ".line" });
 *   <div ref={containerRef}>
 *     <span className="line">Word</span>
 *   </div>
 */
export function useGSAPReveal<T extends HTMLElement = HTMLDivElement>({
  variant = "fade-up",
  stagger = 0.08,
  duration = 0.9,
  delay = 0,
  selector,
  threshold = 0.15,
}: UseGSAPRevealOptions = {}) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      const targets = selector
        ? ref.current.querySelectorAll<HTMLElement>(selector)
        : [ref.current];

      if (!targets.length) return;

      const fromVars: gsap.TweenVars = (() => {
        switch (variant) {
          case "clip-reveal":
            return {
              clipPath: "inset(0 0 100% 0)",
              y: 20,
              opacity: 0,
            };
          case "fade-left":
            return { x: -40, opacity: 0 };
          case "fade-right":
            return { x: 40, opacity: 0 };
          default: // fade-up
            return { y: 40, opacity: 0 };
        }
      })();

      const toVars: gsap.TweenVars = (() => {
        switch (variant) {
          case "clip-reveal":
            return {
              clipPath: "inset(0 0 0% 0)",
              y: 0,
              opacity: 1,
              duration,
              ease: "power4.out",
              stagger,
              delay,
            };
          default:
            return {
              y: 0,
              x: 0,
              opacity: 1,
              duration,
              ease: "power3.out",
              stagger,
              delay,
            };
        }
      })();

      gsap.fromTo(targets, fromVars, {
        ...toVars,
        scrollTrigger: {
          trigger: ref.current,
          start: `top ${100 - threshold * 100}%`,
          once: true,
        },
      });
    },
    { scope: ref }
  );

  return ref;
}
