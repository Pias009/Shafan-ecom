"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";

export function NoticeBoard() {
  const [isVisible, setIsVisible] = useState(true);

  // Sample notices - in production, these would come from API
  const notices = [
    { id: 1, text: "🎁 Special Offer: Get 20% off on all skincare products!" },
    { id: 2, text: "🚚 Free shipping on orders above AED 200" },
    { id: 3, text: "✨ New Arrivals: Check out our latest products" },
  ];

  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);

  // Auto-rotate notices every 5 seconds
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setCurrentNoticeIndex((prev) => (prev + 1) % notices.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible, notices.length]);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 py-2 px-3 md:px-4 fixed top-0 left-0 right-0 z-[60]">
      {/* Animated background dots */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-amber-400 rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-orange-400 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-amber-400 rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between relative gap-2">
        {/* Left arrow - Hidden on mobile */}
        <button
          onClick={() => setCurrentNoticeIndex((prev) => (prev - 1 + notices.length) % notices.length)}
          className="hidden md:block text-amber-600 hover:text-amber-800 p-1 shrink-0"
          aria-label="Previous notice"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Notice content */}
        <div className="flex-1 text-center px-2 md:px-8 overflow-hidden">
          <p className="text-[10px] md:text-sm font-bold text-amber-900 tracking-tight md:tracking-wide truncate md:whitespace-normal">
            {notices[currentNoticeIndex].text}
          </p>
        </div>

        {/* Right arrow - Hidden on mobile */}
        <button
          onClick={() => setCurrentNoticeIndex((prev) => (prev + 1) % notices.length)}
          className="hidden md:block text-amber-600 hover:text-amber-800 p-1 shrink-0"
          aria-label="Next notice"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Close button - Better positioned for mobile */}
        <button
          onClick={() => setIsVisible(false)}
          className="text-amber-500 hover:text-amber-700 p-1 shrink-0"
          aria-label="Close notice board"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}