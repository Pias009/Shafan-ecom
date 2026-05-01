"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ShoppingCart, Sparkles, ChevronRight, Heart, Zap, Droplet } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useCartStore } from "@/lib/cart-store";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  tags: string[];
  price: number;
}

const DEFAULT_PRODUCTS: Product[] = [
  { id: "1", name: "Hydrating Face Cream", imageUrl: "/placeholder-product.png", category: "Moisturizers", tags: ["dryness", "hydration", "cream"], price: 45 },
  { id: "2", name: "Oil Control Cleanser", imageUrl: "/placeholder-product.png", category: "Cleansers", tags: ["oily", "acne", "cleanser"], price: 32 },
  { id: "3", name: "Gentle Calming Serum", imageUrl: "/placeholder-product.png", category: "Serums", tags: ["sensitive", "calming", "serum"], price: 55 },
  { id: "4", name: "Night Repair Cream", imageUrl: "/placeholder-product.png", category: "Anti-Aging", tags: ["aging", "night", "cream"], price: 65 },
  { id: "5", name: "Vitamin C Brightening", imageUrl: "/placeholder-product.png", category: "Serums", tags: ["dullness", "brightening", "vitamin-c"], price: 48 },
  { id: "6", name: "Sun Guard SPF 50", imageUrl: "/placeholder-product.png", category: "Sun Care", tags: ["sun", "spf", "protection"], price: 28 },
  { id: "7", name: "Detox Charcoal Mask", imageUrl: "/placeholder-product.png", category: "Masks", tags: ["oily", "detox", "pores"], price: 38 },
];

function SearchModal({ onClose, products }: { onClose: () => void; products: Product[] }) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const filtered = products.filter(
        p => p.name.toLowerCase().includes(q) || 
             p.category.toLowerCase().includes(q) || 
             p.tags.some(t => t.toLowerCase().includes(q))
      );
      setResults(filtered);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, products]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 bg-white/5 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skincare magic..."
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isLoading ? (
          <div className="space-y-3 p-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex gap-4 p-3 bg-white/5 rounded-2xl">
                <div className="w-12 h-12 bg-white/10 rounded-xl" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-2 bg-white/10 rounded w-3/4" />
                  <div className="h-1 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            {results.map(p => (
              <a
                key={p.id}
                href={`/products/${p.id}`}
                className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-all border border-transparent hover:border-white/5"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-white/10">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{p.name}</p>
                  <p className="text-[9px] text-emerald-400 font-black tracking-widest uppercase">${p.price}</p>
                </div>
                <ChevronRight className="w-3 h-3 text-white/20" />
              </a>
            ))}
          </div>
        ) : query ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-30">
            <Search className="w-8 h-8 mb-2" />
            <p className="text-xs">No results found</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 gap-2">
            {["Cleansers", "Moisturizers", "Serums", "Sun Care"].map(cat => (
              <button
                key={cat}
                onClick={() => setQuery(cat)}
                className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-white/60 hover:bg-white/10 hover:text-white transition-all font-bold uppercase tracking-widest"
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Questionnaire({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  const questions = [
    { key: "concern", text: "Skin concern?", icon: <Droplet className="w-4 h-4" />, options: [
      { label: "Dryness", tag: "dryness" },
      { label: "Oily/Acne", tag: "oily" },
      { label: "Sensitive", tag: "sensitive" },
    ]},
    { key: "goal", text: "Goal?", icon: <Sparkles className="w-4 h-4" />, options: [
      { label: "Glow", tag: "brightening" },
      { label: "Clear", tag: "acne" },
      { label: "Hydrate", tag: "hydration" },
    ]},
  ];

  const handleSelect = (option: { label: string; tag: string }) => {
    const newAnswers = [...answers, option.tag];
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      const filtered = DEFAULT_PRODUCTS.filter(p => 
        p.tags.some(t => newAnswers.includes(t))
      );
      setRecommendations(filtered.length > 0 ? filtered : DEFAULT_PRODUCTS.slice(0, 2));
    }
  };

  const handleReset = () => {
    setStep(0);
    setAnswers([]);
    setRecommendations([]);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-6">
      <AnimatePresence mode="wait">
        {recommendations.length > 0 ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="text-center">
              <Heart className="w-6 h-6 text-emerald-400 fill-emerald-400 mx-auto mb-2" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Recommended</h3>
            </div>
            <div className="space-y-2">
              {recommendations.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-white/10">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-emerald-400">${p.price}</p>
                  </div>
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                </div>
              ))}
            </div>
            <button onClick={handleReset} className="w-full py-3 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/10 transition-all text-white/60">
              Retake
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Step {step + 1} / 2</span>
              <div className="flex gap-1">
                {[0, 1].map(i => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? "w-6 bg-emerald-400" : "w-2 bg-white/10"}`} />
                ))}
              </div>
            </div>
            <h3 className="text-lg font-black text-white leading-tight">{questions[step].text}</h3>
            <div className="grid grid-cols-1 gap-2">
              {questions[step].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(opt)}
                  className="group relative p-4 bg-white/5 hover:bg-emerald-400/20 border border-white/10 hover:border-emerald-400/50 rounded-2xl text-xs text-left text-white/80 hover:text-white transition-all font-bold"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SesiWidget() {
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"search" | "quiz">("quiz");
  const [hydrated, setHydrated] = useState(false);
  
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHydrated(true); }, []);

  if (!hydrated) return null;

  return (
    <motion.div
      ref={widgetRef}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      initial={{ x: window.innerWidth - 80, y: window.innerHeight - 100 }}
      className="fixed z-[9999] touch-none select-none"
    >
      {/* Product Added Message Bubble */}
      <AnimatePresence>
        {cartCount > 0 && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-2 bg-emerald-500 text-white rounded-2xl shadow-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest border border-white/20 pointer-events-none"
          >
            {cartCount} {cartCount === 1 ? 'Product' : 'Products'} added 🛍️
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rotate-45 -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, y: -20, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0, filter: "blur(20px)" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            style={{ 
              transformOrigin: "center center",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -100%)"
            }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 w-[280px] sm:w-[380px] h-[400px] sm:h-[550px] overflow-hidden rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()} 
          >
            {/* 3D Liquid Glass Background */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-black/80">
              <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-emerald-500/20 via-teal-900/40 to-blue-900/40 opacity-80 backdrop-blur-[60px]" />
              <div className="absolute inset-0 border border-white/20 rounded-[3rem] pointer-events-none" />
            </div>

            {/* Modal Content */}
            <div className="relative z-10 flex flex-col h-full backdrop-blur-[20px]">
              {/* Header */}
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full border border-white/20 p-0.5 bg-black/50">
                    <Image src="/sesi-avatar.png" alt="Sesi" fill className="object-cover rounded-full" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">Sesi AI</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition-all border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <div className="px-6 py-4 flex gap-2">
                <button
                  onClick={() => setMode("quiz")}
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === "quiz" ? "bg-white text-black" : "bg-white/5 text-white/40 border border-white/5"
                  }`}
                >
                  Quiz
                </button>
                <button
                  onClick={() => setMode("search")}
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    mode === "search" ? "bg-white text-black" : "bg-white/5 text-white/40 border border-white/5"
                  }`}
                >
                  Search
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden">
                {mode === "search" ? (
                  <SearchModal onClose={() => setIsOpen(false)} products={DEFAULT_PRODUCTS} />
                ) : (
                  <Questionnaire onClose={() => setIsOpen(false)} />
                )}
              </div>

              {/* View Cart Button */}
              {cartCount > 0 && (
                <div className="px-6 pb-2">
                  <button 
                    onClick={() => router.push("/cart")}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-3 transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Checkout Now ({cartCount})
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="p-4 text-center">
                <p className="text-[8px] text-white/20 font-black tracking-[0.4em] uppercase">Shanfaglobal.com</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button Container */}
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`relative w-16 h-16 rounded-full p-1 shadow-2xl transition-all duration-500 overflow-hidden ${
            isOpen 
              ? "bg-white ring-4 ring-white/30" 
              : "bg-gradient-to-br from-emerald-400 via-teal-600 to-blue-600 ring-4 ring-emerald-500/20"
          } cursor-grab active:cursor-grabbing`}
        >
          <div className="relative w-full h-full rounded-full overflow-hidden bg-black/20 pointer-events-none flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                >
                  <X className="w-6 h-6 text-black" />
                </motion.div>
              ) : (
                <motion.div
                  key="sesi"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative w-full h-full"
                >
                  <Image src="/sesi-avatar.png" alt="Sesi" fill className="object-cover" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
        
        {/* Cart Redirect Button (Small sidecar) */}
        {cartCount > 0 && !isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => router.push("/cart")}
            className="absolute -top-1 -right-1 w-8 h-8 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-xl border border-emerald-500/20 transition-all hover:scale-110 active:scale-90"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-md">
              {cartCount}
            </span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}