"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="inline-flex items-center gap-2 glass-panel rounded-full px-5 py-2 mb-3">
            <BookOpen size={12} className="text-black/40" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black/60">{t.home.ourBlog}</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-black text-black">{t.home.latestAnnouncements}</h2>
          <p className="font-body text-black/50 mt-1">{t.home.tipsOffers}</p>
        </div>
        <Link
          href="/announcements"
          className="group hidden md:flex items-center gap-2 px-6 py-3 glass-panel rounded-full text-xs font-black uppercase tracking-widest text-black/60 hover:text-black hover:bg-black/5 transition-all"
        >
          {t.home.viewAll} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <Link
            key={post.id}
            href={`/announcements/${post.slug}`}
            className="group glass-panel-heavy rounded-[1.5rem] overflow-hidden border border-black/5 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col"
          >
            {/* Image */}
            <div className="relative aspect-[16/9] overflow-hidden bg-black/5">
              {post.coverImage ? (
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-108"
                  priority={i === 0}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/10 flex items-center justify-center">
                  <BookOpen size={40} className="text-black/15" />
                </div>
              )}
              {/* Tag badge */}
              {post.tags[0] && (
                <div className="absolute top-3 left-3">
                  <span className="glass-panel rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest text-black/60 flex items-center gap-1">
                    <Tag size={8} /> {post.tags[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-display text-lg font-black text-black leading-tight line-clamp-2 mb-2 group-hover:text-black/70 transition-colors">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="font-body text-sm text-black/50 line-clamp-2 flex-1 mb-4">{post.excerpt}</p>
              )}
              <div className="flex items-center justify-between mt-auto">
                <span className="flex items-center gap-1.5 text-[10px] text-black/40 font-bold">
                  <Calendar size={10} />
                  {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-black/40 group-hover:text-black group-hover:gap-2 transition-all">
                  {t.home.readMore} <ArrowRight size={11} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile See All */}
      <div className="mt-8 flex justify-center md:hidden">
        <Link
          href="/announcements"
          className="flex items-center gap-2 px-8 py-3 glass-panel rounded-full text-xs font-black uppercase tracking-widest text-black/60 hover:text-black"
        >
          {t.home.viewAll} <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
