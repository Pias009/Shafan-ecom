"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroPromoCardsSection() {
  const cards = [
    {
      id: "promo-1",
      badge: "SKINCARE SALE",
      title: "Up to 30% OFF",
      description: "Your everyday skincare, now at a special price.",
      buttonText: "SHOP SKINCARE",
      buttonBg: "bg-[#0c433a] hover:bg-[#083029] text-white",
      cardBg: "bg-[#e2f0d9]/90 border-[#c5e4b6]",
      badgeBg: "bg-white/90 text-[#0c433a]",
      textColor: "text-[#083029]",
      link: "/products?category=Skin%20Care",
    },
    {
      id: "promo-2",
      badge: "NEW ARRIVALS",
      title: "New Skincare Collection",
      description: "Nature-powered care for naturally radiant skin.",
      buttonText: "EXPLORE NOW",
      buttonBg: "bg-[#d81b60] hover:bg-[#b7154d] text-white",
      cardBg: "bg-[#fce4ec]/90 border-[#f8bbd0]",
      badgeBg: "bg-white/90 text-[#c2185b]",
      textColor: "text-[#880e4f]",
      link: "/products/new-arrivals",
    },
    {
      id: "promo-3",
      badge: "ACCESSORIES",
      title: "For Her, With Love",
      description: "Trendy & elegant accessories that complete your style.",
      buttonText: "SHOP ACCESSORIES",
      buttonBg: "bg-[#5d4037] hover:bg-[#4e342e] text-white",
      cardBg: "bg-[#f5ebe0]/90 border-[#e0d0c1]",
      badgeBg: "bg-white/90 text-[#5d4037]",
      textColor: "text-[#3e2723]",
      link: "/products?category=Body%20Care",
    },
    {
      id: "promo-4",
      badge: "SPECIAL OFFER",
      title: "Buy 2, Get 1 Free",
      description: "On selected skincare essentials.",
      buttonText: "SHOP THE OFFER",
      buttonBg: "bg-[#512da8] hover:bg-[#4527a0] text-white",
      cardBg: "bg-[#ede7f6]/90 border-[#d1c4e9]",
      badgeBg: "bg-white/90 text-[#512da8]",
      textColor: "text-[#311b92]",
      link: "/products/flash-sales",
    },
  ];

  return (
    <section className="relative z-20 max-w-[1440px] mx-auto px-3 sm:px-6 pt-4 pb-8">
      {/* Container Box */}
      <div className="bg-white/95 sm:bg-white backdrop-blur-xl border border-white/90 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-7 shadow-[0_15px_40px_rgba(4,43,36,0.08)]">
        {/* 4 Promo Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className={`relative rounded-3xl p-5 sm:p-6 border shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[220px] ${card.cardBg}`}
            >
              <div className="space-y-3">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-2xs">
                  <Sparkles size={12} className="shrink-0" />
                  <span className={card.badgeBg}>{card.badge}</span>
                </div>

                {/* Title */}
                <h3 className={`font-serif font-black text-xl sm:text-2xl leading-tight tracking-tight ${card.textColor}`}>
                  {card.title}
                </h3>

                {/* Description */}
                <p className={`text-xs font-medium leading-relaxed opacity-85 ${card.textColor}`}>
                  {card.description}
                </p>
              </div>

              {/* Button CTA */}
              <div className="pt-4">
                <Link
                  href={card.link}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-[11px] uppercase tracking-wider transition-all shadow-xs hover:scale-105 active:scale-95 ${card.buttonBg}`}
                >
                  <span>{card.buttonText}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Centered Dots Indicator below promo cards matching reference screenshot */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="w-3 h-3 rounded-full bg-[#0c433a] shadow-2xs" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#0c433a]/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#0c433a]/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#0c433a]/30" />
        </div>
      </div>
    </section>
  );
}
