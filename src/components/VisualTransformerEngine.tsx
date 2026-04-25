"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles, Shield, Zap, Gem, Truck, Star, Flame } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface VisualTransformerProps {
  description: string;
}

interface KeyPoint {
  text: string;
  emoji: React.ReactNode;
  color: string;
}

const EMOJI_MAP: Record<string, { icon: React.ReactNode; color: string }> = {
  "handmade": { icon: <Sparkles className="w-4 h-4" />, color: "#a855f7" },
  "organic": { icon: <Sparkles className="w-4 h-4" />, color: "#10b981" },
  "premium": { icon: <Gem className="w-4 h-4" />, color: "#f59e0b" },
  "luxury": { icon: <Gem className="w-4 h-4" />, color: "#f59e0b" },
  "quality": { icon: <Shield className="w-4 h-4" />, color: "#10b981" },
  "comfort": { icon: <Zap className="w-4 h-4" />, color: "#3b82f6" },
  "breathable": { icon: <Zap className="w-4 h-4" />, color: "#06b6d4" },
  "limited": { icon: <Flame className="w-4 h-4" />, color: "#ef4444" },
  "sale": { icon: <Flame className="w-4 h-4" />, color: "#ef4444" },
  "shipping": { icon: <Truck className="w-4 h-4" />, color: "#8b5cf6" },
  "free": { icon: <Truck className="w-4 h-4" />, color: "#10b981" },
};

function getEmojiConfig(word: string) {
  const lower = word.toLowerCase();
  for (const key of Object.keys(EMOJI_MAP)) {
    if (lower.includes(key)) return EMOJI_MAP[key];
  }
  return { icon: <Star className="w-4 h-4" />, color: "#3b82f6" };
}

function parseDescription(text: string) {
  const sentences = text.split(/(?<=[.!])\s+/).filter(s => s.trim());
  return sentences.map(sentence => {
    const words = sentence.split(/\s+/);
    const points = words.map(word => {
      const clean = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
      return { word, ...getEmojiConfig(clean) };
    });
    return { sentence: sentence.trim(), points };
  });
}

export default function VisualTransformerEngine({ description }: VisualTransformerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const parsed = parseDescription(description);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.fromTo(".keypoint-box", 
        { opacity: 0, y: 40, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.6, 
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };

    const container = containerRef.current;
    container?.addEventListener("mousemove", handleMouseMove);
    return () => container?.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-2xl mx-auto"
    >
      {/* Neon Glow Background */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-20"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(59, 130, 246, 0.4), transparent 50%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Glassmorphic Container */}
      <div className="relative bg-[#050505]/90 backdrop-blur-md rounded-3xl border border-white/10 p-6 md:p-8 overflow-hidden">
        
        {/* Bento Grid Layout */}
        <div className="grid gap-4">
          {parsed.map((item, idx) => (
            <div
              key={idx}
              className="keypoint-box group relative p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              {/* Neon Border on Hover */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: `0 0 20px ${item.points[0]?.color || "#3b82f6"}40, inset 0 0 20px ${item.points[0]?.color || "#3b82f6"}20`,
                }}
              />

              {/* Highlighter Sweep Effect */}
              <div 
                ref={idx === 0 ? highlightRef : undefined}
                className="absolute top-0 left-0 h-full w-[200%] bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-[50%] transition-transform duration-1000 ease-out skew-x-12 pointer-events-none"
              />

              <div className="relative flex items-start gap-3">
                {/* Emoji Badge */}
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ 
                    backgroundColor: `${item.points[0]?.color || "#3b82f6"}20`,
                    color: item.points[0]?.color || "#3b82f6"
                  }}
                >
                  {item.points[0]?.icon || <Star className="w-5 h-5" />}
                </div>

                {/* Sentence Text */}
                <p className="text-gray-200 text-base md:text-lg leading-relaxed tracking-tight font-mono">
                  <span className="text-white">{item.sentence}</span>
                </p>
              </div>

              {/* Key Points Pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {item.points.slice(0, 4).map((point, pIdx) => (
                  <span
                    key={pIdx}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${point.color}20`,
                      color: point.color,
                      fontFamily: "monospace"
                    }}
                  >
                    {point.icon}
                    {point.word.replace(/[^a-zA-Z]/g, "")}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}