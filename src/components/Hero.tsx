"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10">
      <div className="relative overflow-hidden rounded-3xl">
        <div className="glass glass-3d ring-icy rounded-3xl p-7 md:p-10">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-white/15"
              >
                <span className="text-white">❄</span>
                Ice-glass drops • fast checkout • tracked delivery
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05 }}
                className="text-icy mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl"
              >
                A storefront that feels like
                <span className="text-white/80"> frozen light</span>.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="mt-4 max-w-xl text-pretty text-base leading-7 text-white/75"
              >
                Transparent 3D glass cards, crisp typography, and motion that stays smooth. Browse hot
                picks, filter instantly, then pay with Stripe—delivery updates appear in your dashboard.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="mt-6 flex flex-wrap items-center gap-3"
              >
                <Link
                  href="#products"
                  className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black shadow-lg shadow-black/20 transition hover:translate-y-[-1px]"
                >
                  Explore products
                </Link>
                <Link
                  href="#hot"
                  className="glass glass-3d ring-icy inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-white/90 transition hover:text-white"
                >
                  View hot drops
                </Link>
              </motion.div>
            </div>

            <div className="relative">
              <div className="glass glass-3d ring-icy relative aspect-[4/3] overflow-hidden rounded-3xl">
                <motion.div
                  aria-hidden
                  className="absolute inset-0"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{ duration: 12, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
                  style={{
                    backgroundImage:
                      "radial-gradient(600px 240px at 20% 20%, rgba(125,211,252,.35), transparent 60%), radial-gradient(480px 240px at 80% 20%, rgba(196,181,253,.28), transparent 55%), radial-gradient(520px 280px at 50% 85%, rgba(110,231,183,.20), transparent 60%)",
                    backgroundSize: "160% 160%",
                  }}
                />

                <motion.div
                  className="absolute left-6 top-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/85 ring-1 ring-white/15"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.12 }}
                >
                  <div className="text-xs text-white/70">Today’s drop</div>
                  <div className="mt-1 text-base font-semibold text-white">Glass Skin Serum</div>
                  <div className="mt-1 text-xs text-white/70">Lightweight • fast glow</div>
                </motion.div>

                <motion.div
                  className="absolute bottom-6 right-6 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/85 ring-1 ring-white/15"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="text-xs text-white/70">Delivery</div>
                  <div className="mt-1 text-base font-semibold text-white">Courier tracked</div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

