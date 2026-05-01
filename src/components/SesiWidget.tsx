"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ShoppingCart, Droplets, Sparkles, ChevronRight, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  tags: string[];
  price: number;
}

interface SimpleProductSuggestionProps {
  products: Product[];
}

const DEFAULT_PRODUCTS: Product[] = [
  { id: "1", name: "Hydrating Face Cream", imageUrl: "/placeholder-product.png", category: "skincare", tags: ["dryness", "hydration"], price: 45 },
  { id: "2", name: "Oil Control Cleanser", imageUrl: "/placeholder-product.png", category: "skincare", tags: ["oily", "acne"], price: 32 },
  { id: "3", name: "Gentle Calming Serum", imageUrl: "/placeholder-product.png", category: "skincare", tags: ["sensitive", "calming"], price: 55 },
  { id: "4", name: "Night Repair Cream", imageUrl: "/placeholder-product.png", category: "skincare", tags: ["aging", "night"], price: 65 },
  { id: "5", name: "Vitamin C Brightening", imageUrl: "/placeholder-product.png", category: "skincare", tags: ["dullness", "brightening"], price: 48 },
];

function useInactivityTimer(onIdle: () => void, timeoutMs: number = 180000) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onIdle, timeoutMs);
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [onIdle, timeoutMs]);
}

function MouseOrb({ isActive }: { isActive: boolean }) {
  const orbRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isActive || !orbRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const orb = orbRef.current!;
      const rect = orb.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) * 0.15;
      const deltaY = (e.clientY - centerY) * 0.15;
      
      orb.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isActive]);

  return (
    <motion.div
      ref={orbRef}
      animate={{
        scale: isActive ? [1, 1.1, 1] : [1, 1.05, 1],
      }}
      transition={{
        duration: isActive ? 2 : 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="relative w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/30"
    >
      <div className="absolute inset-1 rounded-full bg-white/20 backdrop-blur-sm" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white animate-pulse" />
      {!isActive && (
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 rounded-full"
        />
      )}
    </motion.div>
  );
}

function SearchModal({ onClose, products }: { onClose: () => void; products: Product[] }) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      const filtered = products.filter(
        p => p.name.toLowerCase().includes(q) || 
             p.category.toLowerCase().includes(q) || 
             p.tags.some(t => t.toLowerCase().includes(q))
      );
      setResults(filtered);
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [query, products]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="absolute bottom-16 right-0 w-80 md:w-96 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
    >
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="p-2">
            {results.map(p => (
              <a
                key={p.id}
                href={`/products/${p.id}`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{p.name}</p>
                  <p className="text-xs text-white/50">${p.price}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </a>
            ))}
          </div>
        ) : query ? (
          <div className="p-4 text-center text-white/50 text-sm">
            No products found
          </div>
        ) : (
          <div className="p-4 text-center text-white/50 text-sm">
            Type to search...
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Questionnaire({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  const questions = [
    { key: "concern", text: "What is your primary skin concern?", options: [
      { label: "Dryness", tag: "dryness" },
      { label: "Oily/Acne", tag: "oily" },
      { label: "Sensitive", tag: "sensitive" },
    ]},
    { key: "goal", text: "What's your goal?", options: [
      { label: "Hydration", tag: "hydration" },
      { label: "Control Oil", tag: "oil-control" },
      { label: "Calming", tag: "calming" },
    ]},
    { key: "time", text: "When do you prefer to use products?", options: [
      { label: "Morning", tag: "morning" },
      { label: "Night", tag: "night" },
      { label: "Anytime", tag: "daily" },
    ]},
  ];

  const handleSelect = (option: { label: string; tag: string }) => {
    const newAnswers = [...answers, option.tag];
    setAnswers(newAnswers);

    if (step < 2) {
      setStep(step + 1);
    } else {
      const filtered = DEFAULT_PRODUCTS.filter(p => 
        p.tags.some(t => newAnswers.includes(t) || newAnswers.some(a => p.tags.includes(a)))
      );
      setRecommendations(filtered.length > 0 ? filtered : DEFAULT_PRODUCTS.slice(0, 3));
    }
  };

  const handleReset = () => {
    setStep(0);
    setAnswers([]);
    setRecommendations([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="absolute bottom-16 right-0 w-80 md:w-96 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">Skin Quiz</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>

      <div className="p-4">
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-white/70 mb-3">Recommended for you:</p>
            {recommendations.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{p.name}</p>
                  <p className="text-xs text-emerald-400">${p.price}</p>
                </div>
                <button className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg transition-colors">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            ))}
            <button onClick={handleReset} className="w-full py-2 text-xs text-white/50 hover:text-white transition-colors">
              Start Over
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-white mb-4">{questions[step].text}</p>
            <div className="grid grid-cols-1 gap-2">
              {questions[step].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(opt)}
                  className="p-3 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 rounded-xl text-sm text-white transition-all text-left"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-1 mt-3">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i <= step ? "w-4 bg-emerald-500" : "w-1 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function SesiWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [mode, setMode] = useState<"search" | "quiz">("search");
  const [hydrated, setHydrated] = useState(false);

  // --- Smooth drag via direct DOM mutation (no React re-render per frame) ---
  const widgetRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });          // persisted logical position
  const dragState = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const hasDraggedRef = useRef(false);              // distinguish click vs drag
  const lastActivityRef = useRef(Date.now());

  /** Apply position directly to the DOM element — zero React involvement. */
  const applyTransform = useCallback((x: number, y: number) => {
    if (!widgetRef.current) return;
    widgetRef.current.style.transform = `translate(${x}px, ${y}px)`;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return; // don't steal clicks
    e.currentTarget.setPointerCapture(e.pointerId);
    hasDraggedRef.current = false;
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: posRef.current.x,
      originY: posRef.current.y,
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDraggedRef.current = true;
    const size = 64;
    const newX = Math.max(0, Math.min(window.innerWidth  - size, dragState.current.originX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - size, dragState.current.originY + dy));
    posRef.current = { x: newX, y: newY };
    applyTransform(newX, newY);
  }, [applyTransform]);

  const onPointerUp = useCallback(() => {
    dragState.current.active = false;
  }, []);

  const handleFabClick = useCallback(() => {
    if (hasDraggedRef.current) return; // was a drag, not a tap
    setIsOpen(prev => !prev);
  }, []);

  useEffect(() => { setHydrated(true); }, []);

  useInactivityTimer(() => { setIsIdle(true); }, 180000);

  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime > 45 * 60 * 1000) {
        toast((t) => (
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-sm">Stay hydrated! 💧</span>
            <button onClick={() => toast.dismiss(t.id)} className="ml-2 text-xs text-white/50 hover:text-white">
              Dismiss
            </button>
          </div>
        ), { duration: 5000 });
      }
      lastActivityRef.current = Date.now();
    }, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, [hydrated]);

  useEffect(() => {
    const onActivity = () => {
      setIsIdle(false);
      lastActivityRef.current = Date.now();
    };
    window.addEventListener("mousedown", onActivity);
    window.addEventListener("keydown",   onActivity);
    return () => {
      window.removeEventListener("mousedown", onActivity);
      window.removeEventListener("keydown",   onActivity);
    };
  }, []);

  // Default position: bottom-right corner
  useEffect(() => {
    if (!widgetRef.current) return;
    const x = window.innerWidth  - 80;
    const y = window.innerHeight - 80;
    posRef.current = { x, y };
    applyTransform(x, y);
  }, [hydrated, applyTransform]);

  return (
    <div
      ref={widgetRef}
      className="fixed z-50 top-0 left-0 will-change-transform"
      style={{ touchAction: 'none', cursor: dragState.current.active ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-14 right-0"
          >
            <div className="mb-2 flex gap-2">
              <button
                onClick={() => setMode("search")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  mode === "search" 
                    ? "bg-emerald-500 text-white" 
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                <Search className="w-3 h-3 inline mr-1" />
                Search
              </button>
              <button
                onClick={() => setMode("quiz")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  mode === "quiz" 
                    ? "bg-emerald-500 text-white" 
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                <Sparkles className="w-3 h-3 inline mr-1" />
                Quiz
              </button>
            </div>
            {mode === "search" ? (
              <SearchModal onClose={() => setIsOpen(false)} products={DEFAULT_PRODUCTS} />
            ) : (
              <Questionnaire onClose={() => setIsOpen(false)} />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        onClick={handleFabClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ cursor: 'inherit' }}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all ${
          isOpen
            ? "bg-white text-black"
            : "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500"
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="orb"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MouseOrb isActive={!isIdle && !isOpen} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}