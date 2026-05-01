"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, Quote, ExternalLink, Loader2 } from "lucide-react";

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
  error?: string;
  message?: string;
  reviews: Review[];
  source: string;
  rating: {
    average: number;
    total: number;
  };
}

export function GoogleReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState({ average: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/google-reviews");
        const data: ApiResponse = await res.json();
        setSource(data.source || "");
        if (data.success && data.reviews && data.reviews.length > 0) {
          const reviewsWithId = data.reviews.map((r, i) => ({
            ...r,
            id: r.id || `${r.author_name}-${r.time || i}`,
          }));
          setReviews(reviewsWithId);
          setRating(data.rating);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  const duplicateReviews = [...reviews, ...reviews, ...reviews];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (loading || reviews.length === 0) return;

    const el = scrollRef.current;
    if (!el) return;

    const scrollSpeed = 0.8;
    let animationId: number;

    function autoScroll() {
      const el = scrollRef.current;
      if (!el || isDragging) return;
      
      if (el.scrollLeft >= el.scrollWidth / 3) {
        el.scrollLeft = 0;
      }
      el.scrollLeft += scrollSpeed;
      animationId = requestAnimationFrame(autoScroll);
    }

    animationId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationId);
  }, [isDragging, loading, reviews.length]);

  if (loading) {
    return (
      <section className="w-full bg-gradient-to-b from-white to-gray-50 py-12 md:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading reviews...</p>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-gradient-to-b from-white to-gray-50 py-12 md:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(rating.average) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="text-lg font-bold text-gray-800">{rating.average.toFixed(1)}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-black text-gray-900 mb-2">
            What Our Customers Say
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <a
              href="https://www.google.com/maps/place/SHANFA+GLOBAL/@25.2638,55.3039,15z/data=!4m6!3m5!1s0x3e5f43676a0d952b:0xed64f06126eee0ed!8m2!3d25.2638!4d55.3039!16s%2Fg%2F11vsw0_6wz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              See more live reviews on Google <ExternalLink className="w-4 h-4" />
            </a>
            <span className="hidden sm:inline text-gray-300">|</span>
            <a
              href="https://g.page/r/CVpq4B6nMffFEB0/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Write a Review <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto cursor-grab active:cursor-grabbing scrollbar-hide gap-4 px-2 pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {duplicateReviews.map((review, index) => (
            <div
              key={`${review.id}-${index}`}
              className="flex-shrink-0 w-[280px] sm:w-[260px] md:w-[240px] lg:w-[220px] bg-white rounded-xl shadow-md border border-gray-100 p-4 select-none hover:shadow-lg transition-shadow"
            >
              <Quote className="w-6 h-6 text-blue-200 mb-2" />
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed line-clamp-4 mb-3 italic">
                "{review.text}"
              </p>
              <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">
                    {review.author_name.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-xs truncate">{review.author_name}</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-2.5 h-2.5 ${star <= review.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400">{review.relative_time_description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
