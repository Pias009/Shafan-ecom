"use client";

import { useRef, useCallback } from "react";
import gsap from "gsap";

/**
 * useMagneticButton — physics-based magnetic cursor attraction.
 * Attaches to any button/element. Uses gsap.quickTo() for
 * velocity-interpolated spring-like motion without jank.
 *
 * Usage:
 *   const { ref, onMouseMove, onMouseLeave } = useMagneticButton();
 *   <button ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
 */
export function useMagneticButton<T extends HTMLElement = HTMLElement>(
  strength = 0.4
) {
  const ref = useRef<T>(null);
  const xQuickTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const yQuickTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  const initQuickTo = useCallback(() => {
    if (!ref.current || xQuickTo.current) return;
    xQuickTo.current = gsap.quickTo(ref.current, "x", {
      duration: 0.6,
      ease: "power3.out",
    });
    yQuickTo.current = gsap.quickTo(ref.current, "y", {
      duration: 0.6,
      ease: "power3.out",
    });
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      initQuickTo();
      if (!ref.current || !xQuickTo.current || !yQuickTo.current) return;

      const { left, top, width, height } =
        ref.current.getBoundingClientRect();
      const relX = e.clientX - (left + width / 2);
      const relY = e.clientY - (top + height / 2);

      xQuickTo.current(relX * strength);
      yQuickTo.current(relY * strength);
    },
    [initQuickTo, strength]
  );

  const onMouseLeave = useCallback(() => {
    if (!ref.current || !xQuickTo.current || !yQuickTo.current) return;
    xQuickTo.current(0);
    yQuickTo.current(0);
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
