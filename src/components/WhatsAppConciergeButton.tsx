"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";

export function WhatsAppConciergeButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const whatsappUrl =
    "https://wa.me/971547206046?text=" +
    encodeURIComponent(
      "Hello Shanfa Global Concierge! I'd like a personalized skincare consultation."
    );

  return (
    <aside
      aria-label="Skincare Concierge"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40"
    >
      <Link
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-[#400327]/95 hover:bg-[#2b0119] backdrop-blur-xl border border-pink-400/30 text-white shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(84,4,52,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
      >
        {/* WhatsApp Icon with pulsing active status */}
        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
            <MessageCircle size={18} />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#400327] animate-pulse" />
        </div>

        {/* Text */}
        <div className="hidden xs:flex flex-col text-left leading-tight pr-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-pink-300 flex items-center gap-1">
            <Sparkles size={10} className="text-amber-300" />
            Concierge Online
          </span>
          <span className="text-xs font-bold text-white group-hover:text-pink-200 transition-colors">
            Ask Skincare Expert
          </span>
        </div>
      </Link>
    </aside>
  );
}
