"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Calendar, Tag, ArrowRight, BookOpen, Search } from "lucide-react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  tags: string[];
  createdAt: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];
  const [activeTag, setActiveTag] = useState(t.blog.all);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allTags = [t.blog.all, ...Array.from(new Set(posts.flatMap((p) => p.tags))).sort()];

  const filtered = posts.filter((p) => {
    const matchTag = activeTag === t.blog.all || p.tags.includes(activeTag);
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.excerpt || "").toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen relative z-0">
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/[0.03] to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-full mb-6">
            <BookOpen size={12} />
            <span className="text-xs font-black uppercase tracking-widest">
                {t.blog.announcements}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-black mb-4 leading-tight">
            {t.blog.title}
          </h1>
          <p className="text-base text-black/60 max-w-xl mx-auto">
            {t.blog.subtitle}
          </p>

          <div className="mt-8 max-w-md mx-auto relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
            <input
              type="text"
              placeholder={t.blog.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-5 rounded-full border border-black/10 text-sm font-bold text-black placeholder:text-black/30 outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
        </div>
      </section>

      {allTags.length > 1 && (
        <div className="max-w-7xl mx-auto px-6 mb-10 flex flex-wrap gap-2 justify-center">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                activeTag === tag
                  ? "bg-black text-white"
                  : "border border-black/10 text-black/60 hover:text-black hover:bg-black/5"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 pb-24">
        {loading && (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 rounded-full border-4 border-black/10 border-t-black animate-spin" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <BookOpen size={48} className="mx-auto text-black/20 mb-4" />
            <p className="font-bold text-black/40 text-lg">{t.blog.noPosts}</p>
          </div>
        )}

        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block rounded-2xl overflow-hidden border border-black/5 hover:border-black/20 transition-all mb-10"
          >
            <div className="md:grid md:grid-cols-2">
              <div className="relative aspect-[16/9] md:aspect-auto overflow-hidden bg-black/5">
                {featured.coverImage ? (
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-black/10">
                    <BookOpen size={64} />
                  </div>
                )}
              </div>
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="flex flex-wrap gap-2 mb-4">
                  {featured.tags.slice(0, 3).map((tTag) => (
                    <span key={tTag} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-black/40">
                      <Tag size={10} /> {tTag}
                    </span>
                  ))}
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-black leading-tight mb-4">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="text-black/60 line-clamp-3 mb-6">{featured.excerpt}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-black/40 font-bold">
                    <Calendar size={12} />
                    {new Date(featured.createdAt).toLocaleDateString(currentLanguage.code === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black group-hover:gap-4 transition-all">
                    {t.blog.readMore} <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {rest.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-black/5 hover:border-black/20 transition-all"
              >
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.slice(0, 2).map((tTag) => (
                      <span key={tTag} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-black/40">
                        <Tag size={9} /> {tTag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-black text-black leading-tight mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-black/50 line-clamp-2 flex-1 mb-4">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-black/5">
                    <span className="flex items-center gap-1.5 text-[10px] text-black/40 font-bold">
                      <Calendar size={10} />
                      {new Date(post.createdAt).toLocaleDateString(currentLanguage.code === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <ArrowRight size={14} className="text-black/30 group-hover:text-black group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}