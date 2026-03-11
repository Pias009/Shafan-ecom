"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  accent: "sky" | "violet" | "mint" | "ice";
  animation: "wipe" | "fold" | "float" | "blurIn";
};

const slides: Slide[] = [
  {
    id: "s1",
    title: "4 banners. 4 motions.",
    subtitle: "Each change feels different—never repetitive.",
    accent: "ice",
    animation: "wipe",
  },
  {
    id: "s2",
    title: "Hot drops update fast",
    subtitle: "Featured products float to the top automatically.",
    accent: "sky",
    animation: "float",
  },
  {
    id: "s3",
    title: "Coupons & discounts",
    subtitle: "Apply codes at checkout—admin can generate %",
    accent: "violet",
    animation: "fold",
  },
  {
    id: "s4",
    title: "Courier-tracked orders",
    subtitle: "Status updates flow into user + admin dashboards.",
    accent: "mint",
    animation: "blurIn",
  },
];

const accentBg: Record<Slide["accent"], string> = {
  ice: "from-white/10 via-sky-300/10 to-white/5",
  sky: "from-sky-400/15 via-white/10 to-indigo-300/10",
  violet: "from-violet-400/15 via-white/10 to-sky-300/10",
  mint: "from-emerald-300/15 via-white/10 to-sky-300/10",
};

function variantsFor(animation: Slide["animation"]) {
  switch (animation) {
    case "wipe":
      return {
        initial: { opacity: 0, x: 40, clipPath: "inset(0 0 0 100%)" },
        animate: { opacity: 1, x: 0, clipPath: "inset(0 0 0 0%)" },
        exit: { opacity: 0, x: -40, clipPath: "inset(0 100% 0 0%)" },
      } as const;
    case "fold":
      return {
        initial: { opacity: 0, rotateX: 65, y: 20, transformOrigin: "top" },
        animate: { opacity: 1, rotateX: 0, y: 0 },
        exit: { opacity: 0, rotateX: -65, y: -20, transformOrigin: "bottom" },
      } as const;
    case "float":
      return {
        initial: { opacity: 0, y: 18, scale: 0.985 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -18, scale: 0.985 },
      } as const;
    case "blurIn":
      return {
        initial: { opacity: 0, filter: "blur(10px)", scale: 0.99 },
        animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
        exit: { opacity: 0, filter: "blur(10px)", scale: 0.99 },
      } as const;
  }
}

export function BannerSlider() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4200);
    return () => clearInterval(t);
  }, []);

  const v = useMemo(() => variantsFor(slide.animation), [slide.animation]);

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6">
      <div className="glass glass-3d ring-icy overflow-hidden rounded-3xl">
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
              <div className="text-xs font-medium uppercase tracking-[0.25em] text-white/60">
                Banner
              </div>
              <div className="text-balance text-2xl font-semibold tracking-tight text-white md:text-3xl">
                {slide.title}
              </div>
              <div className="max-w-2xl text-pretty text-sm leading-6 text-white/70 md:text-base">
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
                  className={`h-2.5 w-2.5 rounded-full ring-1 ring-white/30 transition ${
                    i === index ? "bg-white" : "bg-white/20 hover:bg-white/35"
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-white/55">Auto-rotates • click dots to jump</div>
          </div>
        </div>
      </div>
    </section>
  );
}

