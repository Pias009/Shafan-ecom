"use client";

import { useState, useEffect } from "react";

interface UseScrollDirectionOptions {
  threshold?: number;
}

export function useScrollDirection({ threshold = 10 }: UseScrollDirectionOptions = {}) {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      if (currentScrollY < threshold) {
        setScrollDirection("up");
      } else if (currentScrollY > lastScrollY + threshold) {
        setScrollDirection("down");
      } else if (currentScrollY < lastScrollY - threshold) {
        setScrollDirection("up");
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return { scrollDirection, scrollY };
}
