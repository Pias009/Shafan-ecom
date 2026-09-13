"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Quote,
  Sparkles,
  CheckCircle2,
  Pause,
  Play,
} from "lucide-react";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  time?: number;
}

interface ApiResponse {
  success: boolean;
  reviews: Review[];
  source: string;
  rating: { average: number; total: number };
  mapsLink?: string;
}

function Stars({ count, size = 16 }: { count: number; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          style={{ width: size, height: size }}
          className={
            s <= count
              ? "text-amber-400 fill-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.4)]"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
    </div>
  );
}

// Official Google "G" Logo
function GoogleLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const AVATAR_GRADIENTS = [
  "from-[#4285F4] to-[#2b6cb0]",
  "from-[#EA4335] to-[#c53030]",
  "from-[#34A853] to-[#276749]",
  "from-[#FBBC05] to-[#d69e2e]",
  "from-[#890754] to-[#540434]",
  "from-[#9C27B0] to-[#6b46c1]",
  "from-[#0097A7] to-[#007791]",
  "from-[#E91E63] to-[#ad1457]",
];

export function GoogleReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState({ average: 5.0, total: 48 });
  const [loading, setLoading] = useState(true);
  const [mapsLink, setMapsLink] = useState("https://g.page/r/CVpq4B6nMffFEB0/review");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [progressKey, setProgressKey] = useState(0);

  // Swipe handlers for mobile touch
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/google-reviews");
        const data: ApiResponse = await res.json();
        if (data.success && data.reviews?.length > 0) {
          setReviews(
            data.reviews.map((r, i) => ({
              ...r,
              id: r.id || `${r.author_name}-${i}`,
            }))
          );
          if (data.rating?.average) setRating(data.rating);
          if (data.mapsLink) setMapsLink(data.mapsLink);
        }
      } catch (err) {
        console.error("Failed to fetch Google reviews:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  const total = reviews.length;

  const nextCard = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev + 1) % total);
    setProgressKey((prev) => prev + 1);
  }, [total]);

  const prevCard = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
    setProgressKey((prev) => prev + 1);
  }, [total]);

  // 2-2.5s Stay Timer: Stays for 2.4s, then automatically advances to next card
  useEffect(() => {
    if (loading || total <= 1 || isPaused) return;

    const timer = setTimeout(() => {
      nextCard();
    }, 2500);

    return () => clearTimeout(timer);
  }, [activeIndex, isPaused, loading, total, nextCard]);

  // Mobile Touch Swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 40) {
      nextCard();
    } else if (diff < -40) {
      prevCard();
    }
    setTouchStart(null);
    setIsPaused(false);
  };

  if (loading) {
    return (
      <section className="w-full py-16 bg-transparent flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#890754]" />
      </section>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <section className="relative w-full bg-transparent py-10 sm:py-16 overflow-hidden my-4 sm:my-6 select-none">
      {/* Soft Ambient Illumination Orbs */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div className="w-[850px] h-[450px] bg-gradient-to-r from-pink-500/5 via-[#890754]/6 to-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1440px] mx-auto px-3 sm:px-6">
        {/* ── Top Header & Hero Scoreboard ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#890754] tracking-tight">
              What Our Customers Say
            </h2>
          </div>

          {/* Right: Live Google Rating Scoreboard & Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
            {/* Google Rating Pillar */}
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-pink-200/70 shadow-xs">
              <GoogleLogo className="w-7 h-7 shrink-0" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-xl sm:text-2xl font-black text-gray-900 font-mono">
                    {rating.average.toFixed(1)}
                  </span>
                  <Stars count={Math.round(rating.average)} size={14} />
                </div>
                <span className="text-[10px] sm:text-[11px] text-gray-500 font-bold mt-1">
                  Based on {rating.total}+ verified reviews
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-full border border-pink-200/80 bg-white hover:bg-pink-50 text-gray-800 text-xs font-bold shadow-2xs transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <span>View on Maps</span>
                <ExternalLink className="w-3 h-3 text-[#890754]" />
              </a>

              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full bg-gradient-to-r from-[#540434] via-[#890754] to-[#a80b67] text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg hover:shadow-pink-900/25 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Write Review</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Sub-bar: Trust Metrics Chips + Play/Pause & Chevron Controls ── */}
        <div className="flex items-center justify-between gap-2 mb-6 pb-2 border-b border-pink-100/60">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-gray-600 bg-white px-2.5 py-1 rounded-full border border-pink-100 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#890754]" />
              100% Genuine Reviews
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-gray-600 bg-white px-2.5 py-1 rounded-full border border-pink-100 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified GCC Orders
            </span>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-[#890754] bg-pink-50/90 hover:bg-pink-100/80 px-2.5 py-1 rounded-full border border-pink-200/70 transition-colors"
            >
              {isPaused ? <Play size={11} className="fill-[#890754]" /> : <Pause size={11} className="fill-[#890754]" />}
              <span>{isPaused ? "Paused (Click to Resume)" : "Auto 2.5s Cycle"}</span>
            </button>
          </div>

          {/* Active Counter & Navigation Chevrons */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold text-gray-400">
              {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={prevCard}
                aria-label="Previous review"
                className="w-8 h-8 rounded-full bg-white shadow-xs border border-pink-200/70 text-[#890754] flex items-center justify-center hover:bg-[#890754] hover:text-white hover:scale-110 active:scale-95 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextCard}
                aria-label="Next review"
                className="w-8 h-8 rounded-full bg-white shadow-xs border border-pink-200/70 text-[#890754] flex items-center justify-center hover:bg-[#890754] hover:text-white hover:scale-110 active:scale-95 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3D Turnover Stage: Active Card stays 2-2.5s, then moves left backward in 3D ── */}
      <div
        className="relative w-full max-w-[1280px] mx-auto px-4 py-2 sm:py-4 flex items-center justify-center min-h-[200px] sm:min-h-[225px] overflow-visible"
        style={{ perspective: "1200px" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative w-full max-w-[360px] sm:max-w-[440px] h-[175px] sm:h-[185px] flex items-center justify-center">
          {reviews.map((review, i) => {
            // Circular offset relative to activeIndex
            let diff = (i - activeIndex) % total;
            if (diff > total / 2) diff -= total;
            if (diff < -total / 2) diff += total;

            // Render active center card, previous (left backward), and next (right waiting)
            const isVisible = Math.abs(diff) <= 1;
            if (!isVisible) return null;

            const isActive = diff === 0;

            const avatarGrad = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
            const initial = review.author_name.charAt(0).toUpperCase() || "C";

            let transformStyle = "";
            let zIndex = 10;
            let opacity = 0.4;

            if (isActive) {
              transformStyle = "translateX(0%) translateZ(30px) rotateY(0deg) scale(1)";
              zIndex = 30;
              opacity = 1;
            } else if (diff < 0) {
              // Moved left and pushed backward in 3D!
              transformStyle = "translateX(-82%) translateZ(-120px) rotateY(20deg) scale(0.86)";
              zIndex = 15;
              opacity = 0.45;
            } else {
              // Waiting on the right in 3D!
              transformStyle = "translateX(82%) translateZ(-120px) rotateY(-20deg) scale(0.86)";
              zIndex = 15;
              opacity = 0.45;
            }

            return (
              <div
                key={review.id}
                onClick={() => {
                  if (!isActive) {
                    setActiveIndex(i);
                    setProgressKey((p) => p + 1);
                  } else {
                    setSelectedReview(review);
                  }
                }}
                style={{
                  transform: transformStyle,
                  zIndex,
                  opacity,
                  transition: "transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease-out, box-shadow 0.5s ease-out",
                  transformStyle: "preserve-3d",
                }}
                className={`absolute inset-0 w-full h-full p-1 rounded-2xl cursor-pointer select-none transition-all ${
                  isActive
                    ? "bg-gradient-to-b from-white via-pink-50/60 to-pink-100/50 border border-pink-300/80 shadow-[0_12px_32px_rgba(137,7,84,0.14)]"
                    : "bg-white/70 backdrop-blur-md border border-pink-200/50 shadow-[0_4px_14px_rgba(137,7,84,0.05)] hover:opacity-80"
                }`}
              >
                {/* Inner Porcelain Core (Doppelrand) */}
                <div className="relative w-full h-full rounded-[calc(1rem-2px)] bg-white/95 backdrop-blur-xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden shadow-inner">
                  {/* Watermark Quote Icon in Background */}
                  <div className="absolute top-2 right-3 pointer-events-none text-pink-900/[0.05]">
                    <Quote size={40} className="rotate-180" />
                  </div>

                  {/* Top Bar: Stars + Verified Google Buyer Chip */}
                  <div className="relative z-10 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Stars count={review.rating} size={13} />
                      <span className="text-[11px] sm:text-xs font-black text-amber-500 font-mono">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[7.5px] sm:text-[8px] font-bold tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Verified
                      </span>
                      <GoogleLogo className="w-3.5 h-3.5 opacity-90 shrink-0" />
                    </div>
                  </div>

                  {/* Review Text Body */}
                  <div className="relative z-10 my-1 sm:my-1.5">
                    <p className="text-gray-800 text-[11px] sm:text-xs leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-3 font-normal">
                      "{review.text}"
                    </p>
                  </div>

                  {/* Author Row + 2s Dwell Progress Bar */}
                  <div className="relative z-10 border-t border-pink-100/70 pt-1.5 sm:pt-2 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr ${avatarGrad} flex items-center justify-center text-white font-black text-[10px] sm:text-xs shadow-2xs ring-1 ring-white shrink-0`}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h5 className="font-bold text-[11px] sm:text-xs text-gray-900 truncate leading-tight">
                              {review.author_name}
                            </h5>
                            <CheckCircle2 size={11} className="text-blue-500 shrink-0" />
                          </div>
                          <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium truncate leading-tight">
                            {review.relative_time_description || "Google Customer"}
                          </p>
                        </div>
                      </div>

                      {isActive && (
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-[#890754] hover:underline whitespace-nowrap hidden xs:inline-block">
                          Read full →
                        </span>
                      )}
                    </div>

                    {/* Active 2.5s Stay Timer Bar */}
                    {isActive && !isPaused && (
                      <div className="w-full h-0.5 sm:h-1 bg-pink-100 rounded-full overflow-hidden mt-0.5">
                        <motion.div
                          key={progressKey}
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2.5, ease: "linear" }}
                          className="h-full bg-gradient-to-r from-[#540434] via-[#890754] to-[#a80b67] rounded-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* ── Interactive Review Detail Modal (Progressive Disclosure) ── */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-pink-200 overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedReview(null)}
                aria-label="Close review modal"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-4">
                <GoogleLogo className="w-6 h-6" />
                <div>
                  <h4 className="font-bold text-base text-gray-900">
                    {selectedReview.author_name}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {selectedReview.relative_time_description || "Verified Google Review"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-4">
                <Stars count={selectedReview.rating} size={18} />
                <span className="font-bold text-sm text-gray-800 ml-1">
                  {selectedReview.rating}.0 / 5.0
                </span>
              </div>

              <blockquote className="text-gray-800 text-sm sm:text-base leading-relaxed bg-pink-50/40 p-4 rounded-2xl border border-pink-100 font-serif italic mb-6">
                "{selectedReview.text}"
              </blockquote>

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                  <CheckCircle2 size={15} /> Verified Customer Experience
                </span>

                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-black uppercase text-[#890754] hover:text-[#540434]"
                >
                  View on Google Maps <ExternalLink size={12} />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

