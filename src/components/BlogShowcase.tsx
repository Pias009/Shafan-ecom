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
        if (Array.isArray(data)) setPosts(data.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 pt-20 pb-4">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="flex gap-2 px-3 py-1.5 rounded-full bg-black/5 text-black text-[9px] font-semibold uppercase tracking-widest mb-3">
            <BookOpen size={10} />
            Our Blog
          </div>
          <h2 className="text-2xl md:text-4xl font-semibold text-black">Latest Articles</h2>
          
        </div>
        <Link
          href="/blog"
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-black/80 transition-all"
        >
          {t.home.viewAll} <ArrowRight size={12} />
        </Link>
      </div>

<div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:gap-8 md:overflow-visible md:snap-none scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {posts.map((post, i) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group block flex-shrink-0 w-[75vw] max-w-[280px] md:w-auto snap-start"
          >
            <article className="glass-panel-heavy h-[200px] p-4 rounded-2xl hover:shadow-xl hover:shadow-black/15 hover:translate-y-[-2px] hover:scale-[1.02] transition-all duration-300 flex flex-col"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags[0] && (
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-black/40">
                    <Tag size={8} /> {post.tags[0]}
                  </span>
                )}
              </div>
              
              <h3 className="text-sm md:text-base font-medium text-black leading-snug mb-3 line-clamp-3 group-hover:text-black/70 transition-colors">
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

      <div className="flex md:hidden items-center justify-center gap-2 text-gray-400 text-xs">
        <span className="animate-pulse">←</span>
        <span className="text-[10px] font-medium">Swipe to browse</span>
        <span className="animate-pulse">→</span>
      </div>
    </section>
  );
}