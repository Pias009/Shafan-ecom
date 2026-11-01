"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Gift, Sparkles } from "lucide-react";
import { trackPromotion } from "@/lib/datalayer";
import { MYSTERY_BOX_PROMO, mysteryBoxProgress } from "@/lib/mystery-box";

const PROMO = {
  id: MYSTERY_BOX_PROMO.id,
  name: MYSTERY_BOX_PROMO.name,
  creative: "checkout_glass_cube",
  slot: "checkout_mystery_box",
};

// Cube faces: front, right, back, left, top, bottom. 72px cube → 36px depth.
const FACES = ["rotateY(0deg)", "rotateY(90deg)", "rotateY(180deg)", "rotateY(-90deg)", "rotateX(90deg)", "rotateX(-90deg)"];

function lockedCopy(remaining: number, isArabic: boolean) {
  if (isArabic) {
    const n = remaining === 1 ? "منتجاً واحداً آخر" : remaining === 2 ? "منتجين آخرين" : `${remaining} منتجات أخرى`;
    return `أضف ${n} واحصل على صندوق مفاجآت مجاناً`;
  }
  return `Add ${remaining} more item${remaining === 1 ? "" : "s"} & get a Mystery Box FREE`;
}

function MysteryCube({ unlocked, reduce }: { unlocked: boolean; reduce: boolean }) {
  return (
    <div aria-hidden className="relative h-[72px] w-[72px] shrink-0 [perspective:600px]">
      <motion.div
        className="absolute -bottom-4 left-1/2 h-3 w-14 -translate-x-1/2 rounded-full bg-fuchsia-500/60 blur-md"
        animate={reduce ? undefined : { scale: [1, 0.75, 1], opacity: [0.8, 0.45, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="h-full w-full [transform-style:preserve-3d]"
        animate={reduce ? undefined : { y: [0, -7, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          initial={{ rotateX: -22, rotateY: -32 }}
          animate={reduce ? { rotateX: -22, rotateY: -32 } : { rotateX: -22, rotateY: [-32, 328] }}
          transition={{ duration: unlocked ? 5 : 11, repeat: Infinity, ease: "linear" }}
        >
          {FACES.map((rotate, i) => {
            const isCap = i >= 4;
            return (
              <div
                key={rotate}
                className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg border border-white/45 bg-gradient-to-br from-white/40 via-fuchsia-300/20 to-red-400/35 shadow-[inset_0_0_18px_rgba(255,255,255,0.3)]"
                style={{ transform: `${rotate} translateZ(36px)` }}
              >
                {/* Ribbon: a vertical band on the sides, a cross on the caps */}
                <span className="absolute inset-y-0 left-1/2 w-2.5 -translate-x-1/2 bg-gradient-to-b from-amber-200/90 to-amber-400/80" />
                {isCap && <span className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 bg-gradient-to-r from-amber-200/90 to-amber-400/80" />}
                {!isCap && (
                  <span className="relative text-2xl font-black text-white drop-shadow-[0_1px_6px_rgba(80,0,120,0.6)]">
                    {unlocked ? <Gift className="h-6 w-6" strokeWidth={2.5} /> : "?"}
                  </span>
                )}
              </div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Burst when the reward unlocks */}
      <AnimatePresence>
        {unlocked && !reduce && (
          <div key="burst" className="pointer-events-none absolute inset-0">
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full ${i % 2 ? "bg-amber-200" : "bg-fuchsia-200"}`}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(angle) * 60, y: Math.sin(angle) * 60, opacity: 0, scale: 0.3 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Glassmorphism incentive card shown next to the order summary: shows how many
// more units unlock a free mystery box, then celebrates once the cart qualifies.
export function MysteryBoxPromo({ units, isArabic }: { units: number; isArabic: boolean }) {
  const reduce = !!useReducedMotion();
  const { threshold, enabled } = MYSTERY_BOX_PROMO;
  const { count, remaining, unlocked } = mysteryBoxProgress(units);

  useEffect(() => {
    if (enabled) trackPromotion("view_promotion", PROMO);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <section
      aria-labelledby="mystery-box-title"
      className={`relative isolate overflow-hidden rounded-2xl lg:rounded-3xl p-px shadow-xl transition-shadow duration-500 ${
        unlocked
          ? "bg-gradient-to-br from-amber-200/70 via-fuchsia-400/50 to-emerald-400/60 shadow-fuchsia-900/30"
          : "bg-gradient-to-br from-white/50 via-fuchsia-400/40 to-red-500/50 shadow-fuchsia-900/20"
      }`}
    >
      <div className="relative overflow-hidden rounded-[15px] lg:rounded-[23px] bg-[#160b30] p-4 sm:p-5">
        {/* Aurora behind the glass */}
        <motion.div
          aria-hidden
          className="absolute -left-12 -top-16 h-44 w-44 rounded-full bg-fuchsia-500/50 blur-3xl"
          animate={reduce ? undefined : { x: [0, 30, 0], y: [0, 12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-20 -right-6 h-48 w-48 rounded-full bg-red-500/40 blur-3xl"
          animate={reduce ? undefined : { x: [0, -24, 0], y: [0, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <div aria-hidden className="absolute left-1/3 top-1/2 h-28 w-28 rounded-full bg-sky-400/25 blur-3xl" />

        <div className="relative flex items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.07] p-3.5 sm:gap-5 sm:p-4 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
          <div className="px-1 py-2">
            <MysteryCube unlocked={unlocked} reduce={reduce} />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${
                unlocked ? "text-emerald-300" : "text-fuchsia-200"
              }`}
            >
              {unlocked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Sparkles className="h-3.5 w-3.5" />}
              {unlocked ? (isArabic ? "تم فتح المكافأة" : "Reward unlocked") : isArabic ? "صندوق المفاجآت" : "Mystery Box"}
            </p>

            <h3 id="mystery-box-title" aria-live="polite" className="mt-1 text-sm font-black leading-snug text-white sm:text-base">
              {unlocked
                ? isArabic
                  ? "صندوق مفاجآت مجاني يُشحن مع طلبك"
                  : "A FREE Mystery Box ships with this order"
                : lockedCopy(remaining, isArabic)}
            </h3>

            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={threshold}
              aria-valuenow={count}
              aria-label={isArabic ? "التقدم نحو صندوق المفاجآت" : "Progress to free Mystery Box"}
              className="mt-3 flex gap-1.5"
            >
              {Array.from({ length: threshold }, (_, i) => (
                <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                  <motion.div
                    className={`h-full origin-left rounded-full bg-gradient-to-r ${
                      unlocked ? "from-amber-300 to-emerald-400" : "from-fuchsia-400 to-red-400"
                    }`}
                    initial={false}
                    animate={{ scaleX: i < count ? 1 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] font-semibold text-white/70">
              {count}/{threshold} {isArabic ? "منتجات" : "items"}
            </p>
          </div>
        </div>

        {!unlocked && (
          <Link
            href="/products"
            onClick={() => trackPromotion("select_promotion", PROMO)}
            className="relative mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-[11px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md transition hover:bg-white/20 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300"
          >
            {isArabic ? "تسوق المزيد" : `Add ${remaining} more`}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        )}
      </div>
    </section>
  );
}
