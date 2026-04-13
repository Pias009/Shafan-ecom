"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Tag, ArrowRight, BookOpen } from "lucide-react";
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

const COLORS = [
  "bg-emerald-50",
  "bg-blue-50", 
  "bg-amber-50",
  "bg-rose-50",
  "bg-violet-50",
  "bg-cyan-50",
];

export function BlogShowcase() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

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

  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-6 pt-20 pb-4">
      <div className="flex items-end justify-between mb-8 sm:mb-10">
        <div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 text-black text-[9px] font-bold uppercase tracking-widest mb-3 w-fit">
            <BookOpen size={10} />
            Our Blog
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-black tracking-tight">Latest Articles</h2>
        </div>
        <Link
          href="/blog"
          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-black text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-black/80 transition-all active:scale-95"
        >
          {t.home.viewAll || "View All"} <ArrowRight size={12} />
        </Link>
      </div>

      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        {posts.map((post, i) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group block flex-shrink-0 w-[85vw] sm:w-[350px] md:w-[400px] snap-start"
          >
            <article className="glass-panel-heavy h-[220px] sm:h-[240px] p-6 rounded-[2rem] hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1 transition-all duration-500 flex flex-col relative overflow-hidden group/card"
            >
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.02] rounded-bl-[4rem] -mr-10 -mt-10 group-hover/card:scale-110 transition-transform duration-700" />

              <div className="flex flex-wrap gap-2 mb-4 relative">
                {post.tags[0] && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 text-[8px] font-black uppercase tracking-widest text-black/60 group-hover/card:bg-black group-hover/card:text-white transition-colors duration-300">
                    <Tag size={9} /> {post.tags[0]}
                  </span>
                )}
              </div>
              
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-black leading-tight mb-4 line-clamp-2 group-hover:text-black/80 transition-colors tracking-tight">
                {post.title}
              </h3>
              
              {post.excerpt && (
                <p className="text-xs sm:text-sm text-black/40 line-clamp-2 flex-1 mb-4 font-medium leading-relaxed">
                  {post.excerpt}
                </p>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-black/5 mt-auto relative">
                <span className="flex items-center gap-1.5 text-[10px] text-black/30 font-bold uppercase tracking-widest">
                  <Calendar size={10} />
                  {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-black group-hover:gap-2 transition-all">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t.home.readMore || "Read More"}</span>
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 mt-2 opacity-30">
        <div className="flex items-center gap-2 group cursor-pointer hover:opacity-100 transition-opacity">
           <ArrowRight className="rotate-180" size={16} />
           <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Drag or Scroll</span>
           <ArrowRight size={16} />
        </div>
      </div>
    </section>
  );
}