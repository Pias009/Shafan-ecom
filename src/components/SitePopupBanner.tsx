"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useCountryStore } from "@/lib/country-store";
import { getOptimizedUrl } from "@/lib/cloudinary-url";
import { trackPromotion } from "@/lib/datalayer";
import type { PublicPopupBanner } from "@/lib/popup-banner";

// Site-wide popup banner set from Admin → Discounts & coupons → Popup Banner.
// Shown once per visitor, on whichever page they land on. The seen key
// includes the banner version, so a new banner is shown once more.

const SEEN_KEY = "site_popup_seen";
const SHOW_DELAY_MS = 1200;
// Shown on the checkout page (/cart) too, but never mid-payment or on the
// order-confirmation page.
const BLOCKED_PREFIXES = ["/checkout/payment", "/checkout/success"];

export default function SitePopupBanner() {
  const pathname = usePathname();
  const router = useRouter();
  const hasHydrated = useCountryStore((s) => s._hasHydrated);
  const country = useCountryStore((s) => s.selectedCountry);
  const [banner, setBanner] = useState<PublicPopupBanner | null>(null);
  const [open, setOpen] = useState(false);
  const checkedRef = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Decide once per page load, on the landing page. Runs once after the
  // country store hydrates; only unmount cancels it, so navigating during the
  // short delay doesn't lose the popup.
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const countryRef = useRef(country);
  countryRef.current = country;

  useEffect(() => {
    if (!hasHydrated || checkedRef.current) return;
    if (BLOCKED_PREFIXES.some((p) => pathRef.current?.startsWith(p))) return;
    checkedRef.current = true;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    fetch(`/api/popup-banner?country=${countryRef.current || "AE"}`)
      .then((res) => res.json())
      .then(({ banner: next }: { banner: PublicPopupBanner | null }) => {
        if (cancelled || !next) return;
        try {
          if (localStorage.getItem(SEEN_KEY) === next.key) return;
        } catch {
          return; // storage blocked — can't guarantee "once", so don't show
        }
        // Warm the image so it appears fully drawn, not loading.
        const img = new Image();
        img.src = getOptimizedUrl(next.image, 1200);
        timer = setTimeout(() => {
          if (cancelled) return;
          // Don't open over a checkout the visitor navigated to meanwhile.
          if (BLOCKED_PREFIXES.some((p) => pathRef.current?.startsWith(p))) return;
          setBanner(next);
          setOpen(true);
          try {
            localStorage.setItem(SEEN_KEY, next.key);
          } catch {}
          trackPromotion("view_promotion", { id: next.key, name: next.code || "popup", creative: next.image });
        }, SHOW_DELAY_MS);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      // Strict Mode re-runs effects; let the re-run try again.
      checkedRef.current = false;
    };
  }, [hasHydrated]);

  // Escape closes; lock page scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [open]);

  async function handleBannerClick() {
    if (!banner || banner.action === "NONE") return;
    trackPromotion("select_promotion", { id: banner.key, name: banner.code || "popup", creative: banner.image });

    if (banner.action === "COPY_CODE" && banner.code) {
      try {
        await navigator.clipboard.writeText(banner.code);
        toast.success(`Code ${banner.code} copied — use it at checkout`);
      } catch {
        toast(`Your code: ${banner.code}`);
      }
      setOpen(false);
      return;
    }

    if (banner.action === "LINK" && banner.link) {
      setOpen(false);
      if (banner.link.startsWith("/")) router.push(banner.link);
      else window.open(banner.link, "_blank", "noopener,noreferrer");
    }
  }

  const clickable = !!banner && banner.action !== "NONE";

  return (
    <AnimatePresence>
      {open && banner && (
        <motion.div
          key="site-popup"
          role="dialog"
          aria-modal="true"
          aria-label={banner.code ? `Offer: ${banner.code}` : "Special offer"}
          data-lenis-prevent
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg ring-1 ring-black/10 transition hover:scale-105 active:scale-95"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* Images ignore pointer events site-wide (globals.css), so the
                wrapper takes the click. */}
            <div
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={handleBannerClick}
              onKeyDown={(e) => clickable && (e.key === "Enter" || e.key === " ") && handleBannerClick()}
              className={`overflow-hidden rounded-2xl shadow-2xl ${clickable ? "cursor-pointer" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- natural aspect ratio, sized by viewport */}
              <img
                src={getOptimizedUrl(banner.image, 1200)}
                alt={banner.code ? `Offer — use code ${banner.code}` : "Special offer"}
                className="block h-auto w-auto max-h-[85vh] max-w-[min(92vw,760px)] select-none"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
