"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, ExternalLink, Loader2 } from "lucide-react";

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

function Stars({ count, size = 4 }: { count: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          style={{ width: size, height: size }}
          className={s <= count ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
        />
      ))}
    </div>
  );
}

// Official Google "G" logo
function GoogleLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

const AVATAR_COLORS = [
  "#4285F4", "#EA4335", "#34A853", "#FBBC05", "#9C27B0",
  "#0097A7", "#E91E63", "#FF5722", "#795548", "#607D8B",
];

export function GoogleReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState({ average: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [mapsLink, setMapsLink] = useState("https://maps.google.com/?cid=14264924938566658650");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/google-reviews");
        const data: ApiResponse = await res.json();
        if (data.success && data.reviews?.length > 0) {
          setReviews(data.reviews.map((r, i) => ({ ...r, id: r.id || `${r.author_name}-${i}` })));
          setRating(data.rating);
          if (data.mapsLink) setMapsLink(data.mapsLink);
        }
      } catch {}
      finally { setLoading(false); }
    }
    fetchReviews();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (loading || reviews.length === 0) return;
    let id: number;
    function tick() {
      const el = scrollRef.current;
      if (!el || isDragging) return;
      if (el.scrollLeft >= el.scrollWidth / 3) el.scrollLeft = 0;
      el.scrollLeft += 0.6;
      id = requestAnimationFrame(tick);
    }
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [isDragging, loading, reviews.length]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    scrollRef.current.scrollLeft = scrollLeft.current - (e.pageX - scrollRef.current.offsetLeft - startX.current) * 2;
  }, [isDragging]);
  const onMouseUp = useCallback(() => setIsDragging(false), []);

  if (loading) {
    return (
      <section className="w-full py-16 bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#4285F4]" />
      </section>
    );
  }

  if (reviews.length === 0) return null;

  const track = [...reviews, ...reviews, ...reviews];

  return (
    <section className="w-full bg-gray-50 py-12 sm:py-14 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8"
        >
          <div>
            {/* Google branding row */}
            <div className="flex items-center gap-2 mb-3">
              <GoogleLogo className="w-5 h-5" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Google Reviews</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              What Our Customers Say
            </h2>
            {/* Average row */}
            <div className="flex items-center gap-2.5 mt-2.5">
              <span className="text-3xl font-black text-gray-900">{rating.average.toFixed(1)}</span>
              <div className="flex flex-col gap-0.5">
                <Stars count={Math.round(rating.average)} size={16} />
                <span className="text-xs text-gray-400 font-medium">{rating.total}+ reviews</span>
              </div>
            </div>
          </div>

          {/* Action links */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 text-xs font-bold shadow-sm transition-all"
            >
              <GoogleLogo className="w-3.5 h-3.5" />
              View on Google
              <ExternalLink className="w-3 h-3 opacity-40" />
            </a>
            <a
              href="https://g.page/r/CVpq4B6nMffFEB0/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#4285F4] hover:bg-[#3367d6] text-white text-xs font-bold shadow-sm transition-all"
            >
              ✏️ Write a Review
            </a>
          </div>
        </motion.div>
      </div>

      {/* Review cards */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto cursor-grab active:cursor-grabbing px-6 pb-3 pt-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {track.map((review, i) => {
            const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const initial = review.author_name.charAt(0).toUpperCase();
            return (
              <div
                key={`${review.id}-${i}`}
                className="flex-shrink-0 w-[280px] h-[180px] bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-4 flex flex-col justify-between select-none"
              >
                {/* Top: stars + google logo */}
                <div className="flex items-start justify-between mb-2">
                  <Stars count={review.rating} size={14} />
                  <GoogleLogo className="w-4 h-4 opacity-70 flex-shrink-0" />
                </div>

                {/* Review text */}
                <p className="text-gray-700 text-[12px] leading-relaxed line-clamp-3 flex-1 mb-3">
                  "{review.text}"
                </p>

                {/* Author row */}
                <div className="flex items-center gap-2.5 border-t border-gray-100 pt-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-[11px] shadow-sm"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-[11px] truncate">{review.author_name}</p>
                    <p className="text-[10px] text-gray-400">{review.relative_time_description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
