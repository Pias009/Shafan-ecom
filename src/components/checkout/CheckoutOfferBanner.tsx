"use client";

import { useEffect, useState } from "react";
import { getOptimizedUrl } from "@/lib/cloudinary-url";
import { trackPromotion } from "@/lib/datalayer";
import type { PublicPopupBanner } from "@/lib/popup-banner";

// The live popup banner's offer, shown inline at checkout next to the coupon
// field — so a visitor who closed the popup earlier still sees the code where
// they pay. Only offers that carry a coupon code are shown here.
export function CheckoutOfferBanner({
  country,
  onApply,
  applying,
}: {
  country: string;
  onApply: (code: string) => void;
  applying: boolean;
}) {
  const [banner, setBanner] = useState<PublicPopupBanner | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/popup-banner?country=${country}`)
      .then((res) => res.json())
      .then(({ banner: next }: { banner: PublicPopupBanner | null }) => {
        if (!cancelled) setBanner(next?.code ? next : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [country]);

  if (!banner?.code) return null;
  const code = banner.code;

  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl border border-green-600/20 bg-green-50/70 p-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- small offer thumbnail */}
      <img
        src={getOptimizedUrl(banner.image, 200)}
        alt=""
        className="h-14 w-14 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-green-700">Offer available</p>
        <p className="truncate text-xs font-black uppercase tracking-wider text-black">Use code {code}</p>
      </div>
      <button
        type="button"
        disabled={applying}
        onClick={() => {
          trackPromotion("select_promotion", { id: banner.key, name: code, creative: banner.image });
          onApply(code);
        }}
        className="shrink-0 rounded-lg bg-black px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-black/80 active:scale-95 disabled:opacity-50"
      >
        {applying ? "..." : "Apply"}
      </button>
    </div>
  );
}
