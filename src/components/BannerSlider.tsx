"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  accent: "blush" | "sage" | "cream" | "forest";
  animation: "wipe" | "fold" | "float" | "blurIn";
};

const slides: Slide[] = [
  {
    id: "s1",
    title: "4 banners. 4 motions.",
    subtitle: "Each change feels different — never repetitive.",
    accent: "cream",
    animation: "wipe",
  },
  {
    id: "s2",
    title: "Hot drops update fast",
    subtitle: "Featured products float to the top automatically.",
    accent: "blush",
    animation: "float",
  },
  {
    id: "s3",
    title: "Coupons & discounts",
    subtitle: "Apply codes at checkout — admin can generate %",
    accent: "sage",
    animation: "fold",
  },
  {
    id: "s4",
    title: "Courier-tracked orders",
    subtitle: "Status updates flow into user + admin dashboards.",
    accent: "forest",
    animation: "blurIn",
  },
];

const accentBg: Record<Slide["accent"], string> = {
  cream: "from-[hsla(40,33%,93%,0.6)] via-[hsla(15,28%,76%,0.15)] to-[hsla(40,33%,97%,0.3)]",
  blush: "from-[hsla(15,28%,76%,0.35)] via-[hsla(40,33%,90%,0.2)] to-[hsla(120,10%,70%,0.15)]",
  sage:  "from-[hsla(120,10%,70%,0.30)] via-[hsla(40,33%,90%,0.2)] to-[hsla(15,28%,76%,0.10)]",
  forest:"from-[hsla(140,15%,19%,0.08)] via-[hsla(120,10%,70%,0.15)] to-[hsla(40,33%,90%,0.20)]",
};

const accentText: Record<Slide["accent"], string> = {
  cream: "text-forest",
  blush: "text-forest",
  sage:  "text-forest",
  forest:"text-forest",
};

function variantsFor(animation: Slide["animation"]) {
  switch (animation) {
    case "wipe":
      return {
        initial: { opacity: 0, x: 40, clipPath: "inset(0 0 0 100%)" },
        animate: { opacity: 1, x: 0, clipPath: "inset(0 0 0 0%)" },
        exit:    { opacity: 0, x: -40, clipPath: "inset(0 100% 0 0)" },
      } as const;
    case "fold":
      return {
        initial: { opacity: 0, rotateX: 65, y: 20, transformOrigin: "top" },
        animate: { opacity: 1, rotateX: 0, y: 0 },
        exit:    { opacity: 0, rotateX: -65, y: -20, transformOrigin: "bottom" },
      } as const;
    case "float":
      return {
        initial: { opacity: 0, y: 18, scale: 0.985 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit:    { opacity: 0, y: -18, scale: 0.985 },
      } as const;
    case "blurIn":
      return {
        initial: { opacity: 0, filter: "blur(10px)", scale: 0.99 },
        animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
        exit:    { opacity: 0, filter: "blur(10px)", scale: 0.99 },
      } as const;
  }
}

export function BannerSlider() {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4200);
    return () => clearInterval(t);
  }, []);

  const v = useMemo(() => variantsFor(slide.animation), [slide.animation]);

  if (!mounted) {
    return (
      <section className="mx-auto max-w-7xl px-6 pt-6">
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className={`relative bg-gradient-to-r ${accentBg[slides[0].accent]} p-6 md:p-8`}>
            <div className="grid gap-2">
              <div className={`text-xs font-body font-bold uppercase tracking-[0.25em] text-black/60`}>
                Latest Updates
              </div>
              <div className={`font-display text-balance text-2xl font-bold md:text-3xl text-black`}>
                {slides[0].title}
              </div>
              <div className={`font-body max-w-2xl text-pretty text-sm leading-6 md:text-base text-black/70 font-medium`}>
                {slides[0].subtitle}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pt-6">
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className={`relative bg-gradient-to-r ${accentBg[slide.accent]} p-6 md:p-8`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={v.initial}
              animate={v.animate}
              exit={v.exit}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="grid gap-2"
            >
              <div className={`text-xs font-body font-bold uppercase tracking-[0.25em] text-black/60`}>
                Latest Updates
              </div>
              <div className={`font-display text-balance text-2xl font-bold md:text-3xl text-black`}>
                {slide.title}
              </div>
              <div className={`font-body max-w-2xl text-pretty text-sm leading-6 md:text-base text-black/70 font-medium`}>
                {slide.subtitle}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full ring-1 ring-black/20 transition ${
                    i === index ? "bg-black" : "bg-black/20 hover:bg-black/40"
                  }`}
                />
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
