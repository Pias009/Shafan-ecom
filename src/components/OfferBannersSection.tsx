"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tag, ExternalLink } from "lucide-react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

interface OfferBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  active: boolean;
}

export function OfferBannersSection() {
  const [banners, setBanners] = useState<OfferBanner[]>([]);
  const [active, setActive] = useState(0);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  useEffect(() => {
    fetch("/api/offer-banners")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBanners(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 pt-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 glass-panel rounded-full px-5 py-2 mb-3">
          <Tag size={12} className="text-black/40" />
          <span className="text-[10px] font-black uppercase tracking-widest text-black/60">{t.home.specialOffers}</span>
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-black text-black">{t.home.featuredDeals}</h2>
      </div>

      {/* Single banner */}
      {banners.length === 1 && (
        <BannerCard banner={banners[0]} />
      )}

      {/* Multi banners: main + side */}
      {banners.length > 1 && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div className="md:col-span-2 lg:col-span-3">
            <BannerCard banner={banners[active]} large />
          </div>
          <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-visible">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setActive(i)}
                className={`relative flex-shrink-0 w-32 md:w-auto aspect-[16/7] md:aspect-[3/1] rounded-xl md:rounded-2xl overflow-hidden border-2 transition-all ${
                  i === active ? "border-black shadow-lg scale-[0.98]" : "border-transparent opacity-60 hover:opacity-90"
                }`}
              >
                <Image src={b.imageUrl} alt={b.title || "offer"} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function BannerCard({ banner, large }: { banner: OfferBanner; large?: boolean }) {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const content = (
    <div className={`relative w-full ${large ? "aspect-[21/7]" : "aspect-[21/8]"} rounded-[2rem] overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500`}>
      <Image
        src={banner.imageUrl}
        alt={banner.title || "offer"}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
      {(banner.title || banner.subtitle) && (
        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12">
          {banner.title && (
            <h3 className={`font-display font-black text-white leading-tight mb-1 ${large ? "text-3xl md:text-5xl" : "text-2xl md:text-3xl"}`}>
              {banner.title}
            </h3>
          )}
          {banner.subtitle && (
            <p className="font-body text-white/80 text-sm md:text-lg mt-1">{banner.subtitle}</p>
          )}
          {banner.link && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg group-hover:scale-105 transition-transform">
                {t.common.shopNow} <ExternalLink size={12} />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return banner.link ? (
    <Link href={banner.link}>{content}</Link>
  ) : (
    <div>{content}</div>
  );
}
