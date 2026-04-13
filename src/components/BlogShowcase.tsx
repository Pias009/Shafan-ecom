"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Calendar, Tag, ArrowRight, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[];
  createdAt: string;
}

export function BlogShowcase() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Sort latest first
          const sorted = data.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setPosts(sorted.slice(0, 8));
        }
      })
      .catch(() => {});
  }, []);

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < posts.length - 1;

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentIndex(prev => prev - 1);
      scrollRef.current?.children[currentIndex - 1]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentIndex(prev => prev + 1);
      scrollRef.current?.children[currentIndex + 1]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft: sl, clientWidth } = scrollRef.current;
      const newIndex = Math.round(sl / (clientWidth * 0.75));
      setCurrentIndex(Math.min(newIndex, posts.length - 1));
    }
  };

  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-6 pt-20 pb-4">
      <div className="flex items-end justify-between mb-8 sm:mb-10">
        <div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 text-black text-[9px] font-bold uppercase tracking-widest mb-3 w-fit">
            <BookOpen size={10} />
            Our Blog
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-black tracking-tight tracking-tight">Latest Articles</h2>
        </div>
        <Link
          href="/blog"
          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-black text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-black/80 transition-all active:scale-95"
        >
          {t.home.viewAll || "View All"} <ArrowRight size={12} />
        </Link>
      </div>

      <div className="relative">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 scroll-smooth"
        >
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block snap-start w-[280px] md:w-[320px] lg:w-[350px] flex-shrink-0"
            >
              <article className="glass-panel-heavy h-full min-h-[220px] p-5 rounded-2xl hover:shadow-xl hover:shadow-black/15 hover:translate-y-[-2px] transition-all duration-300 flex flex-col h-full">
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags[0] && (
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-black/40">
                      <Tag size={8} /> {post.tags[0]}
                    </span>
                  )}
                </div>
                
                <h3 className="text-sm md:text-base font-medium text-black leading-snug mb-3 line-clamp-2 group-hover:text-black/70 transition-colors">
                  {post.title}
                </h3>
                
                {post.excerpt && (
                  <p className="text-xs text-black/50 line-clamp-2 flex-1 mb-3">{post.excerpt}</p>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-black/5 mt-auto">
                  <span className="flex items-center gap-1.5 text-[10px] text-black/40 font-medium">
                    <Calendar size={10} />
                    {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-black/40 group-hover:text-black group-hover:gap-2 transition-all">
                    {t.home.readMore} <ArrowRight size={11} />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className={`absolute top-1/2 -left-2 md:-left-4 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-black/10 flex items-center justify-center transition-all ${canScrollLeft ? 'hover:bg-black hover:text-white' : 'opacity-30 cursor-not-allowed hidden md:flex'}`}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={scrollRight}
          disabled={!canScrollRight}
          className={`absolute top-1/2 -right-2 md:-right-4 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-black/10 flex items-center justify-center transition-all ${canScrollRight ? 'hover:bg-black hover:text-white' : 'opacity-30 cursor-not-allowed hidden md:flex'}`}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all disabled:opacity-30"
        >
          <ChevronLeft size={14} className="text-black/60" />
        </button>
        <div className="flex gap-1.5">
          {posts.slice(0, Math.min(posts.length, 6)).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? 'bg-black w-4' : 'bg-black/20'
              }`}
            />
          ))}
        </div>
        <button
          onClick={scrollRight}
          disabled={!canScrollRight}
          className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all disabled:opacity-30"
        >
          <ChevronRight size={14} className="text-black/60" />
        </button>
      </div>
    </section>
  );
}
