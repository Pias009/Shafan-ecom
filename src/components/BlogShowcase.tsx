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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white text-[9px] font-black uppercase tracking-widest mb-3">
            <BookOpen size={10} />
            {t.home.ourBlog}
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-black text-black">{t.home.latestAnnouncements}</h2>
          <p className="font-body text-black/50 mt-1">{t.home.tipsOffers}</p>
        </div>
        <Link
          href="/blog"
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-black/80 transition-all"
        >
          {t.home.viewAll} <ArrowRight size={12} />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group block"
          >
            <article className="h-full p-5 rounded-2xl border border-black/5 hover:border-black/20 transition-all duration-300 flex flex-col"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags[0] && (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-black/40">
                  <Tag size={8} /> {post.tags[0]}
                </span>
              )}
            </div>
            
            <h3 className="font-display text-lg font-black text-black leading-tight mb-2 line-clamp-2 group-hover:text-black/70 transition-colors">
              {post.title}
            </h3>
            
            {post.excerpt && (
              <p className="font-body text-sm text-black/50 line-clamp-2 flex-1 mb-4">{post.excerpt}</p>
            )}
            
            <div className="flex items-center justify-between pt-3 border-t border-black/5 mt-auto">
              <span className="flex items-center gap-1.5 text-[10px] text-black/40 font-medium">
                <Calendar size={10} />
                {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-black/40 group-hover:text-black group-hover:gap-2 transition-all">
                {t.home.readMore} <ArrowRight size={11} />
              </span>
            </div>
          </article>
        </Link>
      ))}
      </div>

      <div className="mt-8 flex justify-center md:hidden">
        <Link
          href="/blog"
          className="flex items-center gap-2 px-8 py-3 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest"
        >
          {t.home.viewAll} <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}